import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), svelteTesting()],
	ssr: {
		noExternal: ['resend']
	},
	// Vitest needs the browser condition so Svelte resolves to its client runtime.
	// Only applied under VITEST so the SSR build keeps the server condition.
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	test: {
		environment: 'jsdom',
		include: ['tests/unit/**/*.test.ts'],
		setupFiles: ['tests/unit/setup.ts'],
		globals: true
	}
});
