import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import EducationCard from '$lib/components/sections/about/Education.svelte';
import { education } from '$content/education';
import type { Education } from '$lib/types/content';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());

function setup(overrides: Partial<Education> = {}) {
	return render(EducationCard, { props: { education: { ...education, ...overrides } } });
}

describe('Education', () => {
	afterEach(cleanup);

	it('names the degree and the school', () => {
		const { getByText } = setup();
		expect(getByText('BSc Computing Science, Minor in Economics')).toBeInTheDocument();
		expect(getByText('University of Alberta')).toBeInTheDocument();
	});

	it('spells the graduation month the way the timeline does', () => {
		const { container } = setup();
		expect(container.querySelector('.education__graduation')).toHaveTextContent('June 2026');
	});

	it('shows the optional detail line only when there is one', () => {
		const { container } = setup();
		expect(container.querySelector('.education__detail')).toBeNull();

		cleanup();

		const withDetail = setup({ detail: 'Certificate in Innovation and Entrepreneurship' });
		expect(withDetail.container.querySelector('.education__detail')).toHaveTextContent(
			'Certificate in Innovation and Entrepreneurship'
		);
	});
});
