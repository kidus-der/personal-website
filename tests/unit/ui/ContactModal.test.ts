import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/svelte';
import ContactModal from '$lib/components/ui/ContactModal.svelte';
import { animateMock, resetMotionMocks } from '../kokonut/motionMock';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());

function fillIn(values = {}) {
	const fields = {
		Name: 'Ada',
		Email: 'ada@example.com',
		Subject: 'Hello',
		Message: 'Hi there',
		...values
	};
	for (const [label, value] of Object.entries(fields)) {
		fireEvent.input(screen.getByLabelText(label), { target: { value } });
	}
}

describe('ContactModal', () => {
	beforeEach(() => {
		resetMotionMocks();
		vi.restoreAllMocks();
	});

	afterEach(cleanup);

	it('renders nothing while closed', () => {
		render(ContactModal);
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('renders a labelled modal dialog when open', () => {
		render(ContactModal, { props: { open: true } });
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).toHaveAccessibleName('Contact form');
	});

	it('springs the card in and fades the overlay with Motion, not GSAP', async () => {
		render(ContactModal, { props: { open: true } });
		await waitFor(() => expect(animateMock).toHaveBeenCalled());
		const scaled = animateMock.mock.calls.find(
			(call) => (call[1] as Record<string, unknown>)?.scale !== undefined
		);
		expect(scaled?.[1]).toMatchObject({ scale: [0.92, 1] });
	});

	it('closes on Escape', async () => {
		const onclose = vi.fn();
		render(ContactModal, { props: { open: true, onclose } });
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('closes on Escape pressed from inside the card, where focus actually is', async () => {
		render(ContactModal, { props: { open: true } });
		// Nothing between the field and the window may swallow the key.
		await fireEvent.keyDown(screen.getByLabelText('Message'), { key: 'Escape', bubbles: true });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	it('closes on a click outside the card and on the close button', async () => {
		const { unmount } = render(ContactModal, { props: { open: true } });
		await fireEvent.click(screen.getByTestId('contact-modal-overlay'));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		unmount();

		render(ContactModal, { props: { open: true } });
		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	it('stays open when the card itself is clicked', async () => {
		render(ContactModal, { props: { open: true } });
		await fireEvent.click(screen.getByRole('dialog'));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('returns focus to whatever opened it', async () => {
		const opener = document.createElement('button');
		document.body.append(opener);
		opener.focus();

		const { rerender } = render(ContactModal, { props: { open: false } });
		await rerender({ open: true });
		await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());

		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(opener).toHaveFocus());
		opener.remove();
	});

	it('posts the form to the contact endpoint and reports success', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true })));
		vi.stubGlobal('fetch', fetchMock);

		render(ContactModal, { props: { open: true } });
		fillIn();
		await fireEvent.submit(screen.getByTestId('contact-modal-form'));

		await waitFor(() => expect(screen.getByText('Message sent!')).toBeInTheDocument());
		expect(fetchMock).toHaveBeenCalledWith('/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'Ada',
				email: 'ada@example.com',
				subject: 'Hello',
				message: 'Hi there'
			})
		});
		vi.unstubAllGlobals();
	});

	it('surfaces the server error message', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () => new Response(JSON.stringify({ error: 'Too many requests.' }), { status: 429 })
			)
		);

		render(ContactModal, { props: { open: true } });
		fillIn();
		await fireEvent.submit(screen.getByTestId('contact-modal-form'));

		await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Too many requests.'));
		vi.unstubAllGlobals();
	});

	it('wraps Tab from the last focusable back to the first, and Shift+Tab the other way', async () => {
		render(ContactModal, { props: { open: true } });
		const card = screen.getByRole('dialog');
		const items = [...card.querySelectorAll<HTMLElement>('a[href], button, input, textarea')];
		const first = items[0];
		const last = items[items.length - 1];
		expect(items.length).toBeGreaterThan(2);

		last.focus();
		await fireEvent.keyDown(window, { key: 'Tab' });
		expect(first).toHaveFocus();

		first.focus();
		await fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
		expect(last).toHaveFocus();
	});

	it('pulls focus back into the card when Tab is pressed from outside it', async () => {
		const stray = document.createElement('button');
		document.body.append(stray);
		render(ContactModal, { props: { open: true } });
		stray.focus();

		await fireEvent.keyDown(window, { key: 'Tab' });

		const card = screen.getByRole('dialog');
		expect(card.contains(document.activeElement)).toBe(true);
		stray.remove();
	});

	it('makes the background inert while open and restores it on close', async () => {
		const background = document.createElement('div');
		document.body.append(background);

		render(ContactModal, { props: { open: true } });
		expect(background).toHaveAttribute('inert');

		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(background).not.toHaveAttribute('inert');
		background.remove();
	});

	it('leaves an element that was already inert alone', async () => {
		const background = document.createElement('div');
		background.setAttribute('inert', '');
		document.body.append(background);

		render(ContactModal, { props: { open: true } });
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

		expect(background).toHaveAttribute('inert');
		background.remove();
	});

	it('locks body scrolling and restores the previous value', async () => {
		document.body.style.overflow = 'scroll';

		render(ContactModal, { props: { open: true } });
		expect(document.body.style.overflow).toBe('hidden');

		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(document.body.style.overflow).toBe('scroll');
		document.body.style.overflow = '';
	});

	it('undoes the isolation and the scroll lock when unmounted while open', () => {
		const background = document.createElement('div');
		document.body.append(background);

		const { unmount } = render(ContactModal, { props: { open: true } });
		expect(background).toHaveAttribute('inert');
		expect(document.body.style.overflow).toBe('hidden');

		unmount();

		expect(background).not.toHaveAttribute('inert');
		expect(document.body.style.overflow).toBe('');
		background.remove();
	});

	it('starts every opening from a clean slate', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ success: true })))
		);

		const { rerender } = render(ContactModal, { props: { open: true } });
		fillIn();
		await fireEvent.submit(screen.getByTestId('contact-modal-form'));
		await waitFor(() => expect(screen.getByText('Message sent!')).toBeInTheDocument());

		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await rerender({ open: true });

		await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
		expect(screen.queryByText('Message sent!')).toBeNull();
		expect(screen.getByTestId('contact-modal-form')).toBeInTheDocument();
		vi.unstubAllGlobals();
	});

	it('never shows the result of a submission that landed after the close', async () => {
		let settle: (value: Response) => void = () => {};
		vi.stubGlobal(
			'fetch',
			vi.fn(() => new Promise<Response>((resolve) => (settle = resolve)))
		);

		const { rerender } = render(ContactModal, { props: { open: true } });
		fillIn();
		fireEvent.submit(screen.getByTestId('contact-modal-form'));

		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

		settle(new Response(JSON.stringify({ success: true })));
		await rerender({ open: true });
		await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

		expect(screen.queryByText('Message sent!')).toBeNull();
		vi.unstubAllGlobals();
	});

	it('abandons the close when the owner re-opens during the exit animation', async () => {
		// A deferred `finished` gives the test a window inside the exit animation.
		const original = animateMock.getMockImplementation();
		const resolvers: (() => void)[] = [];
		animateMock.mockImplementation(() => ({
			stop: vi.fn(),
			complete: vi.fn(),
			pause: vi.fn(),
			play: vi.fn(),
			finished: new Promise<void>((resolve) => resolvers.push(() => resolve()))
		}));

		try {
			const { rerender } = render(ContactModal, { props: { open: true } });
			fireEvent.keyDown(window, { key: 'Escape' });
			await rerender({ open: true });

			for (const resolve of resolvers) resolve();
			await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
		} finally {
			animateMock.mockImplementation(original!);
		}
	});

	it('falls back to a network message when the request throws', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new Error('offline');
			})
		);

		render(ContactModal, { props: { open: true } });
		fillIn();
		await fireEvent.submit(screen.getByTestId('contact-modal-form'));

		await waitFor(() =>
			expect(screen.getByRole('alert')).toHaveTextContent('Network error. Please try again.')
		);
		vi.unstubAllGlobals();
	});
});
