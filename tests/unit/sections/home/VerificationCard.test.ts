import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import VerificationCard from '$lib/components/sections/home/VerificationCard.svelte';
// Component CSS never reaches jsdom, so the two invariants that make the scan
// line honest — that it animates, and that it stops for reduced motion — are
// pinned against the source instead.
import cardSource from '$lib/components/sections/home/VerificationCard.svelte?raw';
import { resetMotionMocks } from '../../kokonut/motionMock';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());

function setup(props: Record<string, unknown> = {}) {
	const result = render(VerificationCard, { props });
	const ringValue = () => result.container.querySelector('[data-testid="ring-center-value"]');
	const ringLabel = () => result.container.querySelector('[data-testid="ring-center-label"]');
	return { ...result, ringValue, ringLabel };
}

describe('VerificationCard', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('reads out the default detection score to one decimal place', () => {
		const { ringValue } = setup();
		expect(ringValue()).toHaveTextContent('98.2%');
	});

	it('labels the ring with what the number counts', () => {
		const { ringLabel } = setup();
		expect(ringLabel()).toHaveTextContent('deepfakes caught');
	});

	it('takes an overridden score', () => {
		const { ringValue } = setup({ score: 91 });
		expect(ringValue()).toHaveTextContent('91.0%');
	});

	it('names the model and the sample as two separate spans, never joined by a dot', () => {
		const { container } = setup();
		const header = container.querySelector('.verification-card__header');
		expect(header?.querySelectorAll('span')).toHaveLength(2);
		expect(header).toHaveTextContent('Eva V1.6');
		expect(header).toHaveTextContent('live sample');
		expect(header?.textContent).not.toContain('·');
	});

	it('charts every modality by name', () => {
		const { container } = setup();
		const labels = [...container.querySelectorAll('.bar-x-label')].map((n) => n.textContent);
		expect(labels).toEqual(['image', 'video', 'audio', 'document']);
	});

	it('charts overridden modalities instead', () => {
		const { container } = setup({ modalities: [{ label: 'image', value: 50 }] });
		const labels = [...container.querySelectorAll('.bar-x-label')].map((n) => n.textContent);
		expect(labels).toEqual(['image']);
	});

	it('renders the verdict row as three labelled cells', () => {
		const { container } = setup();
		const verdict = container.querySelector('.verification-card__verdict');
		expect(verdict).toHaveTextContent('Verdict');
		expect(verdict).toHaveTextContent('Authentic');
		expect(verdict).toHaveTextContent('0.98');
	});

	it('derives the verdict confidence from the score rather than hard-coding it', () => {
		const { container } = setup({ score: 91.4 });
		expect(container.querySelector('.verification-card__verdict-score')).toHaveTextContent('0.91');
	});

	it('pads the confidence to two decimals for a round score', () => {
		const { container } = setup({ score: 90 });
		expect(container.querySelector('.verification-card__verdict-score')).toHaveTextContent('0.90');
	});

	it('draws a scan line that sweeps the card and pauses for reduced motion', () => {
		const { container } = setup();
		expect(container.querySelector('.verification-card__scan')).toBeInTheDocument();
		expect(cardSource).toContain('@keyframes scan');
		expect(cardSource).toContain('animation-play-state: paused');
	});

	it('hides the chart block on mount so the ring can draw in later', () => {
		const { container } = setup({ animate: false });
		expect(
			(container.querySelector('.verification-card__charts') as HTMLElement).style.opacity
		).toBe('0');
	});

	it('leaves the chart block alone when it is told to draw straight away', () => {
		const { container } = setup({ animate: true });
		expect(
			(container.querySelector('.verification-card__charts') as HTMLElement).style.opacity
		).toBe('');
	});
});
