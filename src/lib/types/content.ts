export interface Project {
	slug: string;
	title: string;
	description: string;
	longDescription?: string;
	tags: string[];
	year: number;
	url?: string;
	githubUrl?: string;
	images: string[];
	featured: boolean;
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
}

export interface Experience {
	company: string;
	role: string;
	startDate: string;
	endDate?: string;
	description: string[];
	url?: string;
}

export interface Publication {
	title: string;
	venue: string;
	year: string;
	url: string;
	bullets: string[];
}
