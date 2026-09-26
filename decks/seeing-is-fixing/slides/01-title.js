// Title: the name, hand-lettered; a print of the fixed YAML drying on a line; and a finger that comes out of the screen at the presenter.
export default {
	name: 'Title',
	notes: "COVER\n• Paper: Seeing is Fixing (Huang, Zhang, Xie, Chen · TUM, NTU, SMU · arXiv 2506.16136, 2025)\n• One line: GUIRepair fixes bugs in GUI libraries by looking at them\n• The frame for the talk: a darkroom (develop → fix)\n• Say who you are\nCLICKS\n1 · the finger pops out of the screen at you: \"presented by me\"\nREF · title page",
	draw(k) {
		k.text(160, 330, 'Seeing is Fixing', { size: 'xl', scale: 2.6 })
		k.underline(170, 520, 900, { color: 'red' })
		k.text(166, 580, 'cross-modal reasoning with multimodal LLMs\nfor visual software issue fixing', { size: 'l', scale: 1.1, color: 'grey' })
		k.text(166, 760, 'Kai Huang · Jian Zhang · Xiaofei Xie · Chunyang Chen', { size: 'm', scale: 1.1 })
		k.text(166, 810, 'arXiv 2506.16136 · June 2025', { size: 's', scale: 1.2, color: 'grey' })

		// a drying line with one print pegged to it
		k.pen([[1200, 262], [1360, 282], [1520, 290], [1680, 284], [1820, 268]], { wob: 2, size: 's', color: 'grey' })
		const px = 1330, py = 300, pw = 380, ph = 250
		k.box(px, py, pw, ph, { fill: 'solid', color: 'grey', size: 's', id: 'print' })
		k.box(px + 22, py + 22, pw - 44, ph - 44, { fill: 'none', color: 'grey', size: 's', dash: 'dotted' })
		// the fixed render (Patch 2, Fig. 7b): mono m, ~14px per character
		const cw = 14.1, lx = px + 50, ly = py + 60, lh = 44
		const tok = (row, col, s, color) => k.text(lx + col * cw, ly + row * lh, s, { font: 'mono', size: 'm', color })
		tok(0, 0, 'hello', 'blue'); tok(0, 5, ':', 'grey')
		tok(1, 2, '-', 'grey'); tok(1, 4, '"world"', 'green'); tok(1, 12, '# test', 'grey')
		tok(2, 2, '-', 'grey'); tok(2, 4, '"world"', 'green')
		// two wooden pegs
		for (const x of [px + 60, px + pw - 80]) k.box(x, py - 34, 20, 58, { fill: 'solid', color: 'orange', size: 's', rot: -4 })

		// presented by… and a finger that comes out of the screen, pointing at the presenter
		k.text(166, 862, 'presented by', { size: 'm', scale: 1.1, color: 'grey' })
		k.text(166, 894, 'Aneesh S', { size: 'xl', scale: 1.1 })
		k.underline(170, 962, 240, { color: 'red', size: 'm' })

		// Foreshortened hand, index finger pointing straight out of the screen (Uncle-Sam style).
		// Everything shares one origin (the fingertip) so it zooms out as one drawing.
		const FX = 1440, FY = 740
		const O = { beat: 1, anim: 'zoom', origin: [FX, FY] }
		// skin = a peach wash under an ink outline
		const skin = (x, y, w, h, geo, id) => {
			k.box(x, y, w, h, { geo, color: 'orange', fill: 'semi', dash: 'solid', size: 's', ...O, id: id + '-skin' })
			k.box(x, y, w, h, { geo, color: 'black', fill: 'none', dash: 'draw', size: 'm', ...O, id })
		}
		// cuff and wrist, going off to the lower right
		k.box(FX + 150, FY + 150, 190, 120, { geo: 'rectangle', color: 'blue', fill: 'semi', dash: 'draw', size: 'm', rot: -28, ...O, id: 'cuff' })
		// back of the fist
		skin(FX - 40, FY + 10, 290, 230, 'ellipse', 'fist')
		// three curled fingers, stacked under the index finger
		for (let i = 0; i < 3; i++) skin(FX - 60 + i * 12, FY + 60 + i * 52, 250 - i * 30, 62, 'oval', 'curl-' + i)
		// the thumb folded across them
		skin(FX - 120, FY + 70, 190, 58, 'oval', 'thumb')
		// the index finger seen end-on: the fingertip nearest to us, nail on top
		skin(FX - 92, FY - 92, 184, 184, 'ellipse', 'tip')
		k.box(FX - 40, FY - 84, 80, 44, { geo: 'oval', color: 'black', fill: 'none', dash: 'draw', size: 's', ...O, id: 'nail' })
		k.pen([[FX - 34, FY + 34], [FX - 8, FY + 48], [FX + 22, FY + 46]], { size: 's', color: 'grey', ...O, id: 'crease' })
		// motion rays on the open side: it's coming at you
		for (let i = 0; i < 8; i++) {
			const a = Math.PI * 0.92 + (i / 7) * Math.PI * 0.85
			const r0 = 125, r1 = 180
			k.pen([[FX + r0 * Math.cos(a), FY + r0 * Math.sin(a)], [FX + r1 * Math.cos(a), FY + r1 * Math.sin(a)]], { size: 'm', color: 'red', ...O, id: 'ray-' + i })
		}
		k.text(FX - 330, FY + 190, '(yes, him.)', { size: 'm', scale: 1.1, color: 'red', rot: -6, beat: 1, anim: 'fade', id: 'him' })
	},
}
