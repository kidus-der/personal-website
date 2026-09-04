import type { Publication } from '$lib/types/content';

export const publications: Publication[] = [
	{
		id: '2608.24127',
		title:
			'Anatomy of a Scam Call: What 10,000 real scam and spam calls reveal about how phone scammers operate',
		venue: 'arXiv',
		year: 2026,
		url: 'https://arxiv.org/abs/2608.24127',
		topics: ['audio', 'behavioral', 'dataset'],
		bullets: [
			'Analyzed a complete corpus of 10,211 inbound scam and spam calls (913 hours of audio, 330,956 transcribed turns from 5,780 distinct numbers) collected over 54 days by an AI voice-agent honeypot.',
			'Ran a randomized experiment across 1,823 calls using ten fictitious caller identities, finding scammers spent more conversational turns working older-sounding targets.',
			'Showed that scam escalation is predictable early from a caller’s opening lines alone, benchmarking classifiers up to 0.87 ROC-AUC by the eighth line on a caller-disjoint split.'
		]
	},
	{
		id: '2604.25370',
		title:
			'GPT-Image-2 in the Wild: A Twitter Dataset of Self-Reported AI-Generated Images from the First Week of Deployment',
		venue: 'arXiv',
		year: 2026,
		url: 'https://arxiv.org/abs/2604.25370',
		topics: ['dataset'],
		bullets: [
			'Curated 10,217 confirmed GPT-image-2 images from Twitter/X within six days of release using a multilingual (English, Japanese, Chinese) text-heuristic pipeline and browser-automated badge verification.',
			'Designed a multi-stage data curation pipeline labeling over 27,000 raw image records with high-confidence provenance.',
			'Documented that C2PA cryptographic content credentials are systematically stripped by Twitter’s CDN on upload, with broad implications for AI image provenance research.'
		]
	},
	{
		id: '2604.25213',
		title: 'When the Forger Is the Judge: GPT-Image-2 Cannot Recognize Its Own Faked Documents',
		venue: 'arXiv',
		year: 2026,
		url: 'https://arxiv.org/abs/2604.25213',
		topics: ['documents', 'benchmark'],
		bullets: [
			'Demonstrated that GPT-Image-2 inpainting erases the visual boundary between authentic and AI-edited document images, enabling seamless single-field manipulation at near-zero cost.',
			'Benchmarked three forensic judges (TruFor, DocTamper, GPT-Image-2 self-judge) on a newly released dataset of AI-inpainted receipts and financial documents; forensic AUC collapsed from 0.962/0.852 to 0.599/0.585 on GPT-Image-2 inpainting.',
			'Released the full dataset, curation pipeline, and four-judge evaluation protocol to support future AI forensics research.'
		]
	},
	{
		id: '2604.05475',
		title:
			'A Synthetic Eye Movement Dataset for Script Reading Detection: Real Trajectory Replay on a 3D Simulator',
		venue: 'arXiv',
		year: 2026,
		url: 'https://arxiv.org/abs/2604.05475',
		topics: ['dataset', 'behavioral'],
		bullets: [
			'Introduced an open-source infrastructure and dataset (final_dataset_v1, 12 hours) mapping real human iris trajectories from webcams and replaying them on a 3D simulator via headless browser automation.',
			'Applied the pipeline to script-reading detection during video interviews, showing synthetic trajectories preserve the temporal dynamics of real eye movements (KS D < 0.14).',
			'Characterized a visual sensitivity limitation at reading-scale movements caused by the absence of coupled head motion, establishing design baselines for future behavioral simulators.'
		]
	},
	{
		id: '2602.07814',
		title:
			'How well are open sourced AI-generated image detection models out-of-the-box: A comprehensive benchmark study',
		venue: 'arXiv',
		year: 2026,
		url: 'https://arxiv.org/abs/2602.07814',
		topics: ['benchmark'],
		bullets: [
			'Led the first large-scale zero-shot benchmark of AI-generated image detectors: 23 pretrained models across 12 datasets and 2.6 million image samples.',
			'Identified critical generalization gaps — detector performance is highly context-dependent (Spearman ρ as low as 0.01) and training data alignment outweighs architecture.',
			'Developed deployment guidelines showing modern generators (Midjourney, Flux) frequently defeat existing detectors, with a framework for threat-specific model selection.'
		]
	},
	{
		id: '2508.11021',
		title: 'Can Multi-modal (reasoning) LLMs detect document manipulation?',
		venue: 'arXiv',
		year: 2025,
		url: 'https://arxiv.org/abs/2508.11021',
		topics: ['documents', 'llm-eval'],
		bullets: [
			'Benchmarked GPT-4o, Gemini, and Llama 3.2 for detecting document fraud across diverse forgery types.',
			'Demonstrated that top-performing LLMs show superior zero-shot generalization over traditional SVM and CNN baselines for out-of-distribution forgeries.',
			'Found that model size and advanced reasoning show limited correlation with detection accuracy, while providing a foundation for interpretable, scalable fraud mitigation.'
		]
	},
	{
		id: '2503.20084',
		title: 'Can Multi-modal (reasoning) LLMs work as deepfake detectors?',
		venue: 'arXiv',
		year: 2025,
		url: 'https://arxiv.org/abs/2503.20084',
		topics: ['deepfake', 'llm-eval'],
		bullets: [
			'Benchmarked 12 state-of-the-art multi-modal LLMs (including GPT-4o, Gemini 2, Claude 3.7) for zero-shot deepfake detection across multiple datasets.',
			'Conducted ablation studies investigating the impact of model size, version updates, and reasoning capabilities on detection performance.',
			'Analyzed failure modes and interpretability through score distribution analysis and reasoning pathway examination.'
		]
	},
	{
		id: '2502.10920',
		title: 'Do Deepfake Detectors Work in Reality?',
		venue: 'ACM',
		year: 2025,
		url: 'https://arxiv.org/abs/2502.10920',
		officialUrl: 'https://dl.acm.org/doi/10.1145/3709022.3736545',
		topics: ['deepfake'],
		bullets: [
			'Investigated the vulnerability of deepfake detection methods to real-world data manipulations, particularly super-resolution post-processing.',
			'Contributed to the creation of a novel real-world faceswap dataset to benchmark deepfake detectors in practical settings.'
		]
	}
];

export function publicationsByYear(): { year: number; count: number }[] {
	const counts = new Map<number, number>();
	for (const pub of publications) {
		counts.set(pub.year, (counts.get(pub.year) ?? 0) + 1);
	}
	return [...counts.entries()].sort(([a], [b]) => a - b).map(([year, count]) => ({ year, count }));
}
