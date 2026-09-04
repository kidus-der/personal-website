import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte';
import Footer from '$lib/components/layout/Footer.svelte';
import { navItems } from '$lib/components/layout/navItems';
import { site } from '$content/site';
import { resetMotionMocks } from '../kokonut/motionMock';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());

function setup() {
	const result = render(Footer);
	const form = () => result.container.querySelector('form') as HTMLFormElement;
	const email = () => result.getByLabelText('Email address') as HTMLInputElement;
	return { ...result, form, email };
}

describe('Footer', () => {
	beforeEach(() => {
		resetMotionMocks();
		vi.restoreAllMocks();
	});
	afterEach(cleanup);

	it('renders the current year in the copyright line', () => {
		const { getByText } = setup();
		expect(getByText(`© ${new Date().getFullYear()} Kidus Dereje Zewde`)).toBeInTheDocument();
	});

	it('credits the stack', () => {
		const { getByText } = setup();
		expect(getByText('Built with SvelteKit and Motion')).toBeInTheDocument();
	});

	it('renders every primary link under Navigate', () => {
		const { getByRole } = setup();
		const nav = getByRole('navigation', { name: 'Navigate' });
		expect([...nav.querySelectorAll('a')].map((link) => link.getAttribute('href'))).toEqual(
			navItems.map((item) => item.href)
		);
	});

	it('renders the social links from the site content module', () => {
		const { getByRole } = setup();
		expect(getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', site.socials.github);
		expect(getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', site.socials.linkedin);
		expect(getByRole('link', { name: 'Google Scholar' })).toHaveAttribute(
			'href',
			site.socials.scholar
		);
		expect(getByRole('link', { name: 'Email' })).toHaveAttribute('href', `mailto:${site.email}`);
	});

	it('shows the wordmark to sighted readers only', () => {
		const { container } = setup();
		const wordmark = container.querySelector('.footer__wordmark') as HTMLElement;
		expect(wordmark).toHaveTextContent('Kidus');
		expect(wordmark).toHaveAttribute('aria-hidden', 'true');
	});

	it('posts the subscribe form and confirms inline', async () => {
		const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const { form, email, findByText } = setup();
		await fireEvent.input(email(), { target: { value: 'reader@example.com' } });
		await fireEvent.submit(form());

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('/api/subscribe');
		expect(init.method).toBe('POST');
		expect(JSON.parse(String(init.body))).toEqual({ email: 'reader@example.com', website: '' });
		expect(await findByText(/check your inbox/i)).toBeInTheDocument();

		vi.unstubAllGlobals();
	});

	it('surfaces the server error inline', async () => {
		const fetchMock = vi.fn(
			async () => new Response(JSON.stringify({ error: 'Already subscribed.' }), { status: 400 })
		);
		vi.stubGlobal('fetch', fetchMock);

		const { form, email, findByText } = setup();
		await fireEvent.input(email(), { target: { value: 'reader@example.com' } });
		await fireEvent.submit(form());

		expect(await findByText('Already subscribed.')).toBeInTheDocument();

		vi.unstubAllGlobals();
	});
});
