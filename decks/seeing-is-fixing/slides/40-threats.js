// The two threats the authors name themselves, as two sticky notes.
export default {
	name: 'Threats',
	kicker: 'V · honest light',
	title: 'Threats the authors name',
	source: '§VI',
	notes: "COVER\n• Data leakage: same base model as the baselines, still ahead; ablation + model study show it isn't just the model\n• Repo configuration: manual and inefficient; SWE-bench M has since released Docker images; automation planned\nCLICKS\n1 · data leakage · 2 · repo configuration\nREF · §VI",
	draw(k) {
		k.note(380, 330, 'Data leakage\n\nsame base model as the baselines, and still ahead of them', { scale: 2.3, size: 's', rot: -3, beat: 1, anim: 'drop' })
		k.note(1060, 360, 'Repo configuration\n\nset up by hand, slowly; SWE-bench M has since released Docker images', { scale: 2.3, size: 's', rot: 2.5, beat: 2, anim: 'drop' })
	},
}
