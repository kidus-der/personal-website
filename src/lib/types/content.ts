export type ProjectCategory = 'ai-ml' | 'full-stack' | 'systems' | 'mobile';

export interface Project {
	slug: string;
	title: string;
	description: string;
	/** Optional longer copy for the project detail page; falls back to `description`. */
	longDescription?: string;
	highlights: string[];
	tags: string[];
	year: number;
	category: ProjectCategory;
	url?: string;
	githubUrl?: string;
	images: string[];
	featured: boolean;
	/** Hex accent color used for gradient/monogram placeholders and UI highlights. */
	accent?: string;
}

export interface BlogPost {
	slug: string;
	title: string;
	description: string;
	publishedAt: string;
	updatedAt?: string;
	tags: string[];
	readingTime?: number;
	draft?: boolean;
	coverImage?: string;
}

export interface Experience {
	company: string;
	role: string;
	location?: string;
	period: {
		start: string;
		end: string | 'Present';
	};
	url?: string;
	bullets: string[];
}

export type PublicationTopic =
	| 'deepfake'
	| 'documents'
	| 'llm-eval'
	| 'dataset'
	| 'audio'
	| 'benchmark'
	| 'behavioral';

export interface Publication {
	/** arXiv id, e.g. '2608.24127' */
	id: string;
	title: string;
	venue: 'arXiv' | 'ACM';
	year: number;
	url: string;
	officialUrl?: string;
	topics: PublicationTopic[];
	bullets: string[];
}

export interface SkillGroup {
	name: string;
	items: string[];
}

export interface RadarScore {
	key: string;
	label: string;
	value: number;
}

export interface Education {
	degree: string;
	school: string;
	detail?: string;
	graduation: string;
}
