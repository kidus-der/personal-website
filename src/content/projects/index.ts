import type { Project } from '$lib/types/content';

export const projects: Project[] = [
	{
		slug: 'coeus-ai',
		title: 'Coeus AI',
		description: 'AI-powered educational assistant with adaptive learning and real-time tutoring.',
		longDescription:
			'Full-stack educational AI assistant built with Next.js and Gemini 2.5 Flash. Features adaptive learning paths, real-time tutoring sessions, and personalized study plans powered by a RAG pipeline over course materials.',
		tags: ['Next.js', 'Gemini API', 'NextAuth', 'Prisma', 'PostgreSQL'],
		year: 2025,
		githubUrl: 'https://github.com/kidus-der/coeus-ai',
		images: [],
		featured: true
	},
	{
		slug: 'flairglow-probeauty',
		title: 'FlairGlow Probeauty',
		description: 'Full-stack beauty business platform with booking, inventory, and client management.',
		longDescription:
			'Production-ready web application for beauty professionals built with React and Django. Includes appointment scheduling, inventory tracking, client profiles, and automated notifications — deployed via Docker with a CI/CD pipeline.',
		tags: ['React', 'Django', 'Docker', 'PostgreSQL', 'CI/CD'],
		year: 2024,
		images: [],
		featured: true
	},
	{
		slug: 'elevent',
		title: 'ELEVENT',
		description: 'Android event management app with real-time Firebase backend and QR code check-in.',
		longDescription:
			'Native Android application for event organizers and attendees. Supports event creation, QR-based check-in, real-time attendee tracking via Firebase, and geo-located event discovery through the Google Maps API.',
		tags: ['Java', 'Android', 'Firebase', 'Google Maps API'],
		year: 2024,
		githubUrl: 'https://github.com/kidus-der/elevent',
		images: [],
		featured: false
	},
	{
		slug: 'poseidon-wildfire',
		title: 'Poseidon Wildfire Solution',
		description: 'AWS-powered wildfire detection system — 2nd place at the AWS Generative AI Hackathon.',
		longDescription:
			'Serverless wildfire detection pipeline built on AWS Lambda, S3, and Bedrock. Ingests satellite imagery, runs generative AI analysis to identify fire risk zones, and delivers real-time alerts. Placed 2nd at the AWS Generative AI Hackathon.',
		tags: ['AWS Lambda', 'AWS S3', 'AWS Bedrock', 'Python'],
		year: 2024,
		images: [],
		featured: false
	},
	{
		slug: 'svm-stock-predictor',
		title: 'SVM Stock Price Predictor',
		description: 'Comparative study of three SVM kernels for stock price prediction.',
		longDescription:
			'Research project benchmarking linear, polynomial, and RBF SVM kernels against historical stock data. Includes feature engineering, cross-validation, and a detailed analysis of kernel trade-offs across different market conditions.',
		tags: ['Python', 'scikit-learn', 'NumPy', 'Matplotlib'],
		year: 2023,
		githubUrl: 'https://github.com/kidus-der/svm-stock-predictor',
		images: [],
		featured: false
	},
	{
		slug: 'port-scanner',
		title: 'Multithreaded Port Scanner',
		description: 'High-performance port scanner achieving 60% speed improvement via Python threading.',
		longDescription:
			'A network reconnaissance tool that uses Python threading to scan ports in parallel, achieving a 60% reduction in scan time compared to sequential implementations. Supports configurable thread pools, timeout handling, and JSON output.',
		tags: ['Python', 'Networking', 'Multithreading'],
		year: 2023,
		githubUrl: 'https://github.com/kidus-der/port-scanner',
		images: [],
		featured: false
	}
];
