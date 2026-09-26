// Actions for the "drop to render" slide (../slides/26-drop-to-render.js; contract in presentation-pack/script/lib/actions/index.js).
// Two patch cards (meta.patch 'patch1' | 'patch2') can be dropped into a browser (meta.slot 'dockPatch');
// the YAML inside is separate text shapes tagged y-*, recoloured to the matching image of Fig. 7b.

const YAML = ['y-hello', 'y-colon', 'y-d1', 'y-w1', 'y-cmt', 'y-d2', 'y-w2']
const BUG = { 'y-hello': 'blue', 'y-colon': 'grey', 'y-d1': 'grey', 'y-w1': 'black', 'y-cmt': 'grey', 'y-d2': 'grey', 'y-w2': 'green' }
const RENDER = {
	// bug image: the first "world" (followed by "# test") is not highlighted
	bug: BUG,
	// patch 1 image: syntax highlighting is gone entirely
	patch1: Object.fromEntries(YAML.map((t) => [t, 'black'])),
	// patch 2 image: highlighting restored, both strings green
	patch2: { ...BUG, 'y-w1': 'green' },
}
const CARDS = ['patch1', 'patch2']

function paint(editor, find, variant) {
	const colors = RENDER[variant] ?? BUG
	const updates = []
	for (const tag of YAML) {
		const s = find(tag)
		if (s && s.props.color !== colors[tag]) updates.push({ id: s.id, type: s.type, props: { color: colors[tag] } })
	}
	if (updates.length) editor.updateShapes(updates)
}

function sendHome(editor, s) {
	if (s?.meta?.home) editor.updateShape({ id: s.id, type: s.type, x: s.meta.home.x, y: s.meta.home.y })
}

function isDocked(s, socket) {
	return !!(s && socket && Math.abs(s.x - socket.x) < 2 && Math.abs(s.y - socket.y) < 2)
}

export const dropRenderActions = {
	// A patch card was dropped over the browser: snap it into the socket, send the other card home, re-render.
	dockPatch(editor, { shape, find }) {
		const which = shape.meta?.patch
		if (!RENDER[which]) return
		const socket = find('socket')
		if (socket) editor.updateShape({ id: shape.id, type: shape.type, x: socket.x, y: socket.y })
		for (const tag of CARDS) if (tag !== which) sendHome(editor, find(tag))
		paint(editor, find, which)
	},
	// A patch card was dropped anywhere else: it goes home; the browser shows the bug again
	// (unless the other card is still docked).
	undockPatch(editor, { shape, find }) {
		sendHome(editor, shape)
		const socket = find('socket')
		const docked = CARDS.map((t) => find(t)).find((s) => s && s.id !== shape.id && isDocked(s, socket))
		paint(editor, find, docked ? docked.meta.patch : 'bug')
	},
}
