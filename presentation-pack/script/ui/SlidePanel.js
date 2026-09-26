// PowerPoint-style slide sorter: live thumbnails, click to go, drag to reorder, right-click (or ⋯)
// for slide actions, and a "New slide" button with a layout picker.
import { useState, useEffect } from 'react'
import { useEditor, useValue } from 'tldraw'
import { h, css, guard, Button, MenuItem, Popover } from './kit.js'
import { useThumbnail } from './thumbnails.js'
import { panelOpen, openMenu, contextMenu, presentIndex, fitSlide, PANEL_W } from './state.js'
import {
	getSlides, getCurrentIndex, insertSlide, insertFromContent, duplicateSlide, deleteSlide,
	moveSlide, saveAsLayout, deleteCustomLayout, seedTemplate, LAYOUTS, TEMPLATES,
} from '../lib/slides.js'
import { getDeck } from '../lib/deck.js'

export function goTo(editor, id) {
	editor.select(id)
	fitSlide(editor, id)
}

// Layouts shipped with the pack (layouts/custom/*.json, exported from decks with bin/pull.mjs).
// Re-read each time the picker opens, so a reinstall that adds layouts shows up without a reload.
function usePackLayouts(open) {
	const [list, setList] = useState([])
	useEffect(() => {
		if (!open) return
		let cancelled = false
		const url = (file) => new URL(`../layouts/custom/${file}`, import.meta.url)
		fetch(url('index.json'))
			.then((r) => (r.ok ? r.json() : []))
			.then((index) => Promise.all(index.map((entry) => fetch(url(entry.file)).then((r) => r.json()))))
			.catch(() => [])
			.then((layouts) => !cancelled && setList(layouts))
		return () => {
			cancelled = true
		}
	}, [open])
	return list
}

function Thumb({ editor, slide, index, current, onDragStart, onDrop, dropHint }) {
	const url = useThumbnail(editor, slide.id)
	const [hover, setHover] = useState(false)
	const isCurrent = index === current
	return h(
		'div',
		{
			draggable: true,
			onDragStart: (e) => {
				e.dataTransfer.effectAllowed = 'move'
				e.dataTransfer.setData('text/plain', String(index))
				onDragStart(index)
			},
			onDragOver: (e) => {
				e.preventDefault()
				const r = e.currentTarget.getBoundingClientRect()
				onDrop(index, e.clientY > r.top + r.height / 2 ? 'after' : 'before', false)
			},
			onDrop: (e) => {
				e.preventDefault()
				const r = e.currentTarget.getBoundingClientRect()
				onDrop(index, e.clientY > r.top + r.height / 2 ? 'after' : 'before', true)
			},
			onClick: () => goTo(editor, slide.id),
			onDoubleClick: () => editor.setCurrentTool('present', { startIndex: index }),
			onContextMenu: (e) => {
				e.preventDefault()
				contextMenu.set({ index, x: e.clientX, y: e.clientY })
			},
			onMouseEnter: () => setHover(true),
			onMouseLeave: () => setHover(false),
			style: {
				position: 'relative',
				display: 'flex',
				gap: 6,
				padding: '4px 6px 4px 2px',
				borderTop: dropHint === 'before' ? '2px solid var(--tl-color-selected)' : '2px solid transparent',
				borderBottom: dropHint === 'after' ? '2px solid var(--tl-color-selected)' : '2px solid transparent',
				cursor: 'pointer',
			},
		},
		h('div', { style: { width: 18, textAlign: 'right', paddingTop: 2, fontSize: 11, ...(isCurrent ? { fontWeight: 700 } : css.muted) } }, index + 1),
		h(
			'div',
			{
				style: {
					flex: 1,
					aspectRatio: `${slide.props.w} / ${slide.props.h}`,
					borderRadius: 4,
					overflow: 'hidden',
					background: 'var(--tl-color-background)',
					outline: isCurrent ? '2px solid var(--tl-color-selected)' : '1px solid var(--tl-color-divider)',
					outlineOffset: isCurrent ? 0 : -1,
				},
			},
			url && h('img', { src: url, draggable: false, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } })
		),
		hover &&
			h(
				'button',
				{
					title: 'Slide actions',
					onClick: (e) => {
						e.stopPropagation()
						const r = e.currentTarget.getBoundingClientRect()
						contextMenu.set({ index, x: r.right, y: r.bottom })
					},
					style: {
						position: 'absolute', right: 10, top: 8, width: 24, height: 20, border: 'none', borderRadius: 4,
						background: 'var(--tl-color-panel)', boxShadow: 'var(--tl-shadow-1)', color: 'inherit', cursor: 'pointer', lineHeight: '14px',
					},
				},
				'⋯'
			),
		slide.meta?.notes ? h('div', { title: 'Has speaker notes', style: { position: 'absolute', left: 8, bottom: 6, fontSize: 10, ...css.muted } }, '✎') : null
	)
}

function SlideContextMenu({ editor, count }) {
	const menu = useValue(contextMenu)
	const [naming, setNaming] = useState(false)
	const [name, setName] = useState('')
	useEffect(() => setNaming(false), [menu])
	if (!menu) return null
	const { index } = menu
	const close = () => contextMenu.set(null)
	const act = (fn) => () => {
		fn()
		close()
	}
	const focus = (id) => id && goTo(editor, id)
	const x = Math.min(menu.x, window.innerWidth - 230)
	const y = Math.min(menu.y, window.innerHeight - 330)
	return h(
		'div',
		{ ...guard(editor), onClick: close, style: { position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'all' } },
		h(
			Popover,
			{ editor, style: { position: 'fixed', left: x, top: y, width: 220 } },
			h('div', { onClick: (e) => e.stopPropagation() },
				naming
					? h('form', {
							style: { padding: 6, display: 'flex', flexDirection: 'column', gap: 6 },
							onSubmit: (e) => {
								e.preventDefault()
								if (name.trim()) saveAsLayout(editor, index, name.trim())
								close()
							},
						},
						h('div', { style: css.muted }, 'Save slide as a reusable layout'),
						h('input', { autoFocus: true, value: name, placeholder: 'Layout name', onChange: (e) => setName(e.target.value), style: css.input }),
						h(Button, { label: 'Save layout', primary: true, onClick: () => {} }))
					: [
							h(MenuItem, { key: 'n', label: 'New slide after', onClick: act(() => focus(insertSlide(editor, index + 1, 'content'))) }),
							h(MenuItem, { key: 'd', label: 'Duplicate', onClick: act(() => focus(duplicateSlide(editor, index))) }),
							h('div', { key: 's1', style: css.hsep }),
							h(MenuItem, { key: 'u', label: 'Move up', disabled: index === 0, onClick: act(() => moveSlide(editor, index, index - 1)) }),
							h(MenuItem, { key: 'w', label: 'Move down', disabled: index >= count - 1, onClick: act(() => moveSlide(editor, index, index + 1)) }),
							h('div', { key: 's2', style: css.hsep }),
							h(MenuItem, { key: 'p', label: 'Present from here', onClick: act(() => editor.setCurrentTool('present', { startIndex: index })) }),
							h(MenuItem, { key: 'l', label: 'Save as layout…', onClick: () => { setName(getSlides(editor)[index]?.props.name?.replace(/^\d+\s·\s/, '') ?? ''); setNaming(true) } }),
							h('div', { key: 's3', style: css.hsep }),
							h(MenuItem, { key: 'x', label: 'Delete slide', danger: true, onClick: act(() => deleteSlide(editor, index)) }),
						]
			)
		)
	)
}

function LayoutPicker({ editor, anchorBottom }) {
	const open = useValue('layoutsOpen', () => openMenu.get() === 'layouts', [])
	const saved = useValue('customLayouts', () => getDeck(editor).customLayouts, [editor])
	const pack = usePackLayouts(open)
	if (!open) return null
	const at = () => getCurrentIndex(editor) + 1
	const pick = (fn) => () => {
		const id = fn()
		openMenu.set(null)
		if (id) goTo(editor, id)
	}
	const section = (title) => h('div', { style: { ...css.muted, fontSize: 11, padding: '6px 10px 2px' } }, title)
	return h(
		Popover,
		{ editor, style: { left: PANEL_W + 8, bottom: anchorBottom, width: 250, maxHeight: '70vh', overflowY: 'auto' } },
		section('Layouts'),
		...Object.entries(LAYOUTS).filter(([, l]) => !l.hidden).map(([id, l]) => h(MenuItem, { key: id, label: l.name, hint: l.hint, onClick: pick(() => insertSlide(editor, at(), id)) })),
		saved.length > 0 && section('Saved in this deck'),
		...saved.map((l) => h('div', { key: l.id, style: { display: 'flex' } },
			h('div', { style: { flex: 1 } }, h(MenuItem, { label: l.name, onClick: pick(() => insertFromContent(editor, at(), l.content)) })),
			h(Button, { label: '×', title: 'Remove this saved layout', onClick: () => deleteCustomLayout(editor, l.id) }))),
		pack.length > 0 && section('Pack layouts'),
		...pack.map((l) => h(MenuItem, { key: l.id, label: l.name, onClick: pick(() => insertFromContent(editor, at(), l.content)) })),
		h('div', { style: css.hsep }),
		section('Insert a whole template'),
		...Object.entries(TEMPLATES).map(([id, t]) =>
			h(MenuItem, { key: 't' + id, label: t.name, hint: `${t.slides.length} slides`, onClick: pick(() => { seedTemplate(editor, id); return null }) })
		)
	)
}

function EmptyState({ editor }) {
	return h('div', { style: { padding: 10, display: 'flex', flexDirection: 'column', gap: 6 } },
		h('div', { style: css.muted }, 'No slides yet. Start from:'),
		...Object.entries(TEMPLATES).map(([id, t]) =>
			h(Button, { key: id, label: `${t.name} (${t.slides.length})`, style: { justifyContent: 'flex-start', textAlign: 'left', border: '1px solid var(--tl-color-divider)' }, onClick: () => {
				seedTemplate(editor, id)
				const first = getSlides(editor)[0]
				if (first) goTo(editor, first.id)
			} })
		))
}

export function SlidePanel() {
	const editor = useEditor()
	const open = useValue(panelOpen)
	const presenting = useValue(presentIndex) >= 0
	const slides = useValue('slides', () => getSlides(editor), [editor])
	const current = useValue('currentSlide', () => getCurrentIndex(editor), [editor])
	const [dragFrom, setDragFrom] = useState(null)
	const [drop, setDrop] = useState(null) // { index, where }
	const layoutsActive = useValue(openMenu) === 'layouts'

	if (presenting) return null
	if (!open) {
		return h('div', { ...guard(editor), style: { ...css.panel, position: 'absolute', left: 8, top: 48, padding: 3, zIndex: 300 } },
			h(Button, { label: `☰ Slides (${slides.length})`, title: 'Show slide panel', onClick: () => panelOpen.set(true) }))
	}

	const onDrop = (index, where, commit) => {
		if (!commit) return setDrop({ index, where })
		if (dragFrom !== null) {
			let to = where === 'after' ? index + 1 : index
			if (dragFrom < to) to -= 1
			moveSlide(editor, dragFrom, to)
		}
		setDragFrom(null)
		setDrop(null)
	}

	return h(
		'div',
		{
			...guard(editor),
			onDragEnd: () => (setDragFrom(null), setDrop(null)),
			style: { ...css.panel, position: 'absolute', left: 8, top: 48, bottom: 64, width: PANEL_W, display: 'flex', flexDirection: 'column', zIndex: 300 },
		},
		h('div', { style: { display: 'flex', alignItems: 'center', padding: '6px 4px 4px 10px', gap: 4 } },
			h('b', { style: { flex: 1 } }, 'Slides ', h('span', { style: { ...css.muted, fontWeight: 400 } }, slides.length)),
			h(Button, { label: '«', title: 'Hide slide panel', onClick: () => panelOpen.set(false) })),
		h('div', { style: { flex: 1, overflowY: 'auto', padding: '0 4px' } },
			slides.length === 0
				? h(EmptyState, { editor })
				: slides.map((slide, i) =>
						h(Thumb, {
							key: slide.id, editor, slide, index: i, current,
							onDragStart: setDragFrom, onDrop,
							dropHint: drop && drop.index === i && dragFrom !== null ? drop.where : null,
						})
					)),
		h('div', { style: { display: 'flex', gap: 2, padding: 4, borderTop: '1px solid var(--tl-color-divider)' } },
			h(Button, { label: '+ New slide', title: 'Add a Content slide after the current one', style: { flex: 1 }, onClick: () => goTo(editor, insertSlide(editor, current + 1, 'content')) }),
			h(Button, { label: 'Layouts ▾', title: 'Choose a layout or template', active: layoutsActive, onClick: () => openMenu.set(openMenu.get() === 'layouts' ? null : 'layouts') })),
		h(LayoutPicker, { editor, anchorBottom: 0 }),
		h(SlideContextMenu, { editor, count: slides.length })
	)
}
