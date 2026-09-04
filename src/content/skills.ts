import type { SkillGroup, RadarScore } from '$lib/types/content';

export const skillGroups: SkillGroup[] = [
	{
		name: 'Languages',
		items: ['Python', 'C', 'JavaScript', 'TypeScript', 'Java', 'SQL', 'Julia', 'R']
	},
	{
		name: 'Frameworks & tools',
		items: [
			'Next.js',
			'React',
			'Django',
			'FastAPI',
			'Flask',
			'Tailwind CSS',
			'AWS (S3, Lambda, Bedrock, DynamoDB, CloudFront)',
			'Docker',
			'Kubernetes',
			'Git'
		]
	},
	{
		name: 'ML & data',
		items: ['PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy', 'Seaborn', 'Power BI']
	},
	{
		name: 'Databases',
		items: ['PostgreSQL', 'MongoDB', 'Cassandra', 'Prisma ORM']
	},
	{
		name: 'Dev & testing',
		items: [
			'Jenkins',
			'RESTful API design',
			'Agile methodologies',
			'Data visualization (R, Python)',
			'Jest',
			'Pytest',
			'Postman',
			'Selenium'
		]
	}
];

export const radarScores: RadarScore[] = [
	{ key: 'ml-research', label: 'ML & research', value: 92 },
	{ key: 'backend-apis', label: 'Backend & APIs', value: 85 },
	{ key: 'cloud-infra', label: 'Cloud & infra', value: 72 },
	{ key: 'frontend', label: 'Frontend', value: 70 },
	{ key: 'data-engineering', label: 'Data engineering', value: 78 },
	{ key: 'security-forensics', label: 'Security & forensics', value: 80 }
];
