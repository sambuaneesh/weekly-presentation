import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pack = path.resolve(import.meta.dirname, '../presentation-pack/script')
const decks = path.resolve(import.meta.dirname, '../decks')

export default defineConfig({
	plugins: [react()],
	// Relative asset paths, so the build works at https://<user>.github.io/<repo>/ without knowing the repo name.
	base: './',
	resolve: {
		alias: [
			{ find: '@pack', replacement: pack },
			// The pack imports its deck extensions from `extensions.js` (a placeholder in the pack). On the
			// website that becomes every deck's extensions (src/extensions.js).
			{ find: /^(?:\.\/|(?:\.\.\/)+)extensions\.js$/, replacement: path.resolve(import.meta.dirname, 'src/extensions.js') },
		],
		// The pack and decks live outside this folder; resolve their bare imports from this site's node_modules.
		dedupe: ['react', 'react-dom', 'tldraw'],
	},
	server: { fs: { allow: [import.meta.dirname, pack, decks] } },
})
