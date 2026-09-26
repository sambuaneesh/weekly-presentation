// Studio page: browse decks/ like folders; organise decks and folders. Talks to studio/server.mjs.
const $ = (sel) => document.querySelector(sel)
const api = async (method, url, body) => {
	const r = await fetch(url, { method, headers: { 'content-type': 'application/json', 'x-studio': '1' }, body: body ? JSON.stringify(body) : undefined })
	const data = await r.json().catch(() => ({}))
	if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`)
	return data
}
// Tiny DOM builder: h('div.cls', { onclick }, child, 'text', …). Strings are always text, never HTML.
function h(tag, props, ...kids) {
	const [name, ...cls] = tag.split('.')
	const el = document.createElement(name || 'div')
	if (cls.length) el.className = cls.join(' ')
	if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) kids.unshift(props), (props = null)
	for (const [k, v] of Object.entries(props ?? {})) {
		if (v === undefined || v === null || v === false) continue
		if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
		else if (k === 'style') Object.assign(el.style, v)
		else if (k in el && typeof v !== 'string') el[k] = v
		else el.setAttribute(k, v === true ? '' : v)
	}
	for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)))
	return el
}
function toast(msg, ms = 2600) {
	const t = h('div.toast', msg)
	document.body.append(t)
	setTimeout(() => t.remove(), ms)
}
const SITE = 'http://localhost:5173/'
let state = { folders: [], decks: [], git: {}, site: false }
const here = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')).replace(/^\/+|\/+$/g, '')

async function refresh() {
	try {
		state = await api('GET', '/api/state')
	} catch (e) {
		toast(`studio: ${e.message}`)
	}
	render()
}
async function act(url, body, done) {
	try {
		const r = await api('POST', url, body)
		if (done) toast(typeof done === 'function' ? done(r) : done)
		await refresh()
		return r
	} catch (e) {
		toast(e.message, 4000)
		throw e
	}
}

// ---------- rendering ----------
function render() {
	const at = here()
	if (at && !state.folders.some((f) => f.path === at)) return (location.hash = '#/')
	// trail: Presentations / folder / …
	const parts = at ? at.split('/') : []
	const crumbs = [parts.length ? h('a', { href: '#/' }, 'Presentations') : h('span', 'Presentations')]
	parts.forEach((_, i) => {
		const p = parts.slice(0, i + 1).join('/')
		const f = state.folders.find((x) => x.path === p)
		crumbs.push(h('span.slash', '/'), i === parts.length - 1 ? h('span', f?.title ?? parts[i]) : h('a', { href: `#/${p}` }, f?.title ?? parts[i]))
	})
	$('#trail').replaceChildren(...crumbs)

	const g = state.git ?? {}
	$('#status').replaceChildren(
		h('span.pill', { class: `pill ${state.site ? 'ok' : ''}` }, state.site ? 'website preview on :5173' : 'website preview off'),
		g.branch && h('span.pill', `${g.changes?.length ? `${g.changes.length} unsaved change${g.changes.length === 1 ? '' : 's'}` : 'all committed'}${g.ahead ? ` · ${g.ahead} to push` : ''}`),
	)

	const folders = state.folders.filter((f) => f.folder === at)
	const decks = state.decks.filter((d) => d.folder === at)
	$('#grid').replaceChildren(...(folders.length + decks.length ? [...folders.map(folderCard), ...decks.map(deckCard)] : [h('p.empty', 'an empty folder. add a presentation or a folder.')]))
	renderGit()
}

const count = (p) => state.decks.filter((d) => d.folder === p || d.folder.startsWith(p + '/')).length
const small = (label, fn, cls = '') => h(`button.btn.small${cls}`, { onclick: (e) => (e.preventDefault(), e.stopPropagation(), fn()) }, label)

function folderCard(f) {
	return h('a.card.folder', { href: `#/${f.path}` },
		h('div.ficon', h('span.tab'), h('span.body')),
		h('div.title', f.title),
		f.description && h('p.desc', f.description),
		h('div.meta', `${count(f.path)} presentation${count(f.path) === 1 ? '' : 's'} · ${f.name}/`),
		h('div.row.actions', small('rename', () => editFolderDialog(f)), small('move', () => moveDialog(f.path, f.title)), small('delete', () => deleteDialog(f.path, f.title, true))))
}

function deckCard(d) {
	const cover = h('div.cover', d.cover ? h('img', { src: d.cover, alt: '' }) : h('div.ph', d.title), h('div.drop', 'drop an image for the cover'))
	cover.addEventListener('dragover', (e) => (e.preventDefault(), cover.classList.add('dragging')))
	cover.addEventListener('dragleave', () => cover.classList.remove('dragging'))
	cover.addEventListener('drop', (e) => {
		e.preventDefault()
		cover.classList.remove('dragging')
		if (e.dataTransfer.files?.[0]) uploadCover(d.path, e.dataTransfer.files[0])
	})
	return h('article.card', { class: `card${d.listed ? '' : ' hidden'}` },
		cover,
		h('div.title', d.title),
		d.description && h('p.desc', d.description),
		h('div.meta', [d.slides != null && `${d.slides} slides`, !d.listed && 'hidden on the website', d.open && 'open in tldraw'].filter(Boolean).join(' · ')),
		h('div.file', { title: 'open this file in tldraw Desktop to draw' }, d.file, small('copy', () => navigator.clipboard.writeText(d.file).then(() => toast('path copied')))),
		h('div.row.actions',
			small('edit', () => editDeckDialog(d)),
			small('cover', () => pickCover(d.path)),
			small('view', () => viewOnSite(d.path)),
			small('move', () => moveDialog(d.path, d.title)),
			small('delete', () => deleteDialog(d.path, d.title, false))))
}

function renderGit() {
	const g = state.git ?? {}
	const el = $('#git')
	if (g.error) return el.replaceChildren(h('h2', 'Save to GitHub'), h('p.meta', g.error))
	const msg = h('input', { type: 'text', placeholder: 'what changed? e.g. "Add the agents talk"' })
	const form = h('form', { onsubmit: async (e) => {
		e.preventDefault()
		try {
			await api('POST', '/api/git/commit', { message: msg.value })
			toast('committed')
			refresh()
		} catch (err) {
			toast(err.message, 4000)
		}
	} }, h('div.row', msg, h('button.btn', { type: 'submit', disabled: !g.changes?.length }, 'commit')))
	el.replaceChildren(
		h('h2', 'Save to GitHub'),
		g.changes?.length ? h('details', h('summary', `${g.changes.length} changed file${g.changes.length === 1 ? '' : 's'}`), h('div.changes', g.changes.map((c) => `${c.code.padEnd(2)} ${c.path}`).join('\n'))) : h('p.meta', `everything is committed · last: ${g.last || '—'}`),
		form,
		h('div.row', { style: { marginTop: '10px' } },
			h('button.btn.red', { disabled: !g.ahead, onclick: push }, g.ahead ? `push ${g.ahead} commit${g.ahead === 1 ? '' : 's'}` : 'nothing to push'),
			h('span.hint', 'pushing publishes the website (about a minute)')))
}

// ---------- actions ----------
async function uploadCover(p, file) {
	if (!/image\/(png|jpe?g)/.test(file.type)) return toast('use a PNG or JPEG')
	const dataUrl = await new Promise((res) => {
		const fr = new FileReader()
		fr.onload = () => res(fr.result)
		fr.readAsDataURL(file)
	})
	act('/api/cover', { path: p, dataUrl }, 'cover saved').catch(() => {})
}
function pickCover(p) {
	const inp = h('input', { type: 'file', accept: 'image/png,image/jpeg', style: { display: 'none' } })
	inp.onchange = () => inp.files[0] && uploadCover(p, inp.files[0])
	document.body.append(inp)
	inp.click()
	inp.remove()
}
async function viewOnSite(p) {
	const tab = window.open('about:blank', '_blank')
	if (!state.site) {
		toast('starting the website preview…')
		await api('POST', '/api/site').catch((e) => toast(e.message))
		refresh()
	}
	if (tab) tab.location = `${SITE}#/${p}`
}
async function push() {
	toast('pushing…')
	try {
		await api('POST', '/api/git/push')
		toast('pushed: the website updates in about a minute', 4000)
	} catch (e) {
		toast(e.message, 6000)
	}
	refresh()
}

// ---------- dialogs ----------
const dlg = $('#dlg')
const field = (label, input) => [h('label', label), input]
const text = (name, value, attrs = {}) => h('input', { type: 'text', name, value: value ?? '', ...attrs })
function dialog(title, fields, submitLabel, onSubmit, { danger = false } = {}) {
	const err = h('div.err')
	const form = h('form', { onsubmit: async (e) => {
		e.preventDefault()
		try {
			await onSubmit(Object.fromEntries(new FormData(form).entries()), form)
			dlg.close()
		} catch (e2) {
			err.textContent = e2.message
		}
	} }, h('h2', title), ...fields, err,
	h('div.dactions', h('button.btn', { type: 'button', onclick: () => dlg.close() }, 'cancel'), h(`button.btn.${danger ? 'danger' : 'red'}`, { type: 'submit' }, submitLabel)))
	dlg.replaceChildren(form)
	dlg.showModal()
	form.querySelector('input,textarea')?.focus()
}

function newDeckDialog() {
	const at = here()
	dialog(`New presentation${at ? ` in ${state.folders.find((f) => f.path === at)?.title ?? at}` : ''}`, [
		...field('title', text('title', '', { required: true, placeholder: 'e.g. How agents decompose a monolith' })),
		...field('description (optional)', h('textarea', { name: 'description', placeholder: 'one line for the website card' })),
		h('p.hint', 'It starts as three hand-drawn slides (title, one idea, thank you). Open the .tldraw file in tldraw to draw the rest.'),
	], 'create', async (f) => {
		const r = await api('POST', '/api/new', { title: f.title, description: f.description, folder: at })
		toast(`made ${r.path}: open it in tldraw`, 4000)
		refresh()
	})
}

function newFolderDialog() {
	dialog('New folder', [...field('name', text('title', '', { required: true, placeholder: 'e.g. Weekly presentations' }))], 'create', async (f) => {
		await api('POST', '/api/folder', { parent: here(), title: f.title })
		refresh()
	})
}

function editDeckDialog(d) {
	dialog('Edit', [
		...field('title', text('title', d.title, { required: true })),
		...field('description (optional)', h('textarea', { name: 'description' }, d.description)),
		h('label.check', h('input', { type: 'checkbox', name: 'listed', checked: d.listed }), 'show on the website'),
		h('p.hint', `link name: ${d.name}`), ...field('rename the link (optional)', text('name', d.name, { pattern: '[a-z0-9][a-z0-9-]*' })),
	], 'save', async (f, form) => {
		await api('POST', '/api/edit', { path: d.path, title: f.title, description: f.description, listed: form.listed.checked })
		if (f.name && f.name !== d.name) await api('POST', '/api/rename', { path: d.path, name: f.name })
		refresh()
	})
}

function editFolderDialog(f) {
	dialog('Folder', [
		...field('name', text('title', f.title, { required: true })),
		...field('description (optional)', h('textarea', { name: 'description' }, f.description)),
		...field('folder name in the link', text('name', f.name, { pattern: '[a-z0-9][a-z0-9-]*' })),
	], 'save', async (v) => {
		await api('POST', '/api/edit', { path: f.path, title: v.title, description: v.description })
		if (v.name && v.name !== f.name) await api('POST', '/api/rename', { path: f.path, name: v.name })
		refresh()
	})
}

function moveDialog(p, title) {
	const inside = (f) => f.path === p || f.path.startsWith(p + '/')
	const select = h('select', { name: 'to' },
		h('option', { value: '' }, 'Presentations (the top)'),
		...state.folders.filter((f) => !inside(f)).map((f) => h('option', { value: f.path, selected: f.path === here() }, `${'  '.repeat(f.path.split('/').length - 1)}${f.title}`)))
	dialog(`Move “${title}”`, [...field('into', select), h('p.hint', 'Its link changes to the new place. Close it in tldraw first.')], 'move', async (v) => {
		await api('POST', '/api/move', { path: p, to: v.to })
		refresh()
	})
}

function deleteDialog(p, title, isFolder) {
	const name = p.split('/').pop()
	dialog(`Delete “${title}”`, [
		h('p.hint', isFolder ? 'This deletes the folder and everything inside it.' : 'This deletes the presentation folder, its .tldraw file included.', ' Git keeps the last committed version until you commit this.'),
		...field(`type ${name} to confirm`, text('confirm', '', { autocomplete: 'off' })),
	], 'delete', async (v) => {
		await api('POST', '/api/delete', { path: p, confirm: v.confirm.trim() })
		refresh()
	}, { danger: true })
}

// ---------- boot ----------
$('#new-deck').onclick = newDeckDialog
$('#new-folder').onclick = newFolderDialog
$('#site-btn').onclick = async () => {
	const tab = window.open('about:blank', '_blank')
	toast('starting the website preview…')
	const r = await api('POST', '/api/site').catch((e) => (toast(e.message), null))
	if (tab) tab.location = `${r?.url ?? SITE}#/${here()}`
	refresh()
}
window.addEventListener('hashchange', render)
refresh()
setInterval(refresh, 6000)
