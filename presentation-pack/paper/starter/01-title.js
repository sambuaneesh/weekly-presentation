// Title: the name, hand-lettered, and who is presenting. {{TITLE}} etc. are filled in by `deck new`.
export default {
	name: 'Title',
	notes: 'COVER\n• What this talk is about, in one line\n• Who you are\nREF · —',
	draw(k) {
		k.text(160, 330, {{TITLE_JSON}}, { size: 'xl', scale: 2.4 })
		k.underline(170, 510, 820, { color: 'red' })
		k.text(166, 570, {{SUBTITLE_JSON}}, { size: 'l', scale: 1.1, color: 'grey' })
		k.text(166, 830, 'presented by', { size: 'm', scale: 1.1, color: 'grey' })
		k.text(166, 864, {{PRESENTER_JSON}}, { size: 'xl', scale: 1.1 })
		// one small doodle: a light bulb that switches on with the first click
		k.circle(1480, 520, 120, { size: 'm' })
		k.circle(1480, 520, 120, { color: 'yellow', fill: 'solid', size: 's', beat: 1, anim: 'fade' })
		k.box(1446, 640, 68, 60, { color: 'grey', fill: 'pattern', size: 's' })
		k.pen([[1440, 540], [1460, 490], [1480, 530], [1500, 490], [1520, 540]], { wob: 1 })
	},
}
