// Live rooms only: a "join" slide in front of the deck, with a big QR code of the room's link, so
// people in the room can scan it and follow along. It is written into the room's shared document by
// the presenter (never into the published deck), so it exists only while presenting live.
import { AssetRecordType, createShapeId, toRichText } from 'tldraw'
import qrcode from 'qrcode-generator'

const W = 1920
const H = 1080
const GAP = 240
const FRAME = createShapeId('live-join')
const ASSET = AssetRecordType.createId('live-join-qr')
const id = (tag) => createShapeId(`live-join-${tag}`)

function qrDataUrl(text) {
	const qr = qrcode(0, 'M')
	qr.addData(text)
	qr.make()
	const n = qr.getModuleCount()
	const quiet = 4
	const size = n + quiet * 2
	let path = ''
	for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c + quiet} ${r + quiet}h1v1h-1z`
	// Dark ink on white paper: phone cameras read it best, and it still suits the hand-drawn slide.
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#2b2621"/></svg>`
	return { src: `data:image/svg+xml;base64,${btoa(svg)}`, size }
}

const text = (tag, x, y, s, props = {}) => ({
	id: id(tag), type: 'text', parentId: FRAME, x, y,
	props: { richText: toRichText(s), font: 'draw', color: 'black', size: 'm', scale: 1, autoSize: true, textAlign: 'start', ...props },
})

// Add (or refresh) the join slide in front of the first slide. `url` is the room's link.
export function ensureJoinSlide(editor, url) {
	const pageId = editor.getCurrentPageId()
	const slides = editor.getSortedChildIdsForParent(pageId).map((i) => editor.getShape(i)).filter((s) => s?.type === 'frame' && !s.meta?.joinSlide)
	const first = slides.sort((a, b) => a.x - b.x || a.y - b.y)[0]
	const x = (first?.x ?? 0) - W - GAP
	const y = first?.y ?? 0
	const qr = qrDataUrl(url)
	const QR = 640
	const display = url.replace(/^https?:\/\//, '')
	editor.run(
		() => {
			if (editor.getShape(FRAME)) editor.deleteShapes([FRAME])
			if (editor.getAsset(ASSET)) editor.deleteAssets([ASSET])
			editor.createAssets([{ id: ASSET, typeName: 'asset', type: 'image', props: { name: 'join-the-room.svg', src: qr.src, w: qr.size * 16, h: qr.size * 16, mimeType: 'image/svg+xml', isAnimated: false }, meta: {} }])
			editor.createShape({ id: FRAME, type: 'frame', x, y, props: { w: W, h: H, name: 'Join the room' }, meta: { joinSlide: true, notes: 'COVER\n• Scan to follow along on your phone or laptop\n• No login; you see what I present, click by click\n(This slide only exists in live rooms.)' } })
			editor.createShapes([
				{ id: id('bg'), type: 'geo', parentId: FRAME, x: 0, y: 0, isLocked: true, props: { geo: 'rectangle', w: W, h: H, color: 'yellow', fill: 'semi', dash: 'solid', size: 's' }, meta: { role: 'bg' } },
				text('kicker', 120, 160, '● live now', { color: 'red', size: 'm', scale: 1.3 }),
				text('title', 120, 230, 'Follow along', { size: 'xl', scale: 2.3 }),
				{ id: id('underline'), type: 'geo', parentId: FRAME, x: 126, y: 470, props: { geo: 'rectangle', w: 620, h: 7, color: 'red', fill: 'fill', dash: 'solid', size: 's' } },
				text('how', 124, 540, 'scan this with your phone camera\nand you’ll see every slide as I present it', { size: 'l', scale: 1, color: 'grey' }),
				text('link', 124, 760, display, { font: 'mono', size: 's', scale: 1, color: 'grey', autoSize: false, w: 900 }),
				text('nologin', 124, 830, 'no login · just watch', { size: 'm', scale: 1, color: 'red' }),
				{ id: id('qr-frame'), type: 'geo', parentId: FRAME, x: 1140, y: 180, rotation: -0.02, props: { geo: 'rectangle', w: QR + 80, h: QR + 80, color: 'black', fill: 'none', dash: 'draw', size: 'm' } },
				{ id: id('qr'), type: 'image', parentId: FRAME, x: 1180, y: 220, isLocked: true, props: { assetId: ASSET, w: QR, h: QR } },
				text('arrow-note', 1230, 930, '↑ point your camera here', { size: 'm', scale: 1.1, color: 'grey' }),
			])
		},
		{ ignoreShapeLock: true, history: 'ignore' }
	)
}

export function hasJoinSlide(editor) {
	return !!editor.getShape(FRAME)
}
