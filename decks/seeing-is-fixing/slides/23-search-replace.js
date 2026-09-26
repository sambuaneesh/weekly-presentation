// Step 5, patch generation: a Search/Replace edit, the real prism-1602 fix (Fig. 7a).
const PRE = 'pattern: '
const BUG = String.raw`/([:\-,[{]\s*(?:![^\s]+)?[ \t]*)("|')(?:(?!\2)[^\\\r\n]|\\.)*\2(?=[ \t]*(?:$|,|]|}))/m,`
const FIX = String.raw`/([:\-,[{]\s*(?:![^\s]+)?[ \t]*)("|\')(?:(?!\2)[^\\\r\n]|\\.)*\2(?=[ \t]*(?:$|#|,|]|}))/m,`

export default {
	name: 'Search / Replace',
	kicker: 'II · the method · step 5',
	title: 'Write the edit',
	source: '§III-C · prism-1602 fix, Fig. 7a',
	notes: "COVER\n• Step 5, patch generation, in Agentless's Search/Replace format\n• Search = the buggy code, Replace = the fix (the real prism-1602 regex)\n• Applied to the source, then written out with git diff\nCLICKS\n1 · the replace card · 2 · the added # circled · 3 · \"then a git diff\"\nREF · §III-C · Fig. 7a",
	draw(k) {
		const s = 1.4
		k.text(200, 250, 'components/prism-yaml.js', { size: 's', scale: 1.2, font: 'mono', color: 'grey' })
		k.box(170, 300, 1580, 190, { fill: 'solid', color: 'white', size: 's', rot: -0.8, id: 'search' })
		k.text(200, 318, 'SEARCH', { size: 'l', color: 'red', rot: -0.8 })
		k.text(210, 400, PRE + BUG, { size: 's', scale: s, font: 'mono', rot: -0.8 })
		k.box(190, 580, 1580, 190, { fill: 'solid', color: 'white', size: 's', rot: 0.6, id: 'replace', beat: 1, anim: 'drop' })
		k.text(220, 596, 'REPLACE', { size: 'l', color: 'green', rot: 0.6, beat: 1, anim: 'drop' })
		k.text(230, 680, PRE + FIX, { size: 's', scale: s, font: 'mono', rot: 0.6, beat: 1, anim: 'fade' })
		k.arrow([960, 500], [960, 575], { beat: 1, anim: 'fade' })
		// the change: '#' joins the lookahead
		const cw = 10.8 * s, i = (PRE + FIX).indexOf('$|#')
		k.loop(234 + (i + 2.5) * cw, 700 + (i + 2.5) * cw * 0.0105, 30, 34, { beat: 2, anim: 'wipe' })
		k.text(1470, 850, 'then a git diff', { size: 'l', scale: 1.2, beat: 3, anim: 'wipe', rot: -2, id: 'diff' })
		k.arrow([1500, 780], [1560, 845], { beat: 3, bend: -20, anim: 'fade' })
	},
}
