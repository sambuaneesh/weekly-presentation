// Table II as hand-drawn bars: an outline per repository (its tasks), filled green as far as GUIRepair got.
const REPOS = [
	['openlayers', 79, 76], ['bpmn-js', 54, 35], ['eslint', 11, 6], ['next', 39, 9], ['prism', 38, 7], ['prettier', 13, 2],
	['highlight.js', 39, 4], ['carbon', 134, 12], ['quarto-cli', 24, 2], ['lighthouse', 54, 3], ['grommet', 21, 1], ['scratch-gui', 11, 0],
]
export default {
	name: 'By repository',
	kicker: 'IV · results',
	title: 'Where it works, where it doesn\'t',
	titleScale: 1.25,
	source: 'Table II · §V-A · GUIRepair (GPT-4o), resolved / tasks',
	notes: "COVER\n• Per repository (Table II): outline = tasks, green = resolved by GUIRepair\n• Works: openlayers 76/79 (96%)\n• Doesn't: carbon 12/134 (9%); scratch-gui 0/11, nobody in the table solves one\nCLICKS\n1 · openlayers · 2 · carbon + scratch-gui\nREF · Table II · §V-A",
	draw(k) {
		const x0 = 470, y0 = 262, pitch = 56, u = 6.4
		REPOS.forEach(([name, num, ok], i) => {
			const y = y0 + i * pitch
			k.text(120, y - 4, name, { font: 'mono', size: 'm', w: 320, align: 'end', color: 'black', id: 'l' + name })
			k.box(x0, y, num * u, 34, { size: 's', color: 'grey', id: 'o' + name })
			if (ok) k.box(x0, y, ok * u, 34, { size: 's', color: 'green', fill: 'solid', dash: 'draw' })
			k.text(x0 + num * u + 22, y - 2, `${ok}/${num}`, { font: 'mono', size: 's', scale: 1.3, color: 'grey' })
		})
		const yo = y0 + 0 * pitch + 17, yc = y0 + 7 * pitch + 17, ys = y0 + 11 * pitch + 17
		k.loop(x0 + 79 * u + 70, yo, 90, 34, { color: 'green', beat: 1, anim: 'wipe' })
		k.text(x0 + 79 * u + 190, y0 - 12, 'works: 96%', { size: 'l', scale: 1.1, color: 'green', beat: 1, rot: -3 })
		k.loop(x0 + 134 * u + 70, yc, 95, 34, { beat: 2, anim: 'wipe' })
		k.text(x0 + 134 * u + 190, yc - 36, '9%', { size: 'l', scale: 1.2, color: 'red', beat: 2, rot: -3 })
		k.loop(x0 + 11 * u + 60, ys, 85, 32, { beat: 2, anim: 'wipe' })
		k.text(x0 + 11 * u + 170, ys - 30, 'nobody in the table solves one', { size: 'm', scale: 1.15, color: 'red', beat: 2, rot: -2 })
	},
}
