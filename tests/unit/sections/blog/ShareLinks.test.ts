import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte';
import ShareLinks from '$lib/components/sections/blog/ShareLinks.svelte';

const title = 'Hello | ሰላም';
const url = 'https://kidusder.com/blog/hello';

function setup() {
	return render(ShareLinks, { props: { title, url } });
}

describe('ShareLinks', () => {
	let writeText: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		writeText = vi.fn(() => Promise.resolve());
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
			writable: true
		});
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('links to X with the title and url encoded', () => {
		const { getByRole } = setup();
		const link = getByRole('link', { name: /share on x/i });
		expect(link).toHaveAttribute(
			'href',
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
		);
	});

	it('links to LinkedIn with the url encoded', () => {
		const { getByRole } = setup();
		expect(getByRole('link', { name: /share on linkedin/i })).toHaveAttribute(
			'href',
			`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
		);
	});

	it('opens share targets in a new tab safely', () => {
		const { getAllByRole } = setup();
		for (const link of getAllByRole('link')) {
			expect(link).toHaveAttribute('target', '_blank');
			expect(link.getAttribute('rel')).toContain('noopener');
		}
	});

	it('copies the url and shows a transient confirmation', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		const { getByRole, findByRole } = setup();
		await fireEvent.click(getByRole('button', { name: 'Copy link' }));
		expect(writeText).toHaveBeenCalledWith(url);
		await findByRole('button', { name: 'Copied' });

		await vi.advanceTimersByTimeAsync(1500);
		await waitFor(() => expect(getByRole('button', { name: 'Copy link' })).toBeInTheDocument());
	});

	it('uses sentence-case labels and no interpunct', () => {
		const { container } = setup();
		expect(container.textContent).not.toContain('·');
		expect(container.textContent).not.toContain('COPY LINK');
	});
});
