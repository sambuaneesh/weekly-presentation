// One idea per slide. Replace this with your first idea: a doodle, a few handwritten words, a click or two.
export default {
	name: 'One idea',
	kicker: 'I · the start',
	title: 'One idea, drawn',
	notes: 'COVER\n• The one point of this slide\nCLICKS\n1 · the arrow draws in · 2 · the red loop\nREF · —',
	draw(k) {
		k.box(360, 420, 380, 240, { text: 'before', dash: 'draw', size: 'l', id: 'a' })
		k.box(1180, 420, 380, 240, { text: 'after', dash: 'draw', size: 'l', id: 'b' })
		k.arrow('a', 'b', { text: 'what changes', bend: -40, color: 'red', beat: 1, anim: 'fade' })
		k.loop(1370, 540, 230, 150, { beat: 2, anim: 'wipe' })
	},
}
