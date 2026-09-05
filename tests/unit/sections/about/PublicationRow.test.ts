import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import PublicationRow from '$lib/components/sections/about/PublicationRow.svelte';
import type { Publication } from '$lib/types/content';
import { durations, easings } from '$lib/motion/config';
import { animateMock, resetMotionMocks, preferReducedMotion } from '../../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../../mocks/motion')).motionModule());

const base: Publication = {
	id: '2502.10920',
	title: 'Do Deepfake Detectors Work in Reality?',
	venue: 'ACM',
	year: 2025,
	url: 'https://arxiv.org/abs/2502.10920',
	officialUrl: 'https://dl.acm.org/doi/10.1145/3709022.3736545',
	topics: ['deepfake', 'benchmark'],
	bullets: [
		'Investigated super-resolution post-processing.',
		'Built a real-world faceswap dataset.'
	]
};

/** Pin an element's rendered height — jsdom reports 0 for everything. */
function stubHeight(el: HTMLElement, height: number) {
	vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
		...new DOMRect(0, 0, 0, height),
		height
	} as DOMRect);
}

function setup(pub: Partial<Publication> = {}, props: Record<string, unknown> = {}) {
	const ontoggle = vi.fn();
	const result = render(PublicationRow, {
		props: { pub: { ...base, ...pub }, open: false, ontoggle, ...props }
	});
	const header = () => result.container.querySelector('.pub-row__header') as HTMLButtonElement;
	const body = () => result.container.querySelector('.pub-row__body') as HTMLElement;
	return { ...result, ontoggle, header, body };
}

describe('PublicationRow', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('summarises the paper on the header row', () => {
		const { header } = setup();
		expect(header()).toHaveTextContent('2025');
		expect(header()).toHaveTextContent('ACM');
		expect(header()).toHaveTextContent('Do Deepfake Detectors Work in Reality?');
	});

	it('wires the disclosure to the body it controls', () => {
		const { header, body } = setup();
		expect(header().tagName).toBe('BUTTON');
		expect(header()).toHaveAttribute('type', 'button');
		expect(header()).toHaveAttribute('aria-expanded', 'false');
		expect(header().getAttribute('aria-controls')).toBe(body().id);
		expect(body().id).toBeTruthy();
	});

	it('reports aria-expanded from the open prop', () => {
		const { header } = setup({}, { open: true });
		expect(header()).toHaveAttribute('aria-expanded', 'true');
	});

	it('asks the parent to toggle when clicked', async () => {
		const { header, ontoggle } = setup();
		await fireEvent.click(header());
		expect(ontoggle).toHaveBeenCalledTimes(1);
	});

	it('activates from the keyboard without double-firing', async () => {
		// jsdom does not synthesise the click a browser sends on Enter or Space, so
		// the browser's own sequence is replayed here: the keydown, then the click
		// it produces. A row that added its own key handler would fire twice.
		const { header, ontoggle } = setup();

		await fireEvent.keyDown(header(), { key: 'Enter' });
		await fireEvent.click(header());
		expect(ontoggle).toHaveBeenCalledTimes(1);

		await fireEvent.keyDown(header(), { key: ' ' });
		await fireEvent.click(header());
		expect(ontoggle).toHaveBeenCalledTimes(2);
	});

	it('keeps the body collapsed and out of the accessibility tree when closed', () => {
		const { body } = setup();
		expect(body()).not.toBeVisible();
	});

	it('reveals the bullets, links and topics when open', () => {
		const { getByRole, container } = setup({}, { open: true });

		expect(container.querySelectorAll('.pub-row__bullets li')).toHaveLength(2);

		const arxiv = getByRole('link', { name: 'Read on arXiv' });
		expect(arxiv).toHaveAttribute('href', base.url);
		expect(arxiv).toHaveAttribute('target', '_blank');
		expect(arxiv).toHaveAttribute('rel', 'noopener noreferrer');

		const acm = getByRole('link', { name: 'ACM version' });
		expect(acm).toHaveAttribute('href', base.officialUrl);
		expect(acm).toHaveAttribute('rel', 'noopener noreferrer');

		const topics = [...container.querySelectorAll('.pub-row__topics .tag')].map((t) =>
			t.textContent?.trim()
		);
		expect(topics).toEqual(['deepfake', 'benchmark']);
	});

	it('omits the ACM link for an arXiv-only paper', () => {
		const { queryByRole } = setup({ venue: 'arXiv', officialUrl: undefined }, { open: true });
		expect(queryByRole('link', { name: 'ACM version' })).toBeNull();
		expect(queryByRole('link', { name: 'Read on arXiv' })).toBeInTheDocument();
	});

	it('animates the body height open, and never on mount', async () => {
		const { rerender, body } = setup();
		expect(animateMock).not.toHaveBeenCalled();

		await rerender({ pub: base, open: true, ontoggle: () => {} });

		expect(animateMock).toHaveBeenCalledTimes(1);
		const [element, keyframes, options] = animateMock.mock.calls[0];
		expect(element).toBe(body());
		expect(keyframes).toMatchObject({ height: [0, expect.any(Number)] });
		expect(options).toMatchObject({ duration: durations.base, ease: easings.outExpo });
		expect(body()).toBeVisible();
	});

	it('animates the body height closed again', async () => {
		const { rerender } = setup({}, { open: true });
		animateMock.mockClear();

		await rerender({ pub: base, open: false, ontoggle: () => {} });

		expect(animateMock).toHaveBeenCalledTimes(1);
		const [, keyframes] = animateMock.mock.calls[0];
		expect(keyframes).toMatchObject({ height: [expect.any(Number), 0] });
	});

	it('picks an interrupted toggle up at the height the row is rendering', async () => {
		// jsdom lays nothing out, so the mid-animation height is supplied: the row
		// is 120px tall — part way through opening — when the close arrives. Taking
		// the start from `scrollHeight` instead would snap it to the full content
		// height first and only then slide it shut.
		const { rerender, body } = setup();
		await rerender({ pub: base, open: true, ontoggle: () => {} });

		stubHeight(body(), 120);
		animateMock.mockClear();

		await rerender({ pub: base, open: false, ontoggle: () => {} });

		expect(animateMock).toHaveBeenCalledTimes(1);
		const [, keyframes] = animateMock.mock.calls[0];
		expect(keyframes).toMatchObject({ height: [120, 0] });
	});

	it('resumes an interrupted collapse from where it had got to', async () => {
		const { rerender, body } = setup({}, { open: true });
		await rerender({ pub: base, open: false, ontoggle: () => {} });

		stubHeight(body(), 45);
		animateMock.mockClear();

		await rerender({ pub: base, open: true, ontoggle: () => {} });

		expect(animateMock).toHaveBeenCalledTimes(1);
		const [, keyframes] = animateMock.mock.calls[0];
		expect(keyframes).toMatchObject({ height: [45, expect.any(Number)] });
	});

	it('opens instantly under reduced motion', async () => {
		preferReducedMotion();
		const { rerender, body } = setup();

		await rerender({ pub: base, open: true, ontoggle: () => {} });

		expect(animateMock).not.toHaveBeenCalled();
		expect(body()).toBeVisible();
	});
});
