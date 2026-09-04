import type { Experience } from '$lib/types/content';

export const experience: Experience[] = [
	{
		company: 'Scam AI',
		role: 'Founding Engineer',
		location: 'Remote, Canada',
		period: { start: '2026-06', end: 'Present' },
		url: 'https://www.scam.ai/en',
		bullets: [
			"Built core detection pipelines for Eva V1.6, Scam AI's multi-modal deepfake and forgery engine: face-swap, lip-sync, GAN fingerprinting, diffusion signatures, document forgery localization, voice clones across image, video, document, and audio. SOC 2 Type II, GDPR-compliant; catches 98.2% of deepfakes at sub-4-second inference.",
			'Shipped Halo with Qualcomm: the first on-device, real-time deepfake detector for live video calls (Zoom, Teams, Meet) running ~4 checks/sec with zero video upload.',
			'Hands-on technical point of contact for enterprise clients integrating the REST detection API into onboarding, claims, and content-moderation workflows.',
			"Authored 8 peer-reviewed and arXiv papers on synthetic-media forensics that directly informed Eva's model selection and training-data strategy."
		]
	},
	{
		company: 'Scam AI',
		role: 'Machine Learning Engineer',
		location: 'Remote, Canada',
		period: { start: '2025-01', end: '2026-06' },
		url: 'https://www.scam.ai/en',
		bullets: [
			'Built voice-clone and synthetic-audio detection models (cross-language, ElevenLabs/PlayHT/Azure TTS, splice/pitch/speed manipulations) reaching 98.5% accuracy in under 3 seconds per clip, served through real-time and batch REST endpoints.',
			'Worked across the CheckReality.ai forensic stack: GAN fingerprints, diffusion signatures, frequency-domain anomalies, metadata forensics, C2PA validation, document forgery, liveness.',
			'Engineered a synthetic scam-data pipeline (LangChain, ElevenLabs, Qwen-MT) producing training samples in 14 languages.',
			'Designed a multi-agent scam-call scoring system (Deepgram, LiveKit, FastAPI, fine-tuned OpenAI model) at 80% success rate, and an agentic SMS scam-detection API on a fine-tuned Qwen model.',
			'Implemented CAM explainability heatmaps (PyTorch, EfficientNet) for audit-ready forensic reports.'
		]
	},
	{
		company: 'Avolta Inc.',
		role: 'Machine Learning Intern',
		period: { start: '2023-10', end: '2024-01' },
		bullets: [
			'Fine-tuned YOLOv5 on a car-theft image dataset, improving accuracy by 20%.',
			'Engineered ETL pipelines for ML data ingestion.',
			'Automated data validation and augmentation for continuous training.'
		]
	}
];
