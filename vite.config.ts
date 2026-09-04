import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';
import { defaultClientConditions } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), svelteTesting()],
	ssr: {
		noExternal: ['resend']
	},
	// Vitest needs the browser condition first so Svelte resolves to its client
	// runtime. Vite's own client conditions are kept — replacing them outright
	// drops `module` and `development|production`. Only applied under VITEST so
	// the SSR build keeps the server conditions.
	resolve: process.env.VITEST
		? { conditions: ['browser', ...defaultClientConditions.filter((c) => c !== 'browser')] }
		: undefined,
	test: {
		environment: 'jsdom',
		// `*.test.svelte.ts` files are compiled by vite-plugin-svelte, so a test can
		// use runes directly (`$effect.root`) to exercise a `.svelte.ts` module.
		include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.svelte.ts'],
		setupFiles: ['tests/unit/setup.ts'],
		globals: true
	}
});
