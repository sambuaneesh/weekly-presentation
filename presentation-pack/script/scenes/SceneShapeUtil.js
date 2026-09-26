// The `scene` shape: an animated, beat-driven visual (see scenes/registry.js) that fills a slide.
// It only reads state (the beat being shown); it never writes to the document, so animation is
// free: nothing to save, sync or undo. Live-room viewers animate in step because the beat is shared.
import { ShapeUtil, HTMLContainer, Rectangle2d, T, resizeBox, useEditor, useValue } from 'tldraw'
import { createElement as h } from 'react'
import { SCENES } from './registry.js'
import { Backdrop, DESIGN_W, DESIGN_H, C, F } from './kit.js'
import { shownBeat } from '../lib/beats.js'
import { slideOf } from '../lib/slides.js'

function Stage({ shape, b, still, frozen }) {
	const def = SCENES[shape.props.scene]
	const k = shape.props.w / DESIGN_W
	return h('div', {
			style: {
				position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: DESIGN_H, overflow: 'hidden',
				transform: `scale(${k})`, transformOrigin: '0 0', color: C.ink, fontFamily: F.hand,
			},
		},
		h(Backdrop, { frozen, safelight: def?.safelight !== false }),
		def
			? h(def.render, { b, still, frozen })
			: h('div', { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: C.dim } },
				`Unknown scene “${shape.props.scene}”`))
}

function SceneView({ shape }) {
	const editor = useEditor()
	const shown = useValue('sceneBeat', () => {
		const slide = slideOf(editor, shape.id)
		return slide ? shownBeat(editor, slide.id) : Infinity
	}, [editor, shape.id])
	// While editing, `meta.previewBeat` pins a scene to one beat (handy for checking a step
	// without presenting). Presenting always wins.
	const pin = shape.meta?.previewBeat
	const b = shown === Infinity && typeof pin === 'number' ? pin : shown
	return h(HTMLContainer, { style: { pointerEvents: 'none', overflow: 'hidden' } },
		h(Stage, { shape, b, still: b === Infinity, frozen: false }))
}

export class SceneShapeUtil extends ShapeUtil {
	static type = 'scene'
	static props = { w: T.number, h: T.number, scene: T.string }

	getDefaultProps() {
		return { w: DESIGN_W, h: DESIGN_H, scene: 'title' }
	}

	isAspectRatioLocked() {
		return true
	}
	canBind() {
		return false
	}
	hideRotateHandle() {
		return true
	}

	getGeometry(shape) {
		return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
	}

	component(shape) {
		return h(SceneView, { shape })
	}

	// Thumbnails and exports: the finished state, without motion.
	toSvg(shape) {
		const { w, h: hh } = shape.props
		return h('foreignObject', { x: 0, y: 0, width: w, height: hh },
			h('div', { xmlns: 'http://www.w3.org/1999/xhtml', style: { position: 'relative', width: w, height: hh, overflow: 'hidden' } },
				h(Stage, { shape, b: Infinity, still: true, frozen: true })))
	}

	getIndicatorPath(shape) {
		const path = new Path2D()
		path.rect(0, 0, shape.props.w, shape.props.h)
		return path
	}

	onResize(shape, info) {
		return resizeBox(shape, info)
	}
}
