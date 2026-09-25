// Tiny UI kit: createElement alias, tldraw-themed styles, and event guards for overlay UI.
import { createElement } from 'react'

export const h = createElement

export const css = {
	panel: {
		background: 'var(--tl-color-panel)',
		color: 'var(--tl-color-text-1)',
		boxShadow: 'var(--tl-shadow-2)',
		borderRadius: 'var(--tl-radius-3, 9px)',
		fontSize: 12,
		pointerEvents: 'all',
		userSelect: 'none',
	},
	sep: { width: 1, alignSelf: 'stretch', margin: '4px 3px', background: 'var(--tl-color-divider)' },
	hsep: { height: 1, margin: '4px 0', background: 'var(--tl-color-divider)' },
	muted: { color: 'var(--tl-color-text-3)' },
	input: {
		width: '100%',
		boxSizing: 'border-box',
		padding: '6px 8px',
		border: '1px solid var(--tl-color-divider)',
		borderRadius: 6,
		background: 'var(--tl-color-background)',
		color: 'var(--tl-color-text-1)',
		font: 'inherit',
		userSelect: 'text',
	},
}

// Stop canvas gestures (brush select, panning, wheel zoom) from starting on overlay UI.
export function guard(editor) {
	return {
		onPointerDown: (e) => {
			editor.markEventAsHandled(e)
			e.stopPropagation()
		},
		onWheel: (e) => e.stopPropagation(),
		onContextMenu: (e) => e.preventDefault(),
	}
}

export function Button({ label, title, onClick, disabled, primary, active, style }) {
	return h(
		'button',
		{
			title,
			disabled,
			onClick,
			onMouseEnter: (e) => !primary && !disabled && !active && (e.currentTarget.style.background = 'var(--tl-color-muted-2)'),
			onMouseLeave: (e) => !primary && !active && (e.currentTarget.style.background = 'transparent'),
			style: {
				height: 30,
				minWidth: 30,
				padding: '0 9px',
				border: 'none',
				borderRadius: 6,
				background: active ? 'var(--tl-color-muted-2)' : 'transparent',
				color: 'inherit',
				font: 'inherit',
				whiteSpace: 'nowrap',
				opacity: disabled ? 0.4 : 1,
				cursor: disabled ? 'default' : 'pointer',
				...(primary && { background: 'var(--tl-color-selected)', color: 'var(--tl-color-selected-contrast)', fontWeight: 600 }),
				...style,
			},
		},
		label
	)
}

export function MenuItem({ label, hint, onClick, danger, checked, disabled }) {
	return h(
		'div',
		{
			role: 'menuitem',
			onClick: disabled ? undefined : onClick,
			onMouseEnter: (e) => !disabled && (e.currentTarget.style.background = 'var(--tl-color-muted-2)'),
			onMouseLeave: (e) => (e.currentTarget.style.background = 'transparent'),
			style: {
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				padding: '6px 10px',
				borderRadius: 5,
				cursor: disabled ? 'default' : 'pointer',
				opacity: disabled ? 0.4 : 1,
				color: danger ? 'var(--tl-color-warn, #e03131)' : 'inherit',
				whiteSpace: 'nowrap',
			},
		},
		checked !== undefined && h('span', { style: { width: 12 } }, checked ? '✓' : ''),
		h('span', { style: { flex: 1 } }, label),
		hint && h('span', { style: { ...css.muted, fontSize: 11 } }, hint)
	)
}

export function Popover({ editor, style, children }) {
	return h('div', { ...guard(editor), style: { ...css.panel, position: 'absolute', padding: 4, zIndex: 400, ...style } }, children)
}
