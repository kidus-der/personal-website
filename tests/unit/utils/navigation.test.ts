import { describe, it, expect } from 'vitest';
import { isActivePath } from '$lib/utils/navigation';

describe('isActivePath', () => {
	it('matches home only on the root path', () => {
		expect(isActivePath('/', '/')).toBe(true);
		expect(isActivePath('/work', '/')).toBe(false);
		expect(isActivePath('/blog/hello', '/')).toBe(false);
	});

	it('matches a section on its own path', () => {
		expect(isActivePath('/work', '/work')).toBe(true);
		expect(isActivePath('/blog', '/blog')).toBe(true);
	});

	it('matches a section on any path beneath it', () => {
		expect(isActivePath('/work/prime-radiant', '/work')).toBe(true);
		expect(isActivePath('/blog/hello', '/blog')).toBe(true);
		expect(isActivePath('/blog/2026/hello', '/blog')).toBe(true);
	});

	it('does not match a sibling whose name merely starts the same', () => {
		expect(isActivePath('/workshop', '/work')).toBe(false);
		expect(isActivePath('/blogroll', '/blog')).toBe(false);
	});

	it('ignores a trailing slash on either side', () => {
		expect(isActivePath('/work/', '/work')).toBe(true);
		expect(isActivePath('/work', '/work/')).toBe(true);
		expect(isActivePath('/', '')).toBe(true);
	});

	it('is unaffected by an empty or missing current path', () => {
		expect(isActivePath('', '/work')).toBe(false);
		expect(isActivePath('', '/')).toBe(true);
	});

	it('does not treat a different section as active', () => {
		expect(isActivePath('/about', '/work')).toBe(false);
		expect(isActivePath('/work', '/about')).toBe(false);
	});
});
