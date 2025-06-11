import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	worker: {
		format: 'es'
	},
	server: {
		port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
		host: true
	}
});
