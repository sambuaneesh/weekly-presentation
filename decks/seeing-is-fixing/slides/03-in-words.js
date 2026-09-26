// The bug report as words on a sticky note, next to an empty frame: can you picture it?
export default {
	name: 'In words',
	kicker: 'I · the problem',
	title: 'Here is a bug report…',
	source: 'prism-1602 · as described in §III-D2',
	notes: "COVER\n• A real benchmark task: prism-1602 (a syntax highlighter)\n• Read the note aloud: YAML strings fail to highlight when a comment is on the same line\n• Ask the room to picture exactly what's wrong\nCLICKS\n1 · the empty frame: \"can you picture it?\"\nREF · §III-D2 · upstream title \"Yaml strings fail with trailing comments\" [66]",
	draw(k) {
		k.note(220, 290, 'prism-1602\n\nYAML strings fail to highlight when a comment appears on the same line', { size: 's', scale: 2.4, rot: -3, id: 'note' })
		k.box(1140, 320, 560, 420, { dash: 'dotted', color: 'grey', size: 'm', beat: 1, anim: 'fade', id: 'empty' })
		k.text(1372, 400, '?', { size: 'xl', scale: 4, color: 'red', beat: 1, anim: 'wiggle' })
		k.text(1200, 790, 'can you picture it?', { size: 'l', scale: 1.2, beat: 1, anim: 'fade', rot: -2 })
	},
}
