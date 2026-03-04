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
		images: ['/coeus/coeus-project-picture.png'],
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
		githubUrl: 'https://github.com/kidus-der/Elevent',
		images: [],
		featured: true
	},
	{
		slug: 'poseidon-wildfire',
		title: 'Poseidon Wildfire Solution',
		description: 'AWS-powered wildfire detection system — 2nd place at the AWS Generative AI Hackathon.',
		longDescription:
			'Serverless wildfire detection pipeline built on AWS Lambda, S3, and Bedrock. Ingests satellite imagery, runs generative AI analysis to identify fire risk zones, and delivers real-time alerts. Placed 2nd at the AWS Generative AI Hackathon.',
		tags: ['AWS Lambda', 'AWS S3', 'AWS Bedrock', 'Python'],
		year: 2024,
		githubUrl: 'https://github.com/kidus-der/Poseidon-AWSHackathon',
		images: ['/poseidon/Poseidon-Logo.png'],
		featured: false
	}
];
