import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import SmoothTabs from '$lib/components/kokonut/SmoothTabs.svelte';
import { springs } from '$lib/motion/config';
import { animateMock, resetMotionMocks } from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

const tabs = [
	{ id: 'all', label: 'All' },
	{ id: 'ai-ml', label: 'AI & ML' },
	{ id: 'full-stack', label: 'Full-stack' },
	{ id: 'systems', label: 'Systems' }
];

const layout: Record<string, { left: number; width: number }> = {
	All: { left: 4, width: 44 },
	'AI & ML': { left: 48, width: 70 },
	'Full-stack': { left: 118, width: 88 },
	Systems: { left: 206, width: 72 }
};

function stubOffsets() {
	const lookup = (element: HTMLElement) => layout[element.textContent?.trim() ?? ''];
	vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return lookup(this)?.left ?? 0;
	});
	vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return lookup(this)?.width ?? 0;
	});
}

async function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const result = render(SmoothTabs, { props: { tabs, active: 'all', onchange, ...props } });
	await tick();
	const list = () => result.getByRole('tablist');
	const tabButtons = () => result.getAllByRole('tab');
	const indicator = () => result.container.querySelector('.smooth-tabs__indicator') as HTMLElement;
	return { ...result, onchange, list, tabButtons, indicator };
}

function press(element: HTMLElement, key: string) {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function lastIndicatorCall() {
	return animateMock.mock.calls
		.filter((call) => (call[0] as HTMLElement)?.classList?.contains?.('smooth-tabs__indicator'))
		.at(-1);
}

describe('SmoothTabs', () => {
	beforeEach(() => {
		resetMotionMocks();
		stubOffsets();
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it('renders a tablist of tabs', async () => {
		const { list, tabButtons } = await setup();
		expect(list()).toBeInTheDocument();
		expect(tabButtons().map((t) => t.textContent?.trim())).toEqual([
			'All',
			'AI & ML',
			'Full-stack',
			'Systems'
		]);
	});

	it('marks only the active tab as selected', async () => {
		const { tabButtons } = await setup({ active: 'ai-ml' });
		expect(tabButtons().map((t) => t.getAttribute('aria-selected'))).toEqual([
			'false',
			'true',
			'false',
			'false'
		]);
	});

	it('keeps a single tab stop with a roving tabindex', async () => {
		const { tabButtons } = await setup({ active: 'ai-ml' });
		expect(tabButtons().map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0', '-1', '-1']);
	});

	it('reports the clicked tab and moves the selection', async () => {
		const { tabButtons, onchange } = await setup();
		tabButtons()[2].click();
		await tick();

		expect(onchange).toHaveBeenCalledWith('full-stack');
		expect(tabButtons()[2]).toHaveAttribute('aria-selected', 'true');
		expect(tabButtons()[0]).toHaveAttribute('aria-selected', 'false');
	});

	it('does not report a click on the already-selected tab', async () => {
		const { tabButtons, onchange } = await setup();
		tabButtons()[0].click();
		expect(onchange).not.toHaveBeenCalled();
	});

	it('moves selection with ArrowRight and wraps at the end', async () => {
		const { tabButtons, onchange } = await setup();
		press(tabButtons()[0], 'ArrowRight');
		await tick();
		expect(onchange).toHaveBeenLastCalledWith('ai-ml');
		expect(tabButtons()[1]).toHaveAttribute('aria-selected', 'true');

		press(tabButtons()[1], 'ArrowRight');
		press(tabButtons()[2], 'ArrowRight');
		press(tabButtons()[3], 'ArrowRight');
		await tick();
		expect(onchange).toHaveBeenLastCalledWith('all');
	});

	it('moves selection with ArrowLeft and wraps at the start', async () => {
		const { tabButtons, onchange } = await setup();
		press(tabButtons()[0], 'ArrowLeft');
		await tick();
		expect(onchange).toHaveBeenLastCalledWith('systems');
		expect(tabButtons()[3]).toHaveAttribute('aria-selected', 'true');
	});

	it('jumps to the first and last tab with Home and End', async () => {
		const { tabButtons, onchange } = await setup({ active: 'ai-ml' });
		press(tabButtons()[1], 'End');
		await tick();
		expect(onchange).toHaveBeenLastCalledWith('systems');

		press(tabButtons()[3], 'Home');
		await tick();
		expect(onchange).toHaveBeenLastCalledWith('all');
	});

	it('ignores keys it does not own', async () => {
		const { tabButtons, onchange } = await setup();
		press(tabButtons()[0], 'ArrowDown');
		expect(onchange).not.toHaveBeenCalled();
	});

	it('moves focus along with the selection', async () => {
		const { tabButtons } = await setup();
		tabButtons()[0].focus();
		press(tabButtons()[0], 'ArrowRight');
		await tick();
		expect(document.activeElement).toBe(tabButtons()[1]);
	});

	it('slides the indicator onto the selected tab with a snappy spring', async () => {
		const { tabButtons, indicator } = await setup();
		animateMock.mockClear();

		tabButtons()[2].click();
		await tick();

		const call = lastIndicatorCall();
		expect(call?.[0]).toBe(indicator());
		expect(call?.[1]).toMatchObject({ x: 118, width: '88px' });
		expect(call?.[2]).toMatchObject(springs.snappy);
	});

	describe('when active names no tab', () => {
		it('selects nothing rather than quietly falling back to the first tab', async () => {
			const { tabButtons } = await setup({ active: 'not-a-category' });
			expect(tabButtons().map((t) => t.getAttribute('aria-selected'))).toEqual([
				'false',
				'false',
				'false',
				'false'
			]);
		});

		it('hides the indicator', async () => {
			const { indicator } = await setup({ active: 'not-a-category' });
			const call = lastIndicatorCall();
			expect(call?.[0]).toBe(indicator());
			expect(call?.[1]).toMatchObject({ x: 0, width: '0px', opacity: 0 });
		});

		it('still keeps the row reachable by keyboard', async () => {
			const { tabButtons } = await setup({ active: 'not-a-category' });
			expect(tabButtons().map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);
		});

		it('starts the arrow keys from the tabbable tab', async () => {
			const { tabButtons, onchange } = await setup({ active: 'not-a-category' });
			press(tabButtons()[0], 'ArrowRight');
			await tick();
			expect(onchange).toHaveBeenLastCalledWith('ai-ml');
		});

		it('wraps backwards to the last tab', async () => {
			const { tabButtons, onchange } = await setup({ active: 'not-a-category' });
			press(tabButtons()[0], 'ArrowLeft');
			await tick();
			expect(onchange).toHaveBeenLastCalledWith('systems');
		});
	});

	it('follows the active prop when the parent changes it', async () => {
		const { rerender, tabButtons, onchange } = await setup();
		await rerender({ tabs, active: 'systems', onchange });
		await tick();
		expect(tabButtons()[3]).toHaveAttribute('aria-selected', 'true');
	});
});
