import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/svelte';
import ContactCta from '$lib/components/sections/home/ContactCta.svelte';
import { contactModal } from '$lib/state/contact.svelte';
import { resetMotionMocks } from '../../kokonut/motionMock';
import { resetActionMocks } from '../../kokonut/actionsMock';
import { resetHomeActionMocks } from './homeMocks';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../kokonut/actionsMock')).tiltModule());
vi.mock('$lib/actions/reveal', async () => (await import('./homeMocks')).revealModule());
vi.mock('$lib/actions/magnetic', async () => (await import('./homeMocks')).magneticModule());

describe('ContactCta', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
		resetHomeActionMocks();
		contactModal.close();
	});

	afterEach(() => {
		cleanup();
		contactModal.close();
	});

	it('makes the invitation the band heading', () => {
		const { getByRole } = render(ContactCta);
		expect(getByRole('heading', { name: 'Say hello.' })).toBeInTheDocument();
	});

	it('leaves the longer line to the dialog', async () => {
		const { getByRole } = render(ContactCta);
		expect(screen.queryByText("Let's build something.")).toBeNull();
		await fireEvent.click(getByRole('button', { name: 'Say hello' }));
		expect(screen.getByText("Let's build something.")).toBeInTheDocument();
	});

	it('states what it is open to, once', () => {
		const { getByText } = render(ContactCta);
		expect(
			getByText('Open to interesting research collaborations and any other opportunities.')
		).toBeInTheDocument();
	});

	it('opens the contact dialog from the button', async () => {
		const { getByRole } = render(ContactCta);
		expect(screen.queryByRole('dialog')).toBeNull();

		await fireEvent.click(getByRole('button', { name: 'Say hello' }));

		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(contactModal.open).toBe(true);
	});

	it('clears the shared flag again when the dialog closes itself', async () => {
		const { getByRole } = render(ContactCta);
		await fireEvent.click(getByRole('button', { name: 'Say hello' }));
		await fireEvent.keyDown(window, { key: 'Escape' });

		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(contactModal.open).toBe(false);
	});

	it('surrounds the invitation with the dot field', () => {
		const { container } = render(ContactCta);
		expect(container.querySelector('.mouse-effect-card')).toBeInTheDocument();
	});
});
