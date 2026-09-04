/**
 * Whether the contact dialog is open.
 *
 * Two widely separated places open it — the "Get in touch" link in the "At a
 * glance" bento and the "Say hello" button in the contact band — while a single
 * `ContactModal` instance (rendered by `ContactCta`) does the work. A
 * module-level rune keeps the page from having to thread a callback down one
 * branch of the tree and a binding down another.
 *
 * `open` is a settable property rather than a method pair so that a consumer can
 * `bind:open={contactModal.open}` and let the modal close itself when its exit
 * animation finishes.
 *
 * Caveat, deliberately accepted: module-level `$state` is shared by every
 * request on the server, so it must never hold anything user-specific. A
 * boolean that is only ever flipped by a click is safe — it is `false` on every
 * render, because nothing on the server can open a dialog. Anything richer
 * belongs in a context or a prop, not here. `theme.svelte.ts` makes the same
 * trade for the same reason.
 */
let open = $state(false);

export const contactModal = {
	get open(): boolean {
		return open;
	},

	set open(next: boolean) {
		open = next;
	},

	show() {
		open = true;
	},

	close() {
		open = false;
	}
};
