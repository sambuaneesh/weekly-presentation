// Only 17% of SWE-bench M reports include repro code ([22], §II-A). Report layers from Fig. 2.
export default {
	name: 'Seventeen',
	kicker: 'I · the problem · fault understanding',
	title: 'The missing third layer',
	source: '[22] via §II-A · layers from Fig. 2',
	notes: "COVER\n• A multimodal report has 3 layers: description · image · repro code\n• Repro code is what links the picture to code\n• Only 17% of SWE-bench M reports include it\nCLICKS\n1 · 17 of 100 boxes fill\nREF · §II-A · Fig. 2 · [22]",
	draw(k) {
		// three stacked sheets, like prints on a drying line
		const sx = 200
		k.box(sx + 60, 300, 520, 170, { fill: 'solid', color: 'white', size: 's', rot: 2, id: 'sh1' })
		k.text(sx + 90, 318, '1 · description', { size: 'm', color: 'grey', rot: 2, id: 'sh1-t' })
		for (let i = 0; i < 3; i++) k.pen([[sx + 100, 380 + i * 30 + i * 2], [sx + 300 + i * 60, 382 + i * 30 + i * 3], [sx + 480 - i * 40, 384 + i * 30 + i * 4]], { color: 'grey', size: 's', wob: 3, id: 'sh1-l' + i })
		k.box(sx + 20, 500, 520, 170, { fill: 'solid', color: 'white', size: 's', rot: -1.5, id: 'sh2' })
		k.text(sx + 50, 512, '2 · screenshot', { size: 'm', color: 'grey', rot: -1.5, id: 'sh2-t' })
		k.pen([[sx + 80, 650], [sx + 190, 570], [sx + 250, 620], [sx + 320, 555], [sx + 470, 650]], { size: 'm', wob: 3, id: 'sh2-mtn' })
		k.circle(sx + 420, 575, 22, { color: 'black', size: 's', id: 'sh2-sun' })
		k.box(sx + 50, 700, 520, 170, { fill: 'solid', color: 'white', size: 's', rot: 1, id: 'sh3' })
		k.text(sx + 80, 712, '3 · repro code', { size: 'm', color: 'grey', rot: 1, id: 'sh3-t' })
		k.text(sx + 90, 765, '<script>\n  render(…)', { font: 'mono', size: 's', scale: 1.3, color: 'blue', rot: 1, id: 'sh3-code' })
		k.loop(sx + 310, 785, 295, 102, { beat: 1, anim: 'wipe', id: 'sh3-loop' })

		// 100 reports, 17 with repro code
		const gx = 1030, gy = 300, pitch = 56, sz = 40
		k.grid(gx, gy, 10, 100, pitch, sz, { geo: 'rectangle', color: 'grey', id: 'g' })
		k.grid(gx, gy, 10, 17, pitch, sz, { geo: 'rectangle', color: 'red', fill: 'fill', id: 'f', beat: 1, anim: 'pop' })
		k.text(gx - 13, gy + 10 * pitch + 20, 'only 17% of reports\ninclude repro code', { size: 'xl', align: 'middle', w: 620, beat: 1, id: 'say' })
		k.text(gx + 244, gy - 70, '100 reports', { size: 'm', color: 'grey', align: 'end', w: 300, id: 'lbl', rot: -2 })
		k.text(gx - 20, gy - 70, 'SWE-bench M', { size: 'm', color: 'grey', id: 'lbl2' })
	},
}
