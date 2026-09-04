import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ErrorPage from '../../../src/routes/+error.svelte';
import { navItems } from '$lib/components/layout/navItems';
import { resetMotionMocks } from '../kokonut/motionMock';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());
vi.mock('$app/navigation', async () => (await import('./navigationMock')).navigationModule());

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/nope'),
	status: 404,
	error: { message: 'Not Found' } as { message: string } | null
}));

vi.mock('$app/state', () => ({ page: pageState }));
vi.mock('$app/stores', () => ({
	page: {
		subscribe: (run: (value: { url: URL }) => void) => {
			run({ url: pageState.url });
			return () => {};
		}
	}
}));

describe('+error.svelte', () => {
	beforeEach(() => {
		resetMotionMocks();
		pageState.status = 404;
		pageState.error = { message: 'Not Found' };
	});
	afterEach(cleanup);

	it('says the page was not found for a 404', () => {
		const { getByRole } = render(ErrorPage);
		expect(getByRole('img', { name: 'Page not found' })).toBeInTheDocument();
	});

	it('shows the status code', () => {
		const { getByText } = render(ErrorPage);
		expect(getByText('404')).toBeInTheDocument();
	});

	it('links back home', () => {
		const { getByRole } = render(ErrorPage);
		expect(getByRole('link', { name: /back home/i })).toHaveAttribute('href', '/');
	});

	it('gives a lost reader the site chrome to navigate from', () => {
		const { getByRole, container } = render(ErrorPage);
		const nav = getByRole('navigation', { name: 'Primary' });
		expect([...nav.querySelectorAll('a')].map((link) => link.getAttribute('href'))).toEqual(
			navItems.map((item) => item.href)
		);
		expect(container.querySelector('footer')).toBeInTheDocument();
	});

	it('falls back to a generic message for other statuses', () => {
		pageState.status = 500;
		pageState.error = { message: 'Internal Error' };
		const { getByRole, getByText } = render(ErrorPage);
		expect(getByRole('img', { name: 'Something went wrong' })).toBeInTheDocument();
		expect(getByText('500')).toBeInTheDocument();
	});
});
