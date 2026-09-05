import { describe, it, expect, afterEach, vi } from 'vitest';
import { finePointer } from '$lib/actions/pointer';
import { stubPointer } from './domStubs';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('finePointer', () => {
	it('asks for a hovering, fine-grained pointer', () => {
		stubPointer('fine');

		expect(finePointer()).toBe(true);
		expect(globalThis.matchMedia).toHaveBeenCalledWith('(hover: hover) and (pointer: fine)');
	});

	it('is false on a touch-only device', () => {
		stubPointer('coarse');

		expect(finePointer()).toBe(false);
	});

	it('is false when matchMedia is unavailable (SSR)', () => {
		vi.stubGlobal('matchMedia', undefined);

		expect(finePointer()).toBe(false);
	});

	it('is false rather than throwing when matchMedia rejects the query', () => {
		vi.stubGlobal(
			'matchMedia',
			vi.fn(() => {
				throw new SyntaxError('unsupported media query');
			})
		);

		expect(finePointer()).toBe(false);
	});

	it('re-reads the preference on every call', () => {
		stubPointer('coarse');
		expect(finePointer()).toBe(false);

		stubPointer('fine');
		expect(finePointer()).toBe(true);
	});
});
