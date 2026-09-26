// Built-in slide layouts. Each layout returns the shapes to put inside a 1920×1080 slide frame,
// in frame-local coordinates. Every shape is tagged with meta.role so themes can restyle it and
// the deck sync can fill in footers and slide numbers.
import { createShapeId } from 'tldraw'
import { SLIDE_W as W, SLIDE_H as H, MARGIN as M } from './deck.js'
import { roleProps } from './themes.js'

// ---------- rich text ----------

const para = (text, marks) => ({
	type: 'paragraph',
	content: text ? [{ type: 'text', text, ...(marks && { marks }) }] : [],
})

export function rt(text) {
	return { type: 'doc', content: String(text).split('\n').map((line) => para(line)) }
}

export function bullets(items, heading) {
	const content = []
	if (heading) content.push(para(heading, [{ type: 'bold' }]))
	content.push({
		type: 'bulletList',
		content: items.map((item) => ({ type: 'listItem', content: [para(item)] })),
	})
	return { type: 'doc', content }
}

// ---------- shape builders ----------

function text(role, content, x, y, w, { size = 'm', scale = 1, align = 'start' } = {}) {
	return {
		type: 'text',
		x,
		y,
		props: {
			richText: typeof content === 'string' ? rt(content) : content,
			size,
			scale,
			autoSize: false,
			w: w / scale,
			textAlign: align,
		},
		meta: { role },
	}
}

function geo(role, x, y, w, h, { shape = 'rectangle', label, align = 'middle', vAlign = 'middle', size = 's', scale = 1, locked = false, tone } = {}) {
	return {
		type: 'geo',
		x,
		y,
		isLocked: locked,
		props: {
			geo: shape,
			// Unlike text, a geo's w/h are not multiplied by scale (scale only affects stroke and label).
			w,
			h,
			size,
			scale,
			align,
			verticalAlign: vAlign,
			...(label !== undefined && { richText: typeof label === 'string' ? rt(label) : label }),
		},
		meta: { role, ...(tone && { tone }) },
	}
}

// Pieces shared by most layouts.
const bg = () => geo('bg', 0, 0, W, H, { locked: true })
const chrome = () => [
	text('footer', '', M, H - 76, 1100, { size: 's', scale: 1.3 }),
	text('number', '', W - M - 240, H - 76, 240, { size: 's', scale: 1.3, align: 'end' }),
]
const heading = (o, fallback) => [
	text('title', o.title ?? fallback, M, 84, W - 2 * M, { size: 'xl', scale: 1.8 }),
	geo('accent', M, 214, 120, 10),
]
const BODY = { size: 'm', scale: 1.7 }

// ---------- layouts ----------

export const LAYOUTS = {
	title: {
		name: 'Title',
		build: (o) => [
			bg(),
			geo('accent', M, 372, 140, 14),
			text('title', o.title ?? 'Presentation title', M, 410, W - 2 * M, { size: 'xl', scale: 2.6 }),
			text('subtitle', o.subtitle ?? 'Subtitle · Presenter · Date', M, 620, W - 2 * M, { size: 'l', scale: 1.3 }),
		],
	},
	agenda: {
		name: 'Agenda',
		build: (o) => {
			const items = o.items ?? ['First topic', 'Second topic', 'Third topic', 'Fourth topic']
			return [
				bg(),
				...heading(o, 'Agenda'),
				...items.flatMap((item, i) => [
					text('kicker', String(i + 1).padStart(2, '0'), M, 290 + i * 150, 120, { size: 'l', scale: 1.4 }),
					text('body', item, M + 150, 296 + i * 150, W - 2 * M - 150, BODY),
				]),
				...chrome(),
			]
		},
	},
	section: {
		name: 'Section',
		build: (o) => [
			bg(),
			text('kicker', o.kicker ?? 'SECTION 01', M, 380, 800, { size: 'm', scale: 1.4 }),
			text('title', o.title ?? 'Section title', M, 440, W - 2 * M, { size: 'xl', scale: 2.6 }),
			geo('accent', M, 660, 260, 14),
			...chrome(),
		],
	},
	content: {
		name: 'Content',
		hint: 'title + bullets',
		build: (o) => [
			bg(),
			...heading(o, 'Slide title'),
			text('body', bullets(o.bullets ?? ['First point', 'Second point', 'Third point']), M, 280, W - 2 * M, BODY),
			...chrome(),
		],
	},
	'two-column': {
		name: 'Two columns',
		build: (o) => {
			const colW = (W - 2 * M - 100) / 2
			const x2 = M + colW + 100
			return [
				bg(),
				...heading(o, 'Comparison'),
				text('subtitle', o.left ?? 'Left heading', M, 280, colW, { size: 'l', scale: 1.3 }),
				text('body', bullets(o.leftBullets ?? ['Point', 'Point', 'Point']), M, 370, colW, BODY),
				text('subtitle', o.right ?? 'Right heading', x2, 280, colW, { size: 'l', scale: 1.3 }),
				text('body', bullets(o.rightBullets ?? ['Point', 'Point', 'Point']), x2, 370, colW, BODY),
				...chrome(),
			]
		},
	},
	'image-text': {
		name: 'Image + text',
		build: (o) => [
			bg(),
			...heading(o, 'Visual'),
			geo('placeholder', M, 280, 860, 640, { label: 'Paste or drop an image here', size: 'm', scale: 1.4 }),
			text('body', bullets(o.bullets ?? ['What to notice', 'Why it matters', 'What changed']), M + 940, 300, W - 2 * M - 940, BODY),
			...chrome(),
		],
	},
	'big-number': {
		name: 'Big number',
		build: (o) => [
			bg(),
			text('kicker', o.kicker ?? 'KEY METRIC', M, 220, 1200, { size: 'm', scale: 1.4 }),
			text('bignum', o.value ?? '42%', M, 270, W - 2 * M, { size: 'xl', scale: 6 }),
			text('subtitle', o.caption ?? 'What this number means and why it matters', M, 730, 1500, { size: 'l', scale: 1.3 }),
			...chrome(),
		],
	},
	quote: {
		name: 'Quote',
		build: (o) => [
			bg(),
			geo('accent', M, 300, 14, 360),
			text('quote', o.quote ?? '“A memorable quote that frames the point you are making.”', M + 80, 300, W - 2 * M - 200, { size: 'xl', scale: 1.8 }),
			text('subtitle', o.by ?? '— Name, Role', M + 80, 720, 1200, { size: 'l', scale: 1.2 }),
			...chrome(),
		],
	},
	status: {
		name: 'Status',
		hint: 'done / doing / blocked',
		build: (o) => {
			const cols = o.columns ?? [
				{ heading: 'Done', tone: 'good', items: ['Shipped item', 'Shipped item'] },
				{ heading: 'In progress', tone: 'info', items: ['Ongoing item', 'Ongoing item'] },
				{ heading: 'Blocked / risks', tone: 'bad', items: ['Blocker and who can help'] },
			]
			const gap = 60
			const cw = (W - 2 * M - gap * (cols.length - 1)) / cols.length
			return [
				bg(),
				...heading(o, 'Status this week'),
				...cols.map((c, i) =>
					geo('card', M + i * (cw + gap), 280, cw, 640, {
						label: bullets(c.items, c.heading),
						align: 'start',
						vAlign: 'start',
						size: 'l',
						scale: 1.1,
						tone: c.tone,
					})
				),
				...chrome(),
			]
		},
	},
	metrics: {
		name: 'Metrics',
		hint: '3 KPI cards',
		build: (o) => {
			const kpis = o.kpis ?? [
				{ value: '128', label: 'Metric name', delta: '▲ 12% vs last week' },
				{ value: '3.4s', label: 'Metric name', delta: '▼ 0.6s vs last week' },
				{ value: '97%', label: 'Metric name', delta: '— flat' },
			]
			const gap = 60
			const cw = (W - 2 * M - gap * (kpis.length - 1)) / kpis.length
			return [
				bg(),
				...heading(o, 'Key metrics'),
				...kpis.flatMap((k, i) => {
					const x = M + i * (cw + gap)
					return [
						geo('card', x, 300, cw, 520, { tone: k.tone }),
						text('cardtext', k.label, x + 50, 350, cw - 100, { size: 'm', scale: 1.5 }),
						text('cardnum', k.value, x + 50, 440, cw - 100, { size: 'xl', scale: 3.2 }),
						text('cardtext', k.delta, x + 50, 700, cw - 100, { size: 'm', scale: 1.3 }),
					]
				}),
				...chrome(),
			]
		},
	},
	timeline: {
		name: 'Timeline',
		build: (o) => {
			const steps = o.steps ?? [
				{ when: 'Mon', what: 'Milestone' },
				{ when: 'Wed', what: 'Milestone' },
				{ when: 'Fri', what: 'Milestone' },
				{ when: 'Next week', what: 'Milestone' },
			]
			const x0 = M + 120
			const span = W - 2 * M - 240
			const step = steps.length > 1 ? span / (steps.length - 1) : 0
			return [
				bg(),
				...heading(o, 'Timeline'),
				geo('accent', M, 577, W - 2 * M, 6),
				...steps.flatMap((s, i) => {
					const cx = x0 + i * step
					return [
						geo('dot', cx - 24, 556, 48, 48, { shape: 'ellipse' }),
						text('kicker', s.when, cx - 150, 460, 300, { size: 'm', scale: 1.4, align: 'middle' }),
						text('body', s.what, cx - 170, 640, 340, { size: 'm', scale: 1.5, align: 'middle' }),
					]
				}),
				...chrome(),
			]
		},
	},
	closing: {
		name: 'Closing',
		build: (o) => [
			bg(),
			text('title', o.title ?? 'Thank you', M, 400, W - 2 * M, { size: 'xl', scale: 2.8, align: 'middle' }),
			text('subtitle', o.subtitle ?? 'Questions?', M, 620, W - 2 * M, { size: 'l', scale: 1.4, align: 'middle' }),
		],
	},
	blank: {
		name: 'Blank',
		build: () => [bg(), ...chrome()],
	},
	// An animated scene (scenes/registry.js) under an editable kicker and title. `o.head` moves the
	// heading block: [x, y, width, title scale].
	scene: {
		name: 'Scene',
		hidden: true, // made by templates; not offered in the layout picker
		build: (o) => {
			const [hx, hy, hw, hs] = o.head ?? [M, 58, W - 2 * M, 1.45]
			return [
				bg(),
				...(o.scene === null ? [] : [{ type: 'scene', x: 0, y: 0, isLocked: true, props: { w: W, h: H, scene: o.scene ?? 'title' }, meta: { role: 'scene' } }]),
				// Real, live shapes on top of the scene (interactive slides): frame-local partials.
				...(o.extra ?? []).map((e) => ({ ...e, meta: { role: 'interactive', ...(e.meta ?? {}) } })),
				...(o.kicker ? [text('kicker', o.kicker, hx, hy, hw, { size: 's', scale: 1.25 })] : []),
				...(o.title ? [text('title', o.title, hx, hy + 38, hw, { size: 'xl', scale: hs })] : []),
				...(o.subtitle ? [text('subtitle', o.subtitle, hx, hy + 38 + 70 * hs, hw, { size: 'm', scale: 1.25 })] : []),
				...chrome(),
			]
		},
	},
}

// Shapes for one slide: a frame at (x, y) plus the layout's children, styled with theme `t`.
export function buildSlide(layoutId, { x, y, name, overrides = {}, theme }) {
	const layout = LAYOUTS[layoutId] ?? LAYOUTS.content
	const frameId = createShapeId()
	const children = layout.build(overrides).map((s) => {
		const style = roleProps(s.meta.role, theme, s) ?? {}
		// Text shapes have no fill/dash/labelColor props; only keep what the type accepts.
		const allowed = s.type === 'text' ? ['color', 'font'] : Object.keys(style)
		const props = { ...s.props }
		for (const k of allowed) if (k in style) props[k] = style[k]
		return { ...s, id: createShapeId(), parentId: frameId, props }
	})
	return {
		frameId,
		shapes: [
			{
				id: frameId,
				type: 'frame',
				x,
				y,
				props: { w: W, h: H, name: name ?? `00 · ${overrides.name ?? layout.name}` },
				meta: { layout: layoutId, notes: overrides.notes ?? '' },
			},
			...children,
		],
	}
}
