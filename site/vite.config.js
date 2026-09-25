import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pack = path.resolve(import.meta.dirname, '../presentation-pack/script')

export default defineConfig({
	plugins: [react()],
	// Relative asset paths, so the build works at https://<user>.github.io/<repo>/ without knowing the repo name.
	base: './',
	resolve: {
		alias: { '@pack': pack },
		// The pack lives outside this folder; resolve its bare imports from this site's node_modules.
		dedupe: ['react', 'react-dom', 'tldraw'],
	},
	server: { fs: { allow: [import.meta.dirname, pack] } },
})
