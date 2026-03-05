import type { RequestHandler } from './$types';
import { projects } from '$content/projects';
import type { BlogPost } from '$lib/types/content';

const SITE_URL = 'https://kidus.dev';

type SitemapEntry = {
	url: string;
	lastmod?: string;
	changefreq: string;
	priority: string;
};

function renderUrl(entry: SitemapEntry): string {
	return [
		'  <url>',
		`    <loc>${entry.url}</loc>`,
		entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : '',
		`    <changefreq>${entry.changefreq}</changefreq>`,
		`    <priority>${entry.priority}</priority>`,
		'  </url>'
	]
		.filter(Boolean)
		.join('\n');
}

export const GET: RequestHandler = async () => {
	// Load blog posts via import.meta.glob (same pattern as blog/+page.ts)
	const postModules = import.meta.glob('/src/content/posts/*.md', { eager: true });

	const posts: BlogPost[] = Object.entries(postModules)
		.map(([path, module]) => {
			const slug = path.split('/').pop()?.replace('.md', '') ?? '';
			const meta = (module as Record<string, unknown>).metadata as Omit<BlogPost, 'slug'>;
			return { slug, ...meta };
		})
		.filter((p) => !p.draft);

	const staticRoutes: SitemapEntry[] = [
		{ url: SITE_URL, changefreq: 'monthly', priority: '1.0' },
		{ url: `${SITE_URL}/work`, changefreq: 'monthly', priority: '0.8' },
		{ url: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.7' },
		{ url: `${SITE_URL}/blog`, changefreq: 'weekly', priority: '0.8' }
	];

	const projectRoutes: SitemapEntry[] = projects.map((p) => ({
		url: `${SITE_URL}/work/${p.slug}`,
		changefreq: 'monthly',
		priority: '0.6'
	}));

	const postRoutes: SitemapEntry[] = posts.map((p) => ({
		url: `${SITE_URL}/blog/${p.slug}`,
		lastmod: p.updatedAt ?? p.publishedAt,
		changefreq: 'never',
		priority: '0.7'
	}));

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticRoutes, ...projectRoutes, ...postRoutes].map(renderUrl).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};
