// next-4182 as a hand-drawn vertical timeline: steps 1, 2, 3, 7, ending at Patch 8 (Fig. 10).
export default {
	name: 'next-4182',
	kicker: 'III · a case · next-4182',
	title: 'Only the full pipeline solved it',
	titleScale: 1.3,
	source: '§V-B4 · Fig. 10',
	notes: "COVER\n• A case only the full pipeline solved\n• Issue: \"[CascaderSelect] Enabling popup v2 will report an error\"; snippet + screenshot, no complete repro\n• Code2Image alone had nothing to replay; Image2Code alone wrote a repro nobody replayed\nCLICKS\n1 · docs + bug scenario (TypeError … 'getInstance') · 2 · repro code · 3 · cascader-select.jsx · 4 · replays to Patch 8: \"This patch has solved the bug scenario.\"\nREF · §V-B4 · Fig. 10",
	draw(k) {
		// the issue, as a sticky note on the right
		k.note(1340, 300, '[CascaderSelect]\nEnabling\npopup v2 will\nreport an error', { color: 'yellow', scale: 1.8, rot: 2, size: 's' })
		k.text(1360, 720, 'a snippet + a screenshot,\nno complete repro code', { size: 'm', color: 'grey', rot: 2 })
		k.text(1360, 250, 'issue #3992', { size: 's', color: 'grey', rot: 2 })

		// the timeline spine
		const X = 230, YS = [300, 460, 620, 790]
		k.pen([[X, 260], [X + 3, 450], [X - 2, 640], [X + 2, 900]], { size: 'm', color: 'grey', wob: 2 })
		const step = (i, n, title, detail, o = {}) => {
			const y = YS[i]
			k.circle(X, y + 26, 30, { fill: 'semi', color: 'black', text: String(n), size: 's', beat: i + 1, id: 'step' + n })
			k.text(X + 60, y, title, { size: 'l', beat: i + 1 })
			k.text(X + 60, y + 54, detail, { size: 's', scale: 1.2, color: 'grey', font: o.font ?? 'draw', beat: i + 1 })
		}
		step(0, 1, 'knowledge mining', "reads the CascaderSelect docs + popup theme\nbug: TypeError: Cannot read properties of null (reading 'getInstance')")
		step(1, 2, 'repro generation', 'writes the code: popupProps: { v2: true }')
		step(2, 3, 'file localization', 'cascader-select.jsx')
		k.tick(X + 300, YS[2] + 54, 34, { beat: 3 })
		step(3, 7, 'patch selection', 'replays the repro on each patch, in order')

		// P1 … P8 ✓
		const PY = YS[3] + 100
		k.text(X + 60, PY, 'P1  P2  …  P7', { font: 'mono', size: 'l', color: 'grey', beat: 4 })
		k.box(X + 366, PY - 12, 100, 56, { text: 'P8', font: 'mono', color: 'red', size: 'l', scale: 1, labelColor: 'black', beat: 4, anim: 'wipe' })
		k.tick(X + 490, PY - 4, 50, { beat: 4 })
		k.text(X + 570, PY + 4, '“This patch has solved the bug scenario.”', { size: 'm', beat: 4, anim: 'fade' })
	},
}
