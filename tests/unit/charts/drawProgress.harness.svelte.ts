import { createDrawProgress } from '$lib/components/charts/drawProgress.svelte';

export interface DrawProgressHandle {
	/** The current 0..1 draw progress. */
	readonly value: number;
	/** Flips the reactive `enabled` flag the effect depends on. */
	setEnabled(next: boolean): void;
	/** Tears the scope down the way unmounting a component would. */
	destroy(): void;
}

/**
 * `createDrawProgress` owns a `$state` and an `$effect`, so it only runs inside
 * a reactive scope. Runes are compiled only in `.svelte` / `.svelte.ts` files,
 * so this harness — not the plain `.test.ts` file — is where `$effect.root` and
 * the reactive `enabled` source live.
 */
export function mountDrawProgress(
	options: { enabled?: boolean; duration?: number } = {}
): DrawProgressHandle {
	let enabled = $state.raw(options.enabled ?? true);
	let progress: { readonly value: number } | undefined;

	const destroy = $effect.root(() => {
		progress = createDrawProgress({ enabled: () => enabled, duration: options.duration });
	});

	return {
		get value(): number {
			if (!progress) throw new Error('draw progress was not created');
			return progress.value;
		},
		setEnabled(next: boolean): void {
			enabled = next;
		},
		destroy
	};
}
