// eslint-15243 as a detective's corkboard: sticky notes pinned up, red string (real bound arrows) between them.
export default {
	name: 'eslint-15243',
	kicker: 'III · a case · eslint-15243',
	title: 'Why the docs matter',
	source: '§V-B2 · Fig. 9 (GUIRepair base vs. GUIRepair I2C)',
	notes: "COVER\n• A case Image2Code alone solved: \"Support async formatter\"\n• Without docs, the base never looks at lib/cli.js → fix fails\n• architecture.md says lib/cli.js is the heart of the CLI → found → patch matches the developer's\n• Note: not visual; the gain is the mined project knowledge\nCLICKS\n1 · base's guesses · 2 · the architecture.md note · 3 · lib/cli.js + the await patch\nREF · §V-B2 · Fig. 9",
	draw(k) {
		const pin = (x, y, beat) => k.circle(x, y, 11, { fill: 'fill', color: 'red', size: 's', beat })
		// a note as paper: a handwritten heading at the top, mono lines written on it
		const card = (id, x, y, scale, color, head, lines, o = {}) => {
			k.note(x, y, head, { id, color, scale, size: 's', valign: 'start', rot: o.rot, beat: o.beat, anim: 'drop' })
			pin(x + 100 * scale, y + 2, o.beat)
			lines.forEach(([t, c, font], i) => k.text(x + 22, y + 34 * scale + 40 + i * 34, t, { font: font ?? 'mono', size: 's', scale: o.ts ?? 1.05, color: c ?? 'black', beat: o.beat, anim: 'drop' }))
		}
		// the issue
		k.note(790, 240, 'eslint #15242\n\nChange Request:\nSupport async formatter', { id: 'issue', color: 'yellow', scale: 1.5, size: 's', rot: -1 })
		pin(940, 242)
		// click 1: what the base looked at
		card('base', 130, 500, 1.8, 'light-red', 'base', [['lib/cli-engine/index.js'], ['lib/cli-engine/cli-engine.js'], ['lib/cli-engine/formatters/'], ['never looks at lib/cli.js', 'red', 'draw']], { rot: 1.5, beat: 1 })
		k.arrow('issue', 'base', { color: 'red', bend: 30, beat: 1, head: 'none', size: 's' })
		// click 2: the maintainers' own map
		card('arch', 1420, 250, 1.9, 'light-blue', 'architecture.md', [['developer-guide/', 'black', 'draw'], ['“lib/cli.js - this is the', 'black', 'draw'], ['heart of the ESLint CLI. …', 'black', 'draw'], ['This is also the part that', 'black', 'draw'], ['does all the file reading,', 'black', 'draw'], ['directory traversing, input,', 'black', 'draw'], ['and output.”', 'black', 'draw']], { rot: 1.5, beat: 2 })
		k.arrow('issue', 'arch', { color: 'red', bend: -25, beat: 2, head: 'none', size: 's' })
		// click 3: with Image2Code
		card('i2c', 820, 570, 2, 'light-green', 'with Image2Code', [['lib/cli-engine/formatters/stylish.js'], ['lib/cli-engine/cli-engine.js'], ['lib/cli.js', 'black'], [''], ['+ await formatter.format(results)', 'black'], ['consistent with the developer’s patch', 'black', 'draw']], { rot: -1.5, beat: 3, ts: 0.98 })
		k.tick(975, 738, 34, { beat: 3 })
		k.arrow('arch', 'i2c', { color: 'red', bend: -20, beat: 3, size: 's' })
	},
}
