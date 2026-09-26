// Step 2: the generated repro code (Fig. 6b, exact lines) mapped onto the symptom it replays.
// Kit workaround: helpers.createArrowBetweenShapes drops color/dash/size, so restyle bound arrows after
// creation; optional precise anchors per arrow (normalized, on the start/end shapes) via helpers.__paperAnchors.
function styledArrows() {
	if (typeof helpers === 'undefined') return
	helpers.__paperAnchors = new Map()
	if (helpers.__paperStyled2) return
	const orig = helpers.createArrowBetweenShapes
	helpers.createArrowBetweenShapes = (a, b, p = {}) => {
		const id = orig(a, b, p)
		editor.updateShape({ id, type: 'arrow', props: { color: p.color ?? 'black', dash: p.dash ?? 'draw', size: p.size ?? 'm', font: p.font ?? 'draw' } })
		const an = helpers.__paperAnchors?.get(a + '>' + b)
		if (an)
			for (const bd of editor.getBindingsFromShape(id, 'arrow')) {
				const na = an[bd.props.terminal]
				if (na) editor.updateBinding({ ...bd, props: { ...bd.props, normalizedAnchor: na, isPrecise: true } })
			}
		return id
	}
	helpers.__paperStyled2 = true
}
function anchorArrow(k, from, to, start, end) {
	if (typeof helpers !== 'undefined') helpers.__paperAnchors?.set(k.tag(from) + '>' + k.tag(to), { start, end })
}
const CODE = [
	[1, 'const { createElement: h } = React;'],
	[2, 'const { Button, Dialog, DatePicker, ConfigProvider } = Next;'],
	[3, ''],
	[4, 'class App extends React.Component {'],
	[5, '  state = {'],
	[6, '    visible: false'],
	[7, '  };'],
	[8, ''],
	[9, '  render() {'],
	[10, '    return ('],
	[11, '      <ConfigProvider popupContainer={"test"}>'],
	[12, "      <div id=\"test\" style={{height: 300, overflow: 'auto'}}>"],
	[13, '        ……'],
	[42, '      </div>'],
	[43, '      </ConfigProvider>'],
	[44, '    );'],
	[45, '  }'],
	[46, '}'],
	[47, 'ReactDOM.render(<App/>, root);'],
]
const NX = 110 // line numbers
const CX = 170 // code
const Y0 = 290
const LH = 32
const GAP = 70 // the blank line 3 is drawn tall: a corridor for the arrows
const CW = 10.8 // mono char width at size s × 1
const lineY = (row) => (row < 2 ? Y0 + row * LH : row === 2 ? Y0 + 2 * LH + (GAP - 24) / 2 : Y0 + 2 * LH + GAP + (row - 3) * LH)
const TOKENS = [
	{ id: 'c-btn', col: 8, len: 6, to: 'sk-yes', end: { x: 0, y: 0.5 } },
	{ id: 'c-dlg', col: 16, len: 6, to: 'sk-dialog', end: { x: 0, y: 0.5 } },
	{ id: 'c-dp', col: 24, len: 10, to: 'sk-cal', end: { x: 0, y: 0.8 } },
]
const SK = { x: 1080, y: 250, w: 700, h: 420 }

export default {
	name: 'Repro map',
	kicker: 'II · the method · ❷ repro generation',
	title: 'the picture, written as code',
	source: 'next-1509 · code as in Fig. 6b · sketch redrawn from Fig. 6a · §III-A2',
	notes: "COVER\n• With the Related Docs in the prompt, the model writes code that reproduces the scene\n• Lines 1–2: which components are involved (Button, Dialog, DatePicker)\n• Lines 4–47: how they're arranged to trigger it (ConfigProvider popupContainer + scrolling div)\nCLICKS\n1–3 · Button, Dialog, DatePicker linked to the sketch · 4 · lines 4–47 bracketed\nREF · §III-A2 · Fig. 6b",
	draw(k) {
		styledArrows()
		// the sketch of the symptom
		k.box(SK.x, SK.y, SK.w, SK.h, { fill: 'solid', color: 'white', size: 's' })
		k.box(SK.x, SK.y, SK.w, 36, { fill: 'semi', color: 'grey', size: 's' })
		;[0, 1, 2].forEach((i) => k.circle(SK.x + 24 + i * 22, SK.y + 18, 6, { fill: 'solid', color: ['red', 'yellow', 'green'][i], size: 's' }))
		k.box(SK.x + 3, SK.y + 40, SK.w - 6, SK.h - 43, { fill: 'fill', color: 'grey', size: 's', dash: 'dotted', opacity: 0.45 })
		const cal = { x: SK.x + 400, y: SK.y + 150, w: 250, h: 240 }
		k.box(cal.x, cal.y, cal.w, cal.h, { fill: 'solid', color: 'white', size: 's', id: 'sk-cal' })
		k.grid(cal.x + 22, cal.y + 88, 7, 35, 31, 10, { fill: 'solid', color: 'grey' })
		k.box(SK.x + 70, SK.y + 70, 470, 160, { fill: 'solid', color: 'white', size: 's', id: 'sk-dialog' })
		k.text(SK.x + 92, SK.y + 84, 'Welcome to Alibaba.com', { size: 's', scale: 0.8 })
		k.box(SK.x + 300, SK.y + 124, 220, 30, { size: 's', color: 'grey' })
		k.box(SK.x + 380, SK.y + 180, 60, 32, { fill: 'semi', size: 's', text: 'YES', scale: 0.7, id: 'sk-yes' })
		k.box(SK.x + 450, SK.y + 180, 60, 32, { size: 's', text: 'NO', scale: 0.7, id: 'sk-no' })
		k.text(SK.x, SK.y + SK.h + 14, 'the symptom (sketch)', { size: 's', scale: 1.1, color: 'grey', w: SK.w, align: 'middle' })

		// the code, as generated
		CODE.forEach(([n, text], row) => {
			k.text(NX, lineY(row), String(n), { font: 'mono', size: 's', color: 'grey', w: 40, align: 'end' })
			if (text) k.text(CX, lineY(row), text, { font: 'mono', size: 's', color: row < 2 ? 'black' : 'black', id: `line-${n}` })
		})

		// clicks 1–3: the components named on line 2, each tied to its part of the picture
		TOKENS.forEach((t, i) => {
			k.box(CX + t.col * CW - 5, lineY(1) - 5, t.len * CW + 10, 34, { color: 'red', size: 's', beat: i + 1, anim: 'wipe', id: t.id })
			anchorArrow(k, t.id, t.to, { x: 0.5, y: 1 }, t.end)
			k.arrow(t.id, t.to, { color: 'red', size: 'm', bend: [6, 4, 0][i], beat: i + 1, id: `map-${i}` })
		})

		// click 4: the rest is the arrangement that triggers it
		const top = lineY(3) - 2
		const bot = lineY(CODE.length - 1) + 28
		const bx = 880
		k.pen([[bx, top], [bx + 18, top + 8], [bx + 20, (top + bot) / 2 - 16], [bx + 36, (top + bot) / 2], [bx + 20, (top + bot) / 2 + 16], [bx + 18, bot - 8], [bx, bot]], { color: 'red', size: 'm', wob: 1, beat: 4, anim: 'wipe' })
		k.text(bx + 64, (top + bot) / 2 + 30, 'lines 4–47:\nhow they’re arranged', { size: 'l', scale: 1, color: 'red', beat: 4, anim: 'fade', rot: -2 })
	},
}
