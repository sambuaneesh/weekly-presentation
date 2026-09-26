// The ablation (Table III) as two light switches the presenter flips. Actions: ../ext/ablation.js.
export default {
	name: 'Two switches',
	kicker: 'IV · results · ablation',
	title: 'Two switches',
	source: 'Table III · §V-B · SWE-bench M test, GPT-4o',
	notes: "COVER (interactive · Table III, GPT-4o, of 517)\n• Both off (agentless base): 136 · $0.08\n• Image2Code: 146 (+10) · $0.10\n• Code2Image alone: 148 (+12) · $0.27, ~3× cost; only helps where repro code exists (~17%)\n• Both: 157 (+21, +15.44%) · $0.29; neither half gets there alone\nDO\n• press Image2Code · swap to Code2Image alone · then both · reset\nREF · Table III · §V-B",
	draw(k) {
		const PW = 220, PH = 100, R = 36, PAD = (PH - 2 * R) / 2
		const BX = 200, BW = 1500, MAX = 160
		const sw = (which, y, name, sub) => {
			const press = { press: 'toggleAblation', which }
			k.box(BX, y, PW, PH, { geo: 'oval', size: 'l', id: 'sw-' + which, locked: true, meta: { ...press, on: false } })
			k.circle(BX + PAD + R, y + PAD + R, R, { fill: 'solid', color: 'black', size: 'm', id: 'knob-' + which, locked: true, meta: press })
			k.text(BX + PW + 50, y + 4, name, { size: 'xl', scale: 1.05, id: 'name-' + which, locked: true, meta: press })
			k.text(BX + PW + 54, y + 64, sub, { size: 's', scale: 1.2, color: 'grey' })
			k.text(BX + 86, y + PH + 6, 'off', { size: 's', scale: 1.2, color: 'grey', id: 'onoff-' + which, align: 'middle', w: 48 })
		}
		sw('i2c', 290, 'Image2Code', 'reads the picture as code')
		sw('c2i', 480, 'Code2Image', 'reads the code as a picture')
		k.text(212, 640, 'click one ↑', { size: 's', scale: 1.1, color: 'grey', rot: -4 })

		// The readout.
		k.text(1080, 250, '136', { size: 'xl', scale: 4.4, id: 'count', align: 'middle', w: 560 })
		k.text(1080, 480, 'resolved of 517', { size: 'm', scale: 1.2, color: 'grey', align: 'middle', w: 560 })
		k.text(1600, 290, '+0', { size: 'xl', scale: 1.6, color: 'grey', id: 'delta', rot: -8 })
		k.text(1080, 560, '$0.08 per issue', { size: 'l', scale: 1.25, id: 'cost', align: 'middle', w: 560 })

		// The bar, on a 0–160 scale, with a tick at the base's 136.
		const y = 740
		k.pen([[BX - 6, y + 76], [BX + BW * 0.5, y + 78], [BX + BW + 20, y + 75]], { color: 'grey', size: 's', wob: 1 })
		k.box(BX, y, Math.round((136 / MAX) * BW), 64, { fill: 'pattern', size: 'm', id: 'bar' })
		k.text(BX + Math.round((136 / MAX) * BW) + 24, y + 6, '136', { size: 'l', scale: 1.1, id: 'barlabel' })
		const tx = BX + (136 / MAX) * BW
		k.pen([[tx, y - 22], [tx + 1, y + 50], [tx, y + 96]], { color: 'grey', size: 's', wob: 0.5 })
		k.text(tx - 60, y + 96, 'base 136', { size: 's', scale: 1.05, color: 'grey', align: 'middle', w: 120 })
		k.text(BX - 10, y + 88, '0', { size: 's', scale: 1.05, color: 'grey' })
		k.text(BX + BW - 30, y + 88, '160', { size: 's', scale: 1.05, color: 'grey' })

		k.text(BX, 890, 'the agentless core alone: localize, then write the patch', { size: 'm', scale: 1.25, id: 'note', w: 1300 })

		k.box(1630, 118, 170, 64, { text: '↺ reset', color: 'grey', dash: 'dashed', size: 's', scale: 1.2, id: 'reset', locked: true, meta: { press: 'resetAblation' } })
	},
}
