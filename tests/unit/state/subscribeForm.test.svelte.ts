import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSubscribeForm } from '$lib/state/subscribeForm.svelte';

/** A `submit` event whose `preventDefault` we can assert on. */
function submitEvent() {
	const event = new Event('submit', { cancelable: true }) as SubmitEvent;
	vi.spyOn(event, 'preventDefault');
	return event;
}

function jsonResponse(status: number, body: unknown) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body
	} as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('createSubscribeForm', () => {
	it('starts idle with empty fields and no error', () => {
		const form = createSubscribeForm();
		expect(form.status).toBe('idle');
		expect(form.email).toBe('');
		expect(form.honeypot).toBe('');
		expect(form.error).toBe('');
	});

	it('posts the email and honeypot as `website` and lands on success', async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
		const form = createSubscribeForm();
		form.email = 'reader@example.com';

		const event = submitEvent();
		await form.submit(event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(fetchMock).toHaveBeenCalledWith('/api/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: 'reader@example.com', website: '' })
		});
		expect(form.status).toBe('success');
		expect(form.error).toBe('');
	});

	it('sends whatever a bot typed into the honeypot', async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, {}));
		const form = createSubscribeForm();
		form.email = 'bot@example.com';
		form.honeypot = 'https://spam.example';

		await form.submit(submitEvent());

		expect(fetchMock.mock.calls[0][1].body).toBe(
			JSON.stringify({ email: 'bot@example.com', website: 'https://spam.example' })
		);
	});

	it('surfaces the server message on a 4xx', async () => {
		fetchMock.mockResolvedValue(jsonResponse(429, { error: 'Too many requests. Try later.' }));
		const form = createSubscribeForm();
		form.email = 'reader@example.com';

		await form.submit(submitEvent());

		expect(form.status).toBe('error');
		expect(form.error).toBe('Too many requests. Try later.');
	});

	it('falls back to a generic message when a 4xx carries no error field', async () => {
		fetchMock.mockResolvedValue(jsonResponse(400, {}));
		const form = createSubscribeForm();

		await form.submit(submitEvent());

		expect(form.status).toBe('error');
		expect(form.error).toBe('Something went wrong. Please try again.');
	});

	it('falls back to a generic message when the error body is not JSON', async () => {
		fetchMock.mockResolvedValue({
			ok: false,
			status: 500,
			json: async () => {
				throw new SyntaxError('Unexpected token <');
			}
		} as unknown as Response);
		const form = createSubscribeForm();

		await form.submit(submitEvent());

		expect(form.status).toBe('error');
		expect(form.error).toBe('Something went wrong. Please try again.');
	});

	it('reports a network failure distinctly', async () => {
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
		const form = createSubscribeForm();

		await form.submit(submitEvent());

		expect(form.status).toBe('error');
		expect(form.error).toBe('Network error. Please try again.');
	});

	it('clears a previous error when a retry succeeds', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
		fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));
		const form = createSubscribeForm();

		await form.submit(submitEvent());
		expect(form.error).toBe('Network error. Please try again.');

		await form.submit(submitEvent());
		expect(form.status).toBe('success');
		expect(form.error).toBe('');
	});

	it('ignores a second submit while one is in flight', async () => {
		let release: (value: Response) => void = () => {};
		fetchMock.mockReturnValue(new Promise<Response>((resolve) => (release = resolve)));
		const form = createSubscribeForm();

		const first = form.submit(submitEvent());
		expect(form.status).toBe('loading');

		await form.submit(submitEvent());
		expect(fetchMock).toHaveBeenCalledTimes(1);

		release(jsonResponse(200, {}));
		await first;
		expect(form.status).toBe('success');
	});

	it('still blocks the browser navigation on an ignored submit', async () => {
		fetchMock.mockReturnValue(new Promise<Response>(() => {}));
		const form = createSubscribeForm();
		form.submit(submitEvent());

		const second = submitEvent();
		await form.submit(second);
		expect(second.preventDefault).toHaveBeenCalled();
	});
});
