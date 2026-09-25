// Live slide thumbnails: re-rendered (debounced) whenever anything on the slide changes.
import { useEffect, useState } from 'react'
import { useValue } from 'tldraw'

const cache = new Map() // slideId -> { sig, url }

function signature(editor, slideId) {
	let sig = ''
	for (const id of editor.getShapeAndDescendantIds([slideId])) {
		const s = editor.getShape(id)
		if (!s) continue
		sig += `${s.id}${s.x},${s.y},${s.rotation},${s.opacity}${JSON.stringify(s.props)}|`
	}
	return sig
}

export function useThumbnail(editor, slideId) {
	const sig = useValue('thumb:' + slideId, () => signature(editor, slideId), [editor, slideId])
	const [url, setUrl] = useState(() => cache.get(slideId)?.url ?? null)

	useEffect(() => {
		const cached = cache.get(slideId)
		if (cached && cached.sig === sig) {
			setUrl(cached.url)
			return
		}
		let cancelled = false
		const timer = setTimeout(async () => {
			try {
				const { blob } = await editor.toImage([slideId], { format: 'png', scale: 0.18, background: true, padding: 0 })
				if (cancelled) return
				const next = URL.createObjectURL(blob)
				const old = cache.get(slideId)
				cache.set(slideId, { sig, url: next })
				setUrl(next)
				if (old?.url) setTimeout(() => URL.revokeObjectURL(old.url), 1000)
			} catch {}
		}, cached ? 450 : 30)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [editor, slideId, sig])

	return url
}
