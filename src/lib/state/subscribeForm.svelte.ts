/**
 * The mailing-list form's behaviour, minus the markup.
 *
 * Two places invite a subscription — the compact form in the footer and the
 * full-width card at the end of the blog index — and they had grown two copies
 * of the same fetch, the same state machine and the same two error strings.
 * They look nothing alike, so the shared piece is this, not a component.
 *
 * Each caller creates its own instance; there is no module-level state, so a
 * page rendering both keeps them independent.
 */

export type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const NETWORK_ERROR = 'Network error. Please try again.';

export interface SubscribeForm {
	/** Bound to the email input. */
	email: string;
	/** Bound to the hidden honeypot input; a bot filling it is rejected server-side. */
	honeypot: string;
	readonly status: SubscribeStatus;
	/** The message to show while `status` is `'error'`; `''` otherwise. */
	readonly error: string;
	/** `onsubmit` handler. Always cancels the native submit. */
	submit(event: SubmitEvent): Promise<void>;
}

export function createSubscribeForm(): SubscribeForm {
	let email = $state('');
	let honeypot = $state('');
	let status = $state<SubscribeStatus>('idle');
	let error = $state('');

	return {
		get email() {
			return email;
		},
		set email(value: string) {
			email = value;
		},

		get honeypot() {
			return honeypot;
		},
		set honeypot(value: string) {
			honeypot = value;
		},

		get status() {
			return status;
		},

		get error() {
			return error;
		},

		async submit(event: SubmitEvent) {
			// Cancel first: a double submit must not fall through to a page load.
			event.preventDefault();
			if (status === 'loading') return;

			status = 'loading';
			error = '';

			try {
				const response = await fetch('/api/subscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, website: honeypot })
				});

				if (response.ok) {
					status = 'success';
					return;
				}

				// A proxy or crash can answer with HTML; parsing it must not turn a
				// 500 into the "network error" message.
				const data = await response.json().catch(() => ({}));
				status = 'error';
				error = typeof data?.error === 'string' ? data.error : GENERIC_ERROR;
			} catch {
				status = 'error';
				error = NETWORK_ERROR;
			}
		}
	};
}
