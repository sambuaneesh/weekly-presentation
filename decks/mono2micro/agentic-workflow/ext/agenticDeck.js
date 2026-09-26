// Agentic LLM workflows for monolith-to-microservice decomposition (TSE draft, 2026).
// A short deck: title, the architecture traced live on one real run, and the takeaways.
// Numbers come from study final-benchmark-v1, run
// final-benchmark-v1-agentic-agentic-final-v1b-spring-petclinic-deepseek-v4-1-flash-s1-r1.

const TRACE_NOTES = `Beat 0 is the whole architecture (paper Fig. 1). Each click moves the camera to the agent that acts next; the inspector on the right shows what it does to one real run: Spring PetClinic (23 classes), DeepSeek v4.1 Flash, final-benchmark-v1.

1 · Inputs: the scoped source, the static dependency graph (49 typed edges; the lines between chips are the real edges), and the canonical inventory of 23 classes. Every arm gets exactly these.
2 · Evidence Constructor (hybrid): code facts (classes, edges: 21 uses, 15 calls, 8 extends, 5 creates) plus one LLM call (15,949 tokens) for views: 6 components, 17 endpoints, 6 persistence entities, 7 scenarios.
3 · Domain Extractor (LLM, 6,459 tokens): six capabilities; the chips regroup by capability. A hypothesis, not ground truth.
4 · Generator (3 calls, 11,710 tokens): dependency-first gives 4 services; domain-first and balanced return the same 6-service partition (prompt collapse). Repair had nothing to fix.
5 · Evaluator: all pass the gate; the reference-free score (CMod .3, CiD .2, MF .2) selects dependency-first (73.4 vs 69.0). Domain-first matches the capability map perfectly, but that agreement is deliberately not scored (self-referential).
6–8 · Refiner: three strict-Pareto single-class moves (Vet, Specialty, Visit into DomainFoundation); CMod 55.4 → 60.7 → 65.7 → 66.8, MF 73.9 → 76.5, CiD stays 100. No LLM calls.
9 · Round 4: none of 12 moves is admissible (best: VisitController would drop CiD to 83.3), so it stops. Point out the limitation: structurally better, semantically questionable.
10 · Freeze: 4 services, 23/23 classes, 5 LLM calls, 34,118 tokens; manifest with hashes.
11 · Only now the reference is read: best-match overlaps 64/30/60/67 %, so C2C-10/33/50 = 100/75/75; CMod 66.8, CiD 100, DTP 83.9. Note the SystemInfrastructure service matches the reference's unassigned group.
12 · Zoom out: the division of labour — LLMs interpret and propose, code checks and improves.`

export const AGENTIC_SLIDES = [
	{
		layout: 'title',
		overrides: {
			name: 'Title',
			title: 'How an agentic workflow decomposes a monolith',
			subtitle: 'One real run, traced step by step · Spring PetClinic · DeepSeek v4.1 Flash',
			notes: 'From the TSE draft "Agentic LLM Workflows for Monolith-to-Microservice Decomposition". Next slide: the architecture, then a live trace of one run.',
		},
	},
	{ layout: 'scene', overrides: { scene: 'agentic', name: 'Live trace', notes: TRACE_NOTES } },
	{
		layout: 'content',
		overrides: {
			name: 'Takeaways',
			title: 'What the trace shows',
			bullets: [
				'LLMs interpret and propose: 5 calls, about 34k tokens for the whole run',
				'Code checks, scores, and improves: gate, reference-free score, Pareto local search',
				'Complete by construction: every class assigned exactly once',
				'The reference is read only after the result is frozen',
				'Proxies have limits: the refiner optimizes structure, not business meaning',
			],
			notes: 'Across the benchmark (4 systems × 4 models): valid in 32/32 runs, 31.9% fewer tokens than single-shot prompting, design quality comparable (no significant difference).',
		},
	},
]
