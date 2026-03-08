import { Resend, type CreateBroadcastOptions } from 'resend';
import { RESEND_API_KEY, RESEND_SEGMENT_ID, ADMIN_SECRET } from '$env/static/private';
import { PUBLIC_SITE_URL } from '$env/static/public';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { BlogPost } from '$lib/types/content';
import { buildNewPostEmail } from '$lib/server/emailTemplates';

export const POST: RequestHandler = async ({ request }) => {
	// Verify bearer token with timing-safe comparison
	const authHeader = request.headers.get('Authorization') ?? '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

	const secretBytes = new TextEncoder().encode(ADMIN_SECRET);
	const tokenBytes = new TextEncoder().encode(token);

	let authorized = false;
	if (secretBytes.length === tokenBytes.length) {
		// Timing-safe comparison using crypto.subtle
		const secretKey = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
		const [sigA, sigB] = await Promise.all([
			crypto.subtle.sign('HMAC', secretKey, secretBytes),
			crypto.subtle.sign('HMAC', secretKey, tokenBytes)
		]);
		const a = new Uint8Array(sigA);
		const b = new Uint8Array(sigB);
		authorized = a.every((byte, i) => byte === b[i]);
	}

	if (!authorized) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { postSlug } = await request.json();
	if (!postSlug || typeof postSlug !== 'string') {
		return json({ error: 'postSlug is required' }, { status: 400 });
	}

	// Load post metadata from mdsvex glob
	const postModules = import.meta.glob('/src/content/posts/*.md', { eager: true });
	const matchEntry = Object.entries(postModules).find(([path]) => {
		const slug = path.split('/').pop()?.replace('.md', '');
		return slug === postSlug;
	});

	if (!matchEntry) {
		return json({ error: `Post "${postSlug}" not found` }, { status: 404 });
	}

	const meta = (matchEntry[1] as Record<string, unknown>).metadata as Omit<BlogPost, 'slug'>;
	const post: BlogPost = { slug: postSlug, ...meta };

	const html = buildNewPostEmail(post, PUBLIC_SITE_URL);

	const resend = new Resend(RESEND_API_KEY);

	// Create broadcast (cast needed: Resend's RequireAtLeastOne<EmailRenderOptions> union confuses TS
	// when providing html without react, even though html satisfies the constraint at runtime)
	const { data: broadcast, error: createError } = await resend.broadcasts.create({
		segmentId: RESEND_SEGMENT_ID,
		name: `New post: ${post.title}`,
		from: 'The Buna Print <hello@kidusder.com>',
		subject: post.title,
		html
	} as unknown as CreateBroadcastOptions);

	if (createError || !broadcast) {
		return json({ error: 'Failed to create broadcast', detail: createError }, { status: 500 });
	}

	// Send broadcast
	const { error: sendError } = await resend.broadcasts.send(broadcast.id);
	if (sendError) {
		return json({ error: 'Failed to send broadcast', detail: sendError }, { status: 500 });
	}

	return json({ success: true, broadcastId: broadcast.id });
};
