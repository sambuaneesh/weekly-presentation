// The idea (§I, §III): read the picture as code, and the code as a picture.
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
	name: 'The idea',
	kicker: 'II · the idea',
	title: 'Read it both ways',
	source: '§I · §III',
	notes: "COVER\n• The idea: translate both ways between picture and code\n• Image2Code: docs + generated repro code → understand and localize\n• Code2Image: render each patch → validate by looking\nCLICKS\n1 · red arrow, Image2Code · 2 · green arrow, Code2Image\nREF · §I · §III",
	draw(k) {
		// the picture
		k.box(230, 440, 420, 300, { fill: 'solid', color: 'white', size: 'm', rot: -2, id: 'pic' })
		k.pen([[270, 700], [370, 580], [430, 640], [500, 550], [620, 700]], { size: 'l', wob: 3, id: 'mtn' })
		k.circle(560, 520, 30, { size: 'm', id: 'sun' })
		styleArrows(k, { i2c: { color: 'red', size: 'xl' }, c2i: { color: 'green', size: 'xl' } })
		k.text(230, 770, 'the picture', { size: 'l', color: 'grey', align: 'middle', w: 420, id: 'pic-lbl' })
		// the code sheet
		k.box(1270, 440, 420, 300, { fill: 'solid', color: 'white', size: 'm', rot: 1.5, id: 'code' })
		k.text(1310, 480, 'function draw() {\n  bar.radius = …\n  if (v === 0)\n    skip(…)\n}', { font: 'mono', size: 'm', color: 'blue', rot: 1.5, id: 'code-t' })
		k.text(1270, 770, 'the code', { size: 'l', color: 'grey', align: 'middle', w: 420, id: 'code-lbl' })
		// click 1: Image2Code, a big swoop over the top
		k.arrow('pic', 'code', { color: 'red', size: 'xl', bend: -190, beat: 1, anim: 'fade', id: 'i2c' })
		k.text(560, 250, 'Image2Code', { size: 'xl', color: 'red', align: 'middle', w: 800, beat: 1, id: 'i2c-t' })
		k.text(560, 322, 'read the picture as code', { size: 'l', align: 'middle', w: 800, beat: 1, id: 'i2c-s' })
		// click 2: Code2Image, back underneath
		k.arrow('code', 'pic', { color: 'green', size: 'xl', bend: -190, beat: 2, anim: 'fade', id: 'c2i' })
		k.text(560, 800, 'Code2Image', { size: 'xl', color: 'green', align: 'middle', w: 800, beat: 2, id: 'c2i-t' })
		k.text(560, 872, 'read the code as a picture', { size: 'l', align: 'middle', w: 800, beat: 2, id: 'c2i-s' })
	},
}
