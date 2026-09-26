// 517 tiny hand-drawn circles: every visual issue in SWE-bench M test.
export default {
	name: '517',
	kicker: 'I · the problem',
	title: '517 bugs you have to see',
	source: 'SWE-bench M test · §IV-B',
	notes: "COVER\n• SWE-bench M: bugs in visual, user-facing JavaScript software, each with images crucial to solving it\n• Test split = 517 issues (one circle each)\n• Whole benchmark: 619 tasks, 17 libraries, 5 domains; the other 102 = dev split (comes back later)\nREF · §IV-B",
	draw(k) {
		k.grid(165, 300, 47, 517, 34, 22, { color: 'grey', rot: 0, each: () => ({ rot: (k.rand() - 0.5) * 20 }) })
		k.text(170, 760, 'SWE-bench M test: 517 visual issues in user-facing JavaScript libraries', { size: 'l', scale: 1.2 })
		k.text(170, 830, 'one circle = one issue, each with images crucial to solving it', { size: 'm', scale: 1.2, color: 'grey' })
	},
}
