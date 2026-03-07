import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	css: {
		preprocessorOptions: {
			scss: {
				loadPaths: [resolve(__dirname, 'src')],
				additionalData: `@use 'styles/tokens' as *;`
			}
		}
	},
	ssr: {
		noExternal: ['gsap', 'lenis', 'resend']
	}
});
