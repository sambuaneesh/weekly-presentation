// The agentic decomposition workflow, traced live on one real run.
//
// Beat 0 shows the whole architecture (the paper's Fig. 1). Each click moves a camera onto the
// agent that acts next, while an inspector on the right shows what that agent does to the run:
// Spring PetClinic (23 classes) with DeepSeek v4.1 Flash, study final-benchmark-v1, run
// final-benchmark-v1-agentic-agentic-final-v1b-spring-petclinic-deepseek-v4-1-flash-s1-r1.
// Every number below is copied from that run's artifacts (evidence pack, domain model,
// candidates, refinement rounds, blinded report, LLM call log); nothing is illustrative.
//
// The 23 class chips are one set of elements whose positions depend on the beat, so they
// physically travel from the inventory, into capability groups, into services, and between
// services when the refiner moves them.
import { html, C, F, EASE, box } from '@pack/scenes/kit.js'

// ------------------------------------------------------------------ the run's data
const CLASSES = [
	'Owner', 'OwnerController', 'OwnerRepository', 'Person',
	'Pet', 'PetController', 'PetType', 'PetTypeFormatter', 'PetValidator',
	'Visit', 'VisitController',
	'Vet', 'VetController', 'VetRepository', 'Specialty', 'Vets',
	'PetClinicApplication', 'PetClinicRuntimeHints', 'CacheConfiguration', 'WelcomeController', 'CrashController',
	'BaseEntity', 'NamedEntity',
]

// Domain Knowledge Extractor: capability of each class (domain-model.json).
const CAPS = [
	{ name: 'Owner Management', color: '#3f6fc4', classes: ['Owner', 'OwnerController', 'OwnerRepository', 'Person'] },
	{ name: 'Pet Management', color: '#2e8b7e', classes: ['Pet', 'PetController', 'PetType', 'PetTypeFormatter', 'PetValidator'] },
	{ name: 'Visit Management', color: '#d99a2b', classes: ['Visit', 'VisitController'] },
	{ name: 'Veterinarian Management', color: '#8a5fc0', classes: ['Vet', 'VetController', 'VetRepository', 'Specialty', 'Vets'] },
	{ name: 'System Infrastructure', color: '#6f675c', classes: ['PetClinicApplication', 'PetClinicRuntimeHints', 'CacheConfiguration', 'WelcomeController', 'CrashController'] },
	{ name: 'Domain Model Foundations', color: '#d64533', classes: ['BaseEntity', 'NamedEntity'] },
]
const CAP_OF = Object.fromEntries(CAPS.flatMap((c) => c.classes.map((k) => [k, c])))

// Dependency-first candidate (CAND_001), then the refiner's three accepted moves.
const DEP_FIRST = {
	OwnerPetVisitService: ['Owner', 'OwnerController', 'OwnerRepository', 'Pet', 'PetController', 'PetType', 'PetTypeFormatter', 'PetValidator', 'Visit', 'VisitController'],
	VetService: ['Vet', 'VetController', 'VetRepository', 'Specialty', 'Vets'],
	SystemInfrastructureService: ['PetClinicApplication', 'PetClinicRuntimeHints', 'CacheConfiguration', 'WelcomeController', 'CrashController'],
	DomainFoundationService: ['BaseEntity', 'NamedEntity', 'Person'],
}
const MOVES = [
	{ cls: 'Vet', from: 'VetService', to: 'DomainFoundationService', cmod: 60.7, mf: 73.9 },
	{ cls: 'Specialty', from: 'VetService', to: 'DomainFoundationService', cmod: 65.7, mf: 73.9 },
	{ cls: 'Visit', from: 'OwnerPetVisitService', to: 'DomainFoundationService', cmod: 66.8, mf: 76.5 },
]
function partitionAfter(nMoves) {
	const p = Object.fromEntries(Object.entries(DEP_FIRST).map(([k, v]) => [k, [...v]]))
	for (const m of MOVES.slice(0, nMoves)) {
		p[m.from] = p[m.from].filter((c) => c !== m.cls)
		p[m.to] = [...p[m.to], m.cls]
	}
	return p
}

// The 49 typed dependency edges of the evidence pack (source, target), copied from evidence-pack.json.
const EDGES = [['Vet', 'Specialty'], ['Vet', 'Person'], ['Specialty', 'NamedEntity'], ['VetController', 'Vets'], ['VetController', 'Vets'], ['VetController', 'VetRepository'], ['VetController', 'Vet'], ['VetController', 'Vets'], ['Vets', 'Vet'], ['Pet', 'PetType'], ['Pet', 'Visit'], ['Pet', 'NamedEntity'], ['VisitController', 'Pet'], ['VisitController', 'Owner'], ['VisitController', 'Pet'], ['VisitController', 'Owner'], ['VisitController', 'OwnerRepository'], ['VisitController', 'Visit'], ['VisitController', 'Visit'], ['PetTypeFormatter', 'NamedEntity'], ['PetTypeFormatter', 'PetType'], ['OwnerController', 'BaseEntity'], ['OwnerController', 'Person'], ['OwnerController', 'Owner'], ['OwnerController', 'OwnerRepository'], ['OwnerController', 'Owner'], ['PetController', 'Pet'], ['PetController', 'Owner'], ['PetController', 'BaseEntity'], ['PetController', 'NamedEntity'], ['PetController', 'Pet'], ['PetController', 'Owner'], ['PetController', 'PetValidator'], ['PetController', 'OwnerRepository'], ['PetController', 'Pet'], ['PetController', 'PetValidator'], ['PetValidator', 'Pet'], ['PetValidator', 'BaseEntity'], ['PetValidator', 'NamedEntity'], ['PetValidator', 'Pet'], ['Owner', 'Pet'], ['Owner', 'BaseEntity'], ['Owner', 'Pet'], ['Owner', 'Visit'], ['Owner', 'Person'], ['Visit', 'BaseEntity'], ['PetType', 'NamedEntity'], ['Person', 'BaseEntity'], ['NamedEntity', 'BaseEntity']]

// ------------------------------------------------------------------ look
const K = {
	tool: { fill: '#fbeaf2', stroke: '#c0578e' },
	llm: { fill: '#e4f4ec', stroke: '#2e9e6e' },
	hybrid: { fill: '#e4eefa', stroke: '#2f6fb5' },
	plain: { fill: '#fffdf8', stroke: '#6f675c' },
	future: { fill: 'rgba(255,255,255,0.4)', stroke: '#9a948a' },
}
const SLOW = 1100 // camera move, ms

// ------------------------------------------------------------------ world (the diagram)
// World coordinates follow the paper's figure, scaled to a 1920 × 1180 board.
const N = {
	src: { x: 40, y: 120, w: 270, h: 66, kind: 'plain', label: 'Monolith source', sub: '(scoped classes)' },
	graph: { x: 40, y: 215, w: 270, h: 66, kind: 'plain', label: 'Static dependency', sub: 'graph' },
	inv: { x: 40, y: 310, w: 270, h: 66, kind: 'plain', label: 'Canonical class', sub: 'inventory' },
	ev: { x: 450, y: 110, w: 380, h: 120, kind: 'hybrid', n: 1, label: 'Architectural Evidence', sub: 'Constructor Agent' },
	dom: { x: 1030, y: 110, w: 380, h: 120, kind: 'llm', n: 2, label: 'Domain Knowledge', sub: 'Extractor Agent' },
	gen: { x: 930, y: 330, w: 480, h: 130, kind: 'llm', n: 3, label: 'Decomposition Generator Agent', sub: 'dependency-first · domain-first · balanced · repair' },
	evl: { x: 930, y: 570, w: 480, h: 120, kind: 'tool', n: 4, label: 'Decomposition Evaluator Agent', sub: 'validity gate · score · select' },
	ref: { x: 440, y: 570, w: 340, h: 120, kind: 'tool', n: 5, label: 'Decomposition Refiner Agent', sub: 'bounded Pareto local search' },
	qa: { x: 1560, y: 400, w: 300, h: 120, kind: 'future', label: 'Quality Agent', sub: '(future work)' },
	frz: { x: 970, y: 800, w: 400, h: 80, kind: 'plain', label: 'Frozen decomposition', bold: true },
	refd: { x: 470, y: 1020, w: 320, h: 80, kind: 'plain', label: 'Reference', sub: 'decomposition' },
	bl: { x: 970, y: 1010, w: 400, h: 100, kind: 'tool', label: 'Blinded Evaluator' },
	met: { x: 1500, y: 1020, w: 340, h: 80, kind: 'plain', label: 'Design + similarity', sub: 'metrics' },
}

// Arrows: [id, points, label, label position, dashed]
const A = [
	['srcEv', [[310, 153], [450, 153]]],
	['graphEv', [[310, 248], [520, 248], [520, 230]]],
	['invEvl', [[175, 376], [175, 780], [1100, 780], [1100, 690]]],
	['evDom', [[830, 170], [1030, 170]], 'evidence pack', [930, 150]],
	['domGen', [[1220, 230], [1220, 330]], 'capability map', [1310, 285]],
	['evGen', [[640, 230], [640, 395], [930, 395]], 'evidence', [785, 375]],
	['genEvl', [[1170, 460], [1170, 570]], '3 candidates', [1250, 520]],
	['evlRef', [[930, 610], [780, 610]], 'selected', [855, 590]],
	['refEvl', [[780, 655], [930, 655]], 'accepted move', [855, 678]],
	['qaGen', [[1560, 430], [1485, 430], [1485, 395], [1410, 395]], null, null, true],
	['qaEvl', [[1560, 490], [1485, 490], [1485, 630], [1410, 630]], null, null, true],
	['evlFrz', [[1170, 690], [1170, 800]], 'after refinement', [1265, 760]],
	['frzBl', [[1170, 880], [1170, 1010]]],
	['refdBl', [[790, 1060], [970, 1060]]],
	['blMet', [[1370, 1060], [1500, 1060]]],
]
const pathOf = (pts) => 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L')

// ------------------------------------------------------------------ steps
// cam: world rect to frame. panel: whether the inspector is open. focus: nodes to highlight.
// packets: arrows with a moving token.
const STEPS = [
	{ title: 'The agentic decomposition workflow', cam: 'all', focus: [], packets: [] },
	{ title: 'Inputs: the monolith, its graph, and the class inventory', cam: [20, 90, 830, 310], focus: ['src', 'graph', 'inv', 'ev'], packets: ['srcEv', 'graphEv'] },
	{ title: '1 · Evidence Constructor · code facts + LLM views', cam: [420, 80, 440, 180], focus: ['ev'], packets: ['evDom', 'evGen'] },
	{ title: '2 · Domain Extractor · provisional business capabilities', cam: [1000, 80, 440, 280], focus: ['dom'], packets: ['domGen'] },
	{ title: '3 · Generator · three candidates, three perspectives', cam: [900, 300, 540, 300], focus: ['gen'], packets: ['genEvl'] },
	{ title: '4 · Evaluator · gate, score, select (no reference)', cam: [900, 540, 540, 260], focus: ['evl'], packets: ['invEvl'] },
	{ title: '5 · Refiner · round 1', cam: [400, 520, 600, 230], focus: ['ref', 'evl'], packets: ['evlRef', 'refEvl'] },
	{ title: '5 · Refiner · round 2', cam: [400, 520, 600, 230], focus: ['ref', 'evl'], packets: ['evlRef', 'refEvl'] },
	{ title: '5 · Refiner · round 3', cam: [400, 520, 600, 230], focus: ['ref', 'evl'], packets: ['evlRef', 'refEvl'] },
	{ title: '5 · Refiner · round 4: nothing improves, stop', cam: [400, 520, 600, 230], focus: ['ref', 'evl'], packets: [] },
	{ title: 'Freeze: the answer is fixed before any reference is seen', cam: [900, 660, 540, 260], focus: ['frz', 'evl'], packets: ['evlFrz'] },
	{ title: 'Only now: blinded evaluation against the reference', cam: [440, 780, 1440, 360], focus: ['frz', 'refd', 'bl', 'met'], packets: ['frzBl', 'refdBl', 'blMet'] },
	{ title: 'One run, end to end', cam: 'all', focus: [], packets: [], summary: true },
]
export const AGENTIC_BEATS = STEPS.length - 1

// Screen regions (design px).
const VIEW_FULL = { x: 30, y: 150, w: 1860, h: 910 }
const VIEW_LEFT = { x: 30, y: 170, w: 840, h: 880 }
const PANEL = { x: 900, y: 170, w: 990, h: 880 }

const VIEW_SUMMARY = { x: 20, y: 160, w: 1400, h: 900 }
function camera(step) {
	const r = step.cam === 'all' ? [20, 30, 1880, 1110] : step.cam
	const v = step.summary ? VIEW_SUMMARY : step.cam === 'all' ? VIEW_FULL : VIEW_LEFT
	const s = Math.min(v.w / r[2], v.h / r[3], 2.3)
	const tx = v.x + v.w / 2 - s * (r[0] + r[2] / 2)
	const ty = v.y + v.h / 2 - s * (r[1] + r[3] / 2)
	return `translate(${tx}px, ${ty}px) scale(${s})`
}

// ------------------------------------------------------------------ world rendering
function Node({ id, n, dim, hot, badge, still }) {
	const k = K[n.kind]
	return html`<div style=${{
			...box(n.x, n.y, n.w, n.h),
			background: k.fill,
			border: `${n.kind === 'future' ? 3 : 3}px ${n.kind === 'future' ? 'dashed' : 'solid'} ${k.stroke}`,
			borderRadius: 14,
			display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
			fontFamily: F.sans, color: n.kind === 'future' ? '#8a847a' : C.ink,
			opacity: dim ? 0.28 : 1,
			boxShadow: hot ? `0 0 0 6px ${k.stroke}33, 0 14px 30px rgba(0,0,0,0.12)` : '0 2px 0 rgba(0,0,0,0.06)',
			transition: still ? 'none' : `opacity 600ms ${EASE}, box-shadow 600ms ${EASE}`,
		}}>
		${n.n && html`<div style=${{ position: 'absolute', left: -16, top: -16, width: 36, height: 36, borderRadius: 18, background: C.ink, color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>${n.n}</div>`}
		<div style=${{ fontSize: n.bold ? 28 : 25, fontWeight: n.bold ? 700 : 500, lineHeight: 1.15 }}>${n.label}</div>
		${n.sub && html`<div style=${{ fontSize: id === 'gen' || id === 'evl' || id === 'ref' ? 18 : 23, marginTop: 4, color: id === 'gen' || id === 'evl' || id === 'ref' ? '#4d473f' : 'inherit' }}>${n.sub}</div>`}
		${badge && html`<div style=${{ position: 'absolute', right: -12, bottom: -18, padding: '4px 12px', borderRadius: 999, background: C.ink, color: '#fff', fontSize: 17, fontWeight: 600, whiteSpace: 'nowrap' }}>${badge}</div>`}
	</div>`
}

function Arrows({ step, frozen, still }) {
	const active = new Set(step.packets)
	return html`<svg width="1920" height="1180" style=${{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
		<defs>
			<marker id="aw-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
				<path d="M0 0 L10 5 L0 10 z" fill=${C.ink} />
			</marker>
			<marker id="aw-head-grey" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
				<path d="M0 0 L10 5 L0 10 z" fill="#9a948a" />
			</marker>
		</defs>
		${A.map(([id, pts, , , dashed]) => html`<path key=${id} d=${pathOf(pts)} fill="none"
			stroke=${dashed ? '#9a948a' : C.ink} strokeWidth=${active.has(id) ? 4 : 2.6} strokeDasharray=${dashed ? '10 7' : 'none'}
			markerEnd=${dashed ? 'url(#aw-head-grey)' : 'url(#aw-head)'} />`)}
		${A.filter(([id]) => active.has(id)).map(([id, pts]) => html`<path key=${id + 'f'} d=${pathOf(pts)} fill="none"
			stroke=${C.red} strokeWidth="6" strokeLinecap="round" strokeDasharray="14 34"
			style=${{ animation: frozen ? 'none' : 'gr-flow 0.9s linear infinite', opacity: 0.85 }} />`)}
		<line x1="20" y1="930" x2="1900" y2="930" stroke=${C.red} strokeWidth="4" strokeDasharray="14 10" />
	</svg>`
}

function Labels() {
	return html`<div>
		${A.filter(([, , label]) => label).map(([id, , label, [x, y]]) => html`<div key=${id} style=${{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', fontFamily: F.sans, fontSize: 18, color: C.ink, background: C.paper, padding: '0 4px', whiteSpace: 'nowrap' }}>${label}</div>`)}
		<div style=${{ position: 'absolute', left: 30, top: 900, fontFamily: F.sans, fontSize: 22, fontWeight: 700, color: C.red }}>oracle firewall: no reference information above this line</div>
		<div style=${{ position: 'absolute', left: 60, top: 86, fontFamily: F.sans, fontSize: 24, fontWeight: 700 }}>Inputs</div>
	</div>`
}

function Controller({ dim, still }) {
	return html`<div style=${{ ...box(400, 40, 1070, 700), border: `3px dashed ${K.tool.stroke}`, borderRadius: 22, opacity: dim ? 0.35 : 1, transition: still ? 'none' : `opacity 600ms ${EASE}` }}>
		<div style=${{ position: 'absolute', left: 18, top: 10, fontFamily: F.sans, fontSize: 21, fontWeight: 700, color: K.tool.stroke }}>Process Controller (tool): orders stages · validates artifacts · freezes the result · records provenance</div>
	</div>`
}

function Legend() {
	const row = (fill, stroke, t) => html`<div style=${{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
		<div style=${{ width: 44, height: 24, borderRadius: 5, background: fill, border: `3px solid ${stroke}` }} /><span>${t}</span></div>`
	return html`<div style=${{ ...box(40, 975, 380, 150), fontFamily: F.sans, fontSize: 20, border: `2px solid ${C.line}`, borderRadius: 10, padding: 16, background: '#fffdf8' }}>
		${row(K.tool.fill, K.tool.stroke, 'Tool (deterministic)')}
		${row(K.llm.fill, K.llm.stroke, 'LLM')}
		${row(K.hybrid.fill, K.hybrid.stroke, 'Hybrid (tool + LLM)')}
	</div>`
}

// ------------------------------------------------------------------ inspector: chip layouts
const CHIP_H = 34
function gridLayout() {
	const pos = {}
	const cols = 4, cw = 238, rh = 56, x0 = PANEL.x + 24, y0 = PANEL.y + 130
	CLASSES.forEach((c, i) => {
		pos[c] = { x: x0 + (i % cols) * cw, y: y0 + Math.floor(i / cols) * rh, w: 222 }
	})
	return pos
}

// Boxes laid out in a 2-column grid; one chip per row inside each box.
function boxLayout(groups, { x0, y0, colW, chipW, gap = 22, head = 44 }) {
	const pos = {}
	const boxes = []
	const colY = [y0, y0]
	groups.forEach((g, i) => {
		const col = i % 2
		const bx = x0 + col * (colW + gap)
		const by = colY[col]
		const hgt = head + g.classes.length * (CHIP_H + 8) + 12
		boxes.push({ ...g, x: bx, y: by, w: colW, h: hgt })
		g.classes.forEach((c, j) => {
			pos[c] = { x: bx + (colW - chipW) / 2, y: by + head + j * (CHIP_H + 8), w: chipW }
		})
		colY[col] += hgt + gap
	})
	return { pos, boxes }
}

const SERVICE_ORDER = ['OwnerPetVisitService', 'VetService', 'SystemInfrastructureService', 'DomainFoundationService']
function serviceLayout(partition) {
	const groups = SERVICE_ORDER.map((name) => ({ name, classes: partition[name] }))
	return boxLayout(groups, { x0: PANEL.x + 20, y0: PANEL.y + 110, colW: 280, chipW: 248, gap: 18 })
}

function capabilityLayout() {
	return boxLayout(CAPS, { x0: PANEL.x + 24, y0: PANEL.y + 150, colW: 460, chipW: 300, gap: 22, head: 44 })
}

function chipsFor(B) {
	if (B >= 1 && B <= 2) return { pos: gridLayout(), boxes: [], colored: false }
	if (B === 3) return { ...capabilityLayout(), colored: true }
	if (B >= 4 && B <= 5) return { ...serviceLayout(partitionAfter(0)), colored: true }
	if (B >= 6 && B <= 8) return { ...serviceLayout(partitionAfter(B - 5)), colored: true, moved: MOVES[B - 6].cls }
	if (B >= 9 && B <= 11) return { ...serviceLayout(partitionAfter(3)), colored: true, locked: B >= 10 }
	return null
}

function Chip({ name, p, colored, hot, still, visible }) {
	const cap = CAP_OF[name]
	return html`<div style=${{
			position: 'absolute', left: 0, top: 0, width: p.w, height: CHIP_H,
			transform: `translate(${p.x}px, ${p.y}px)`,
			transition: still ? 'none' : `transform ${SLOW}ms ${EASE}, width ${SLOW}ms ${EASE}, opacity 500ms ${EASE}, background 600ms ${EASE}`,
			opacity: visible ? 1 : 0,
			borderRadius: 8, border: `2px solid ${colored ? cap.color : '#8a847a'}`,
			background: hot ? C.red : colored ? cap.color + '22' : '#fffdf8',
			color: hot ? '#fff' : C.ink,
			fontFamily: F.mono, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', boxSizing: 'border-box',
			whiteSpace: 'nowrap', overflow: 'hidden', zIndex: hot ? 5 : 2,
			boxShadow: hot ? '0 8px 20px rgba(214,69,51,0.35)' : 'none',
		}}>
		<span style=${{ width: 10, height: 10, borderRadius: 5, flex: 'none', background: colored ? cap.color : '#b3a898' }} />${name}
	</div>`
}

// ------------------------------------------------------------------ inspector: per-step content
const T = (s, extra) => html`<div style=${{ fontFamily: F.sans, fontSize: 22, lineHeight: 1.35, color: C.ink, ...extra }}>${s}</div>`
const Small = (s, extra) => html`<div style=${{ fontFamily: F.sans, fontSize: 18, lineHeight: 1.35, color: C.dim, ...extra }}>${s}</div>`
const Stat = (n, label, color = C.ink) => html`<div style=${{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
	<span style=${{ fontFamily: F.sans, fontSize: 36, fontWeight: 700, color, minWidth: 92, textAlign: 'right' }}>${n}</span>
	<span style=${{ fontFamily: F.sans, fontSize: 20, color: C.ink }}>${label}</span></div>`
const Pill = (s, color = C.ink, fill = 'transparent') => html`<span style=${{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, border: `2px solid ${color}`, background: fill, color, fontFamily: F.sans, fontSize: 17, fontWeight: 600, marginRight: 8, marginBottom: 6 }}>${s}</span>`

// Right-hand column of the inspector for service-layout steps.
const RX = PANEL.x + 620, RW = 350

function Bar({ label, from, to, on, still, max = 100, color = C.fix }) {
	const v = on ? to : from
	return html`<div style=${{ marginBottom: 14 }}>
		<div style=${{ display: 'flex', justifyContent: 'space-between', fontFamily: F.sans, fontSize: 19 }}>
			<span>${label}</span><span style=${{ fontWeight: 700 }}>${from === to ? to.toFixed(1) : `${from.toFixed(1)} → ${to.toFixed(1)}`}</span></div>
		<div style=${{ height: 12, borderRadius: 6, background: C.paper2, overflow: 'hidden', marginTop: 4 }}>
			<div style=${{ height: '100%', width: `${(v / max) * 100}%`, background: color, transition: still ? 'none' : `width 900ms ${EASE} 500ms` }} /></div>
	</div>`
}

function Info({ B, still }) {
	const card = (children, extra) => html`<div style=${{ position: 'absolute', ...extra }}>${children}</div>`
	switch (B) {
		case 1:
			return card(html`
				${T('Every arm starts from the same three inputs, restricted to the benchmark\'s class inventory.')}
				<div style=${{ height: 12 }} />
				${Small('23 classes · 49 typed dependency edges · 1,339 lines of scoped source. Lines between chips are the real edges.')}`,
				{ left: PANEL.x + 24, top: PANEL.y + 10, width: 940 })
		case 2:
			return html`<div>
				${card(html`${T('One evidence pack for every later agent: observed facts from code, plus LLM hypotheses about the architecture.')}`, { left: PANEL.x + 24, top: PANEL.y + 10, width: 940 })}
				${card(html`
					<div style=${{ fontFamily: F.sans, fontSize: 20, fontWeight: 700, color: K.hybrid.stroke, marginBottom: 10 }}>Deterministic (observed)</div>
					${Stat(23, 'classes')}${Stat(49, 'typed edges: 21 uses · 15 calls · 8 extends · 5 creates')}`,
					{ left: PANEL.x + 24, top: PANEL.y + 480, width: 460 })}
				${card(html`
					<div style=${{ fontFamily: F.sans, fontSize: 20, fontWeight: 700, color: K.llm.stroke, marginBottom: 10 }}>LLM views (1 call · 15,949 tokens)</div>
					${Stat(6, 'components')}${Stat(17, 'API endpoints')}${Stat(6, 'persistence entities')}${Stat(7, 'interaction scenarios')}`,
					{ left: PANEL.x + 520, top: PANEL.y + 480, width: 450 })}
			</div>`
		case 3:
			return card(html`
				${T('Six business capabilities and a class-to-capability map, each class with a confidence (0.6–0.95).')}
				${Small('1 LLM call · 6,459 tokens. A hypothesis that guides the generator; never a ground truth.', { marginTop: 8 })}`,
				{ left: PANEL.x + 24, top: PANEL.y + 10, width: 940 })
		case 4:
			return html`<div>
				${card(html`${T('Three independent calls, same evidence, different instructions. Shown: dependency-first.')}`, { left: PANEL.x + 20, top: PANEL.y + 10, width: 960 })}
				${card(html`
					<div style=${{ fontFamily: F.sans, fontSize: 20, fontWeight: 700, marginBottom: 6 }}>domain-first</div>
					${Small('Owner (4) · Pet (5) · Visit (2) · Vet (5) · System (5) · DomainFoundation (2)')}
					<div style=${{ fontFamily: F.sans, fontSize: 20, fontWeight: 700, margin: '18px 0 6px' }}>balanced</div>
					${Small('the same six services as domain-first: the prompts converged', { color: C.red })}
					<div style=${{ height: 22 }} />
					${Small('3 calls · 11,710 tokens')}
					${Small('Repair: nothing to fix. Every one of the 23 classes appears exactly once in every candidate.', { marginTop: 8 })}`,
					{ left: RX, top: PANEL.y + 110, width: RW })}
			</div>`
		case 5: {
			const rows = [
				['dependency-first', '55.4', '100', '73.9', '73.4', true],
				['domain-first', '40.7', '93.3', '87.0', '69.0', false],
				['balanced', '40.7', '93.3', '87.0', '69.0', false],
			]
			return html`<div>
				${card(html`${T('All three pass the gate (complete, ≥ 3 services, named). A reference-free score picks one.')}`, { left: PANEL.x + 20, top: PANEL.y + 10, width: 960 })}
				${card(html`
					<table style=${{ fontFamily: F.sans, fontSize: 18, borderCollapse: 'collapse', width: '100%' }}>
						<thead><tr style=${{ color: C.dim }}><th style=${{ textAlign: 'left' }}></th><th>CMod</th><th>CiD</th><th>MF</th><th>score</th></tr></thead>
						<tbody>${rows.map(([n, a, b2, c, s, sel]) => html`<tr key=${n} style=${{ background: sel ? C.redGlow : 'transparent', fontWeight: sel ? 700 : 400 }}>
							<td style=${{ padding: '6px 4px' }}>${n}</td><td style=${{ textAlign: 'center' }}>${a}</td><td style=${{ textAlign: 'center' }}>${b2}</td><td style=${{ textAlign: 'center' }}>${c}</td><td style=${{ textAlign: 'center' }}>${s}</td></tr>`)}</tbody>
					</table>
					${Small('score = weighted CMod (.3), CiD (.2) and migration feasibility (.2)', { marginTop: 10 })}
					<div style=${{ marginTop: 18, padding: 12, border: `2px dashed ${C.red}`, borderRadius: 10 }}>
						${Small('Domain-first agrees 100 % with the capability map it was built from. That agreement is recorded, not scored: otherwise the score would reward a candidate for following its own recipe.', { color: C.ink })}
					</div>`,
					{ left: RX - 10, top: PANEL.y + 110, width: RW + 10 })}
			</div>`
		}
		case 6: case 7: case 8: {
			const m = MOVES[B - 6]
			const prev = B === 6 ? { cmod: 55.4, mf: 73.9 } : MOVES[B - 7]
			return html`<div>
				${card(html`${T(html`Move <b>${m.cls}</b>: ${m.from.replace('Service', '')} → ${m.to.replace('Service', '')}`)}`, { left: PANEL.x + 20, top: PANEL.y + 10, width: 960 })}
				${card(html`
					${Small('12 single-class moves evaluated; accepted only if nothing gets worse and something improves (strict Pareto).', { marginBottom: 16 })}
					<${Bar} label="CMod" from=${prev.cmod} to=${m.cmod} on=${true} still=${still} />
					<${Bar} label="CiD" from=${100} to=${100} on=${true} still=${still} />
					<${Bar} label="Migration feasibility" from=${prev.mf} to=${m.mf} on=${true} still=${still} />
					${Small('No LLM call. Deterministic and auditable.', { marginTop: 10 })}`,
					{ left: RX, top: PANEL.y + 110, width: RW })}
			</div>`
		}
		case 9:
			return html`<div>
				${card(html`${T('No admissible move is left, so the search stops (limit: 5 rounds).')}`, { left: PANEL.x + 20, top: PANEL.y + 10, width: 960 })}
				${card(html`
					${Small('Best rejected move:', { color: C.ink, fontWeight: 600 })}
					${Small('VisitController → DomainFoundation', { fontFamily: F.mono })}
					${Small('CMod 66.8 → 62.8 · CiD 100 → 83.3 ✗', { color: C.red, marginBottom: 18 })}
					<${Bar} label="CMod" from=${55.4} to=${66.8} on=${true} still=${true} />
					<${Bar} label="CiD" from=${100} to=${100} on=${true} still=${true} />
					<${Bar} label="Migration feasibility" from=${73.9} to=${76.5} on=${true} still=${true} />
					<div style=${{ marginTop: 14, padding: 12, border: `2px dashed ${C.amber}`, borderRadius: 10 }}>
						${Small('Structurally better, semantically questionable: Vet and Visit now sit with the shared base classes, because inheritance couples them strongly.', { color: C.ink })}
					</div>`,
					{ left: RX, top: PANEL.y + 110, width: RW })}
			</div>`
		case 10:
			return html`<div>
				${card(html`${T('The controller freezes the result and writes a manifest with content hashes.')}`, { left: PANEL.x + 20, top: PANEL.y + 10, width: 960 })}
				${card(html`
					${Stat('4', 'services')}${Stat('23/23', 'classes, each exactly once', C.fix)}${Stat('5', 'LLM calls in total')}${Stat('34.1k', 'tokens (15.9k + 6.5k + 11.7k)')}
					${Small('Up to here, no component could read the reference or any metric derived from it.', { marginTop: 8, color: C.ink })}`,
					{ left: RX, top: PANEL.y + 110, width: RW })}
			</div>`
		case 11: {
			const rows = [
				['OwnerPetVisit', 'customers', 64, true, true, true],
				['Vet', 'vets', 30, true, false, false],
				['SystemInfrastructure', 'unassigned group', 60, true, true, true],
				['DomainFoundation', 'visits', 67, true, true, true],
			]
			const tick = (ok) => html`<span style=${{ color: ok ? C.fix : C.red, fontWeight: 700 }}>${ok ? '✓' : '✗'}</span>`
			return html`<div>
				${card(html`${T('The reference appears only now. Each produced service is matched to the reference service it overlaps most.')}`, { left: PANEL.x + 20, top: PANEL.y + 10, width: 960 })}
				${card(html`
					<table style=${{ fontFamily: F.sans, fontSize: 17, borderCollapse: 'collapse', width: '100%' }}>
						<thead><tr style=${{ color: C.dim }}><th style=${{ textAlign: 'left' }}>best match</th><th>overlap</th><th>10</th><th>33</th><th>50</th></tr></thead>
						<tbody>${rows.map(([p, r, o, a, b2, c]) => html`<tr key=${p}>
							<td style=${{ padding: '5px 2px' }}><div style=${{ fontWeight: 600 }}>${p}</div><div style=${{ color: C.dim, fontSize: 15 }}>→ ${r}</div></td>
							<td style=${{ textAlign: 'center' }}>${o}%</td><td style=${{ textAlign: 'center' }}>${tick(a)}</td><td style=${{ textAlign: 'center' }}>${tick(b2)}</td><td style=${{ textAlign: 'center' }}>${tick(c)}</td></tr>`)}</tbody>
					</table>
					<div style=${{ marginTop: 14 }}>${Pill('C2C-10 100', C.fix)}${Pill('C2C-33 75', C.fix)}${Pill('C2C-50 75', C.fix)}</div>
					<div>${Pill('CMod 66.8')}${Pill('CiD 100')}${Pill('DTP 83.9')}</div>`,
					{ left: RX - 20, top: PANEL.y + 110, width: RW + 20 })}
			</div>`
		}
		default:
			return null
	}
}

// Box outlines behind the chips (capabilities or services).
function Boxes({ boxes, still, locked }) {
	return html`<div>${boxes.map((g) => html`<div key=${g.name} style=${{
			position: 'absolute', left: 0, top: 0, width: g.w, height: g.h,
			transform: `translate(${g.x}px, ${g.y}px)`,
			transition: still ? 'none' : `transform ${SLOW}ms ${EASE}, height ${SLOW}ms ${EASE}`,
			borderRadius: 12, border: `2.5px ${locked ? 'solid' : 'dashed'} ${g.color ?? C.ink}`,
			background: g.color ? g.color + '0d' : 'rgba(255,255,255,0.55)',
		}}>
		<div style=${{ position: 'absolute', left: 12, top: 8, fontFamily: F.sans, fontSize: 16, fontWeight: 700, color: g.color ?? C.ink, whiteSpace: 'nowrap' }}>${locked ? '🔒 ' : ''}${g.name}</div>
	</div>`)}</div>`
}

function EdgeLines({ pos, on, still }) {
	const c = (k) => [pos[k].x + pos[k].w / 2, pos[k].y + CHIP_H / 2]
	return html`<svg width="1920" height="1080" style=${{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', opacity: on ? 1 : 0, transition: still ? 'none' : `opacity 700ms ${EASE} 300ms` }}>
		${EDGES.map(([s, t], i) => {
			const [x1, y1] = c(s), [x2, y2] = c(t)
			return html`<line key=${i} x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke=${C.ink} strokeOpacity="0.18" strokeWidth="2" />`
		})}
	</svg>`
}

// ------------------------------------------------------------------ the scene
export function AgenticTrace({ b, still, frozen }) {
	const B = still ? AGENTIC_BEATS : Math.max(0, Math.min(AGENTIC_BEATS, b))
	const step = STEPS[B]
	const panelOpen = step.cam !== 'all'
	const focus = new Set(step.focus)
	const chips = chipsFor(B)
	const summary = !!step.summary
	const badges = summary ? { ev: '1 call · 15.9k tokens', dom: '1 call · 6.5k', gen: '3 calls · 11.7k', evl: '0 LLM calls', ref: '3 moves · 0 LLM calls', bl: 'C2C 100 / 75 / 75' } : {}

	return html`<div style=${{ position: 'absolute', inset: 0 }}>
		<div style=${{ ...box(60, 40, 1800, 110) }}>
			<div style=${{ fontFamily: F.sans, fontSize: 22, color: C.dim, letterSpacing: 0.5 }}>Agentic workflow · live trace · Spring PetClinic · DeepSeek v4.1 Flash</div>
			<div key=${B} style=${{ fontFamily: F.hand, fontSize: 50, color: C.ink, marginTop: 4, animation: still ? 'none' : `aw-in 500ms ${EASE} both` }}>${step.title}</div>
		</div>
		<div style=${{ ...box(1560, 52, 300, 30), display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
			${STEPS.map((_, i) => html`<div key=${i} style=${{ width: i === B ? 26 : 11, height: 11, borderRadius: 6, background: i <= B ? C.red : C.faint, transition: still ? 'none' : `all 400ms ${EASE}` }} />`)}
		</div>

		<div style=${{ ...box(0, 0, 1920, 1080), overflow: 'hidden', clipPath: panelOpen ? 'inset(150px 1030px 0 0)' : summary ? 'inset(150px 470px 0 0)' : 'inset(0 0 0 0)', transition: still ? 'none' : `clip-path ${SLOW}ms ${EASE}` }}>
			<div style=${{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1180, transformOrigin: '0 0', transform: camera(step), transition: still ? 'none' : `transform ${SLOW}ms ${EASE}` }}>
				<${Controller} dim=${panelOpen && !['ev', 'dom', 'gen', 'evl', 'ref'].some((k) => focus.has(k))} still=${still} />
				<${Arrows} step=${step} frozen=${frozen} still=${still} />
				<${Labels} />
				${Object.entries(N).map(([id, n]) => html`<${Node} key=${id} id=${id} n=${n} still=${still}
					dim=${panelOpen && !focus.has(id)} hot=${focus.has(id)} badge=${badges[id]} />`)}
				<${Legend} />
			</div>
		</div>

		<div style=${{ ...box(PANEL.x - 12, PANEL.y - 14, PANEL.w + 12, PANEL.h + 14), borderRadius: 22, background: '#fffdf8', border: `2px solid ${C.line}`, boxShadow: '0 30px 60px rgba(60,40,20,0.12)',
			opacity: panelOpen ? 1 : 0, transform: panelOpen ? 'none' : 'translateX(60px)', transition: still ? 'none' : `opacity 600ms ${EASE}, transform 700ms ${EASE}` }} />
		${panelOpen && html`<div key=${'info' + B} style=${{ position: 'absolute', inset: 0, animation: still ? 'none' : `aw-in 600ms ${EASE} 350ms both` }}><${Info} B=${B} still=${still} /></div>`}
		${chips && html`<${Boxes} boxes=${chips.boxes.map((g) => ({ ...g, color: g.color }))} still=${still} locked=${chips.locked} />`}
		${chips && B <= 2 && html`<${EdgeLines} pos=${chips.pos} on=${true} still=${still} />`}
		${CLASSES.map((c) => html`<${Chip} key=${c} name=${c} still=${still}
			p=${chips ? chips.pos[c] : { x: 1400, y: 600, w: 222 }} visible=${!!chips}
			colored=${chips?.colored} hot=${chips?.moved === c} />`)}

		${summary && html`<div style=${{ ...box(1450, 170, 430, 300), fontFamily: F.sans, fontSize: 21, lineHeight: 1.45, color: C.ink, background: 'rgba(255,253,248,0.94)', border: `2px solid ${C.line}`, borderRadius: 18, padding: 20, animation: still ? 'none' : `aw-in 700ms ${EASE} 600ms both` }}>
			<div style=${{ fontWeight: 700, marginBottom: 6 }}>What the trace shows</div>
			<div>• LLMs interpret and propose (5 calls).</div>
			<div>• Code checks, scores, and improves.</div>
			<div>• Valid by construction: 23/23 classes.</div>
			<div>• The reference is used only after freezing.</div>
		</div>`}

		<style>${`@keyframes aw-in { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }`}</style>
	</div>`
}
