import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_SEGMENT_ID, SUBSCRIBE_HMAC_SECRET } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/server/hmac';

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	const result = await verifyToken(token, SUBSCRIBE_HMAC_SECRET);

	if (!result) {
		redirect(302, '/blog?error=expired');
	}

	const resend = new Resend(RESEND_API_KEY);
	// Contacts are now global in Resend — no audienceId needed.
	// We add the contact to our segment so they receive broadcasts.
	await resend.contacts.create({
		email: result.email,
		unsubscribed: false,
		segments: [{ id: RESEND_SEGMENT_ID }]
	});

	redirect(302, '/blog?subscribed=1');
};
