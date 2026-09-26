// The hinge (§V-B4): the repro code is what Image2Code writes and Code2Image replays.
// Workaround: helpers.createArrowBetweenShapes drops color/size/dash, so restyle bound arrows by tag
// right after the kit creates them (a microtask queued here runs once buildSlide has finished).
function styleArrows(k, styles) {
	queueMicrotask(() => {
		const want = new Map(Object.entries(styles).map(([t, p]) => [k.tag(t), p]))
		const all = editor.getCurrentPageShapes().filter((s) => s.type === 'arrow' && s.meta?.tag && want.has(k.tag(s.meta.tag)))
		editor.run(() => editor.updateShapes(all.map((s) => ({ id: s.id, type: 'arrow', props: want.get(k.tag(s.meta.tag)) }))), { ignoreShapeLock: true })
	})
}

export default {
	name: 'The hinge',
	kicker: 'II · the idea',
	title: 'The hinge',
	source: '§III · §V-B4 (next-4182)',
	notes: "COVER\n• Both halves pass through one artefact: the reproduction code\n• Image2Code writes it; Code2Image replays it on each patched build\n• Most reports lack repro code, so you need both halves\nCLICKS\n1 · Image2Code writes it · 2 · Code2Image replays it · 3 · the paper's quote\nREF · §III-A · §III-D · §V-B4",
	draw(k) {
		// the screenshot
		k.box(150, 400, 360, 260, { fill: 'solid', color: 'white', size: 'm', rot: -2, id: 'pic' })
		k.pen([[185, 625], [270, 520], [320, 575], [385, 495], [480, 625]], { size: 'l', wob: 3, id: 'mtn' })
		k.circle(440, 470, 26, { size: 'm', id: 'sun' })
		k.text(150, 690, 'the bug, as seen', { size: 'l', color: 'grey', align: 'middle', w: 360, id: 'pic-lbl' })
		// the repro code, in the middle
		k.box(760, 360, 400, 340, { fill: 'solid', color: 'white', size: 'l', id: 'code' })
		k.text(800, 400, '<script>\n  render(\n    <Bug />\n  )\n</script>', { font: 'mono', size: 'm', scale: 1.1, color: 'blue', id: 'code-t' })
		k.text(760, 730, 'repro code', { size: 'xl', align: 'middle', w: 400, id: 'code-lbl' })
		// a doodled hinge on the sheet's corner
		k.box(1030, 560, 44, 110, { size: 's', id: 'h1' })
		k.box(1084, 560, 44, 110, { size: 's', id: 'h2' })
		k.pen([[1079, 548], [1079, 684]], { size: 'l', id: 'pin' })
		for (const [x, y] of [[1052, 585], [1052, 645], [1106, 585], [1106, 645]]) k.circle(x, y, 5, { size: 's', fill: 'fill', color: 'black', id: `screw-${x}-${y}` })
		// the print of a patched build
		k.box(1410, 400, 360, 260, { fill: 'solid', color: 'white', size: 'm', rot: 2, beat: 2, anim: 'drop', id: 'print' })
		k.pen([[1445, 625], [1530, 520], [1580, 575], [1645, 495], [1740, 625]], { size: 'l', wob: 3, beat: 2, anim: 'fade', id: 'mtn3' })
		k.tick(1680, 440, 50, { beat: 2, id: 'ok' })
		k.text(1410, 690, 'each patch, rendered', { size: 'l', color: 'grey', align: 'middle', w: 360, beat: 2, id: 'print-lbl' })
		// the two arrows through it
		k.arrow('pic', 'code', { beat: 1, anim: 'fade', id: 'i2c', bend: -60 })
		k.text(470, 280, 'Image2Code writes it', { size: 'l', color: 'red', align: 'middle', w: 440, rot: -3, beat: 1, id: 'i2c-t' })
		k.arrow('code', 'print', { beat: 2, anim: 'fade', id: 'c2i', bend: -60 })
		k.text(1030, 280, 'Code2Image replays it', { size: 'l', color: 'green', align: 'middle', w: 440, rot: 3, beat: 2, id: 'c2i-t' })
		styleArrows(k, { i2c: { color: 'red', size: 'xl' }, c2i: { color: 'green', size: 'xl' } })
		// the paper's words
		k.text(260, 850, '"… tightly linking the Image2Code and Code2Image components"', { size: 'l', align: 'middle', w: 1400, beat: 3, id: 'quote' })
		k.text(260, 910, '§V-B4', { size: 'm', color: 'grey', align: 'middle', w: 1400, beat: 3, id: 'quote-src' })
	},
}
