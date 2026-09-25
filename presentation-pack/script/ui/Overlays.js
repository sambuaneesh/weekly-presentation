// Speaker notes drawer, the presenting overlay, and "+" insert buttons between slides on canvas.
import { useEditor, useValue } from 'tldraw'
import { h, css, guard, Button } from './kit.js'
import { notesOpen, presentIndex, panelOpen, PANEL_W, annotateMode } from './state.js'
import { clearAnnotations } from './presentTool.js'
import { goTo } from './SlidePanel.js'
import { getSlides, getCurrentIndex, insertSlide } from '../lib/slides.js'
import { SLIDE_GAP } from '../lib/deck.js'

export function NotesPanel() {
	const editor = useEditor()
	const open = useValue(notesOpen)
	const presenting = useValue(presentIndex) >= 0
	const panel = useValue(panelOpen)
	const slide = useValue('notesSlide', () => getSlides(editor)[getCurrentIndex(editor)] ?? null, [editor])
	if (!open || presenting) return null
	const index = getSlides(editor).findIndex((s) => s.id === slide?.id)
	return h('div', {
			...guard(editor),
			style: {
				...css.panel, position: 'absolute', left: panel ? PANEL_W + 20 : 8, right: 8, bottom: 110, height: 160,
				display: 'flex', flexDirection: 'column', padding: 8, gap: 6, zIndex: 300,
			},
		},
		h('div', { style: { display: 'flex', alignItems: 'center' } },
			h('b', { style: { flex: 1 } }, 'Speaker notes', h('span', { style: { ...css.muted, fontWeight: 400 } }, slide ? ` — slide ${index + 1}` : '')),
			h(Button, { label: '×', title: 'Close notes', onClick: () => notesOpen.set(false) })),
		slide
			? h('textarea', {
					key: slide.id,
					defaultValue: slide.meta?.notes ?? '',
					placeholder: 'What to say on this slide…',
					onChange: (e) => {
						const notes = e.target.value
						editor.run(
							() => editor.updateShape({ id: slide.id, type: 'frame', meta: { ...editor.getShape(slide.id)?.meta, notes } }),
							{ history: 'ignore' }
						)
					},
					style: { ...css.input, flex: 1, resize: 'none', lineHeight: 1.4 },
				})
			: h('div', { style: css.muted }, 'No slide selected.'))
}

// While presenting: black letterbox around the slide, a progress bar, and a counter with exit.
export function PresentOverlay() {
	const editor = useEditor()
	const index = useValue(presentIndex)
	const rect = useValue('presentRect', () => {
		const i = presentIndex.get()
		const slide = i >= 0 ? getSlides(editor)[i] : null
		const b = slide && editor.getShapePageBounds(slide.id)
		if (!b) return null
		const tl = editor.pageToViewport({ x: b.x, y: b.y })
		const br = editor.pageToViewport({ x: b.maxX, y: b.maxY })
		return { l: tl.x, t: tl.y, r: br.x, b: br.y }
	}, [editor])
	const count = useValue('slideCount', () => getSlides(editor).length, [editor])
	const mode = useValue(annotateMode)
	const follower = useValue('isFollower', () => editor.getCurrentToolId() === 'present' && !!editor.getCurrentTool().follower, [editor])
	if (index < 0) return null

	const mark = (m) => ({ background: mode === m ? 'rgba(255,255,255,0.25)' : 'transparent' })
	const black = (key, style) => h('div', { key, style: { position: 'absolute', background: '#000', pointerEvents: 'none', ...style } })
	return h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 900 } },
		rect && [
			black('t', { left: 0, right: 0, top: 0, height: Math.max(0, rect.t) }),
			black('b', { left: 0, right: 0, top: rect.b, bottom: 0 }),
			black('l', { left: 0, width: Math.max(0, rect.l), top: 0, bottom: 0 }),
			black('r', { left: rect.r, right: 0, top: 0, bottom: 0 }),
		],
		h('div', { style: { position: 'absolute', left: 0, bottom: 0, height: 4, width: `${count > 1 ? (index / (count - 1)) * 100 : 100}%`, background: 'var(--tl-color-selected)', opacity: 0.8 } }),
		h('div', {
				...guard(editor),
				style: {
					position: 'absolute', right: 14, bottom: 12, display: 'flex', gap: 4, alignItems: 'center', padding: '2px 4px 2px 10px',
					borderRadius: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, opacity: 0.55, pointerEvents: 'all',
				},
				onMouseEnter: (e) => (e.currentTarget.style.opacity = 1),
				onMouseLeave: (e) => (e.currentTarget.style.opacity = 0.55),
			},
			h(Button, { label: 'Laser', title: 'Drag to point (everyone in a live room sees it)', style: mark('laser'), onClick: () => annotateMode.set('laser') }),
			h(Button, { label: 'Highlight', title: 'Drag to highlight on the slide', style: mark('highlight'), onClick: () => annotateMode.set('highlight') }),
			h(Button, { label: 'Clear', title: 'Remove highlights from this slide', onClick: () => clearAnnotations(editor) }),
			h('div', { style: { width: 1, alignSelf: 'stretch', margin: '4px 2px', background: 'rgba(255,255,255,0.3)' } }),
			follower
				? h('span', { style: { padding: '0 6px', whiteSpace: 'nowrap' } }, `Following presenter · ${index + 1} / ${count}`)
				: [
						h(Button, { key: 'p', label: '‹', title: 'Previous (←)', onClick: () => editor.getCurrentTool().go?.(index - 1) }),
						h('span', { key: 'n', style: { fontVariantNumeric: 'tabular-nums', padding: '0 4px' } }, `${index + 1} / ${count}`),
						h(Button, { key: 'x', label: '›', title: 'Next (→ / Space / click)', onClick: () => editor.getCurrentTool().go?.(index + 1) }),
					],
			h(Button, { label: '✕', title: follower ? 'Stop following (Esc)' : 'Exit presentation (Esc)', onClick: () => editor.setCurrentTool('select') })))
}

// "+" buttons in page space: before the first slide, between slides, and after the last.
export function InsertButtons() {
	const editor = useEditor()
	const presenting = useValue(presentIndex) >= 0
	const slides = useValue('slides', () => getSlides(editor), [editor])
	const zoom = useValue('zoom', () => editor.getZoomLevel(), [editor])
	if (presenting || !slides.length || zoom < 0.04) return null
	const size = 34 / zoom
	const spots = slides.map((s, i) => ({ index: i, x: s.x - SLIDE_GAP / 2, y: s.y + s.props.h / 2 }))
	const last = slides[slides.length - 1]
	spots.push({ index: slides.length, x: last.x + last.props.w + SLIDE_GAP / 2, y: last.y + last.props.h / 2 })
	return spots.map((p) =>
		h('button', {
				key: 'ins' + p.index,
				title: 'Insert a slide here',
				onPointerDown: (e) => {
					editor.markEventAsHandled(e)
					e.stopPropagation()
				},
				onClick: () => goTo(editor, insertSlide(editor, p.index, 'content')),
				style: {
					position: 'absolute', left: p.x - size / 2, top: p.y - size / 2, width: size, height: size,
					borderRadius: '50%', border: `${1.5 / zoom}px solid var(--tl-color-divider)`, background: 'var(--tl-color-panel)',
					color: 'var(--tl-color-text-3)', fontSize: 20 / zoom, lineHeight: 1, cursor: 'pointer', pointerEvents: 'all',
					opacity: 0.7, padding: 0,
				},
			},
			'+'))
}
