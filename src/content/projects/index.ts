import type { Project, ProjectCategory } from '$lib/types/content';

export const PROJECT_CATEGORIES: { id: ProjectCategory | 'all'; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'ai-ml', label: 'AI & ML' },
	{ id: 'full-stack', label: 'Full-stack' },
	{ id: 'systems', label: 'Systems' },
	{ id: 'mobile', label: 'Mobile' }
];

// Sorted by year desc; entries within a year follow the design-spec table order.
export const projects: Project[] = [
	{
		slug: 'prime-radiant',
		title: 'Prime Radiant',
		description:
			'A Seldon-inspired macro-stability engine. Temporal GNNs over GDELT and ACLED event streams score Elite Overproduction, State Health, and Popular Well-being to forecast regional instability.',
		highlights: [
			'Temporal GNN (seldon-1) trained on GDELT and ACLED event streams to forecast regional instability.',
			'SDT stress index Ψ = E×S / W scoring Elite Overproduction, State Health, and Popular Well-being.',
			'Cross-lingual semantic drift across Amharic, Arabic, and English tracked as a leading indicator.',
			'ZenML and DVC pipeline feeding a Next.js and Three.js future-cone dashboard.'
		],
		tags: ['Temporal GNN', 'GDELT', 'ACLED', 'Next.js', 'Three.js', 'ZenML', 'DVC'],
		year: 2026,
		category: 'ai-ml',
		githubUrl: 'https://github.com/kidus-der/prime-radiant',
		images: [],
		featured: true,
		accent: '#F59E0B'
	},
	{
		slug: 'personal-website',
		title: 'This website',
		description:
			'A SvelteKit 2 and Svelte 5 personal site with Motion-driven animation, Tailwind v4 design tokens, and an mdsvex-powered blog, deployed on Vercel.',
		highlights: [
			'Svelte 5 runes and SvelteKit 2 route groups separate a cinematic portfolio section from an editorial blog section.',
			'Motion timelines and Svelte actions drive scroll-triggered reveals, magnetic cursors, and page transitions.',
			'Tailwind v4 design tokens power a light/dark theme with no flash of unstyled theme on load.',
			'mdsvex renders Markdown blog posts with Svelte component interpolation and Shiki syntax highlighting.'
		],
		tags: ['SvelteKit', 'Svelte 5', 'TypeScript', 'Motion', 'Tailwind CSS', 'mdsvex', 'Vercel'],
		year: 2026,
		category: 'full-stack',
		url: 'https://kidusder.com',
		githubUrl: 'https://github.com/kidus-der/personal-website',
		images: [],
		featured: false,
		accent: '#EF5824'
	},
	{
		slug: 'coeus-ai',
		title: 'Coeus AI',
		description: 'AI-powered educational assistant with adaptive learning and real-time tutoring.',
		highlights: [
			'AI-powered educational assistant built with Next.js, React, and TypeScript for uploading and chatting with course documents.',
			'Document analysis using the Google Gemini 2.5 Flash model, generating study plans and practice questions.',
			'Secure authentication with NextAuth.js, Prisma ORM, and bcryptjs password hashing.'
		],
		tags: ['Next.js', 'React', 'TypeScript', 'Gemini API', 'NextAuth', 'Prisma', 'PostgreSQL'],
		year: 2025,
		category: 'ai-ml',
		githubUrl: 'https://github.com/kidus-der/coeus-ai',
		images: ['/projects/coeus/coeus-project-picture.png'],
		featured: true,
		accent: '#7C3AED'
	},
	{
		slug: 'poseidon-wildfire',
		title: 'Poseidon Wildfire',
		description:
			'AWS-powered wildfire detection system, second place at the AWS Generative AI Hackathon.',
		highlights: [
			'Distributed backend on AWS Lambda, S3, and Python achieving real-time data ingestion and processing.',
			'Trained a foundation AI model using AWS Bedrock, refined with labelled training data.',
			'Designed interactive Figma wireframes for a Google Maps "Emergency Mode" feature.',
			'Won second place at the AWS Generative AI Hackathon.'
		],
		tags: ['AWS Lambda', 'AWS S3', 'AWS Bedrock', 'Python'],
		year: 2024,
		category: 'ai-ml',
		githubUrl: 'https://github.com/kidus-der/Poseidon-AWSHackathon',
		images: ['/projects/poseidon/Poseidon-Logo.png'],
		featured: true,
		accent: '#0EA5E9'
	},
	{
		slug: 'elevent',
		title: 'ELEVENT',
		description:
			'Android event management app with real-time Firebase backend and QR code check-in.',
		highlights: [
			'Dynamic Android app in Java and Firebase with real-time database synchronization and analytics.',
			'Frontend UI built with Material UI alongside backend API components.',
			'Automated GitHub Actions for CI/CD and build checking.'
		],
		tags: ['Java', 'Android', 'Firebase', 'Google Maps API'],
		year: 2024,
		category: 'mobile',
		githubUrl: 'https://github.com/kidus-der/Elevent',
		images: [],
		featured: false,
		accent: '#10B981'
	},
	{
		slug: 'flairglow',
		title: 'FlairGlow Probeauty',
		description: 'Full-stack beauty business management platform with role-based access control.',
		highlights: [
			'Full-stack app built with TypeScript, React, and Django, delivering end-to-end beauty business management.',
			'Scalable Django ORM models for up to 3 user roles with granular access controls.',
			'RESTful APIs, containerized with Docker, deployed via CI/CD pipelines on Cybera.'
		],
		tags: ['React', 'TypeScript', 'Django', 'Docker'],
		year: 2024,
		category: 'full-stack',
		images: [],
		featured: false,
		accent: '#EC4899'
	},
	{
		slug: 'port-scanner',
		title: 'Multithreaded Port Scanner',
		description: 'Multithreaded network port scanner with service detection and SYN scans.',
		highlights: [
			'Efficient multithreaded network scanner in Python for services, banners, and SYN scans.',
			'Parallel processing techniques cut scan time by 60%.'
		],
		tags: ['Python', 'Networking', 'Multithreading'],
		year: 2024,
		category: 'systems',
		githubUrl: 'https://github.com/kidus-der/Multithreaded-Network-Port-Scanner',
		images: [],
		featured: false,
		accent: '#64748B'
	},
	{
		slug: 'svm-stock-predictor',
		title: 'SVM Stock Price Predictor',
		description: 'Stock price prediction comparing linear, polynomial, and RBF SVM kernels.',
		highlights: [
			'Implemented Linear, Polynomial, and RBF SVM models for stock price prediction.',
			'Engineered a NumPy-based data processing pipeline for historical stock data.',
			'Built visualization tools comparing prediction accuracy across regression models.'
		],
		tags: ['Python', 'Scikit-learn', 'NumPy'],
		year: 2023,
		category: 'ai-ml',
		githubUrl: 'https://github.com/kidus-der/SVM_stock_price_predictor',
		images: [],
		featured: false,
		accent: '#22C55E'
	}
];

export function featuredProjects(): Project[] {
	return projects
		.filter((project) => project.featured)
		.sort((a, b) => b.year - a.year)
		.slice(0, 3);
}

export function projectsByCategory(category: ProjectCategory | 'all'): Project[] {
	if (category === 'all') return projects;
	return projects.filter((project) => project.category === category);
}
