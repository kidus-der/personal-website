import { Resend } from 'resend';
import { RESEND_API_KEY, SUBSCRIBE_HMAC_SECRET } from '$env/static/private';
import { PUBLIC_SITE_URL } from '$env/static/public';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createRateLimiter } from '$lib/server/rateLimit';
import { EMAIL_REGEX } from '$lib/server/validation';
import { signToken } from '$lib/server/hmac';
import { buildConfirmationEmail } from '$lib/server/emailTemplates';

// 2 subscribe attempts per IP per hour
const checkRateLimit = createRateLimiter(2, 60 * 60 * 1000);

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const body = await request.json();

	// Honeypot: silent success if the hidden field is filled
	if (body.website) {
		return json({ success: true, message: 'Check your inbox for a confirmation link.' });
	}

	const ip = getClientAddress();
	if (!checkRateLimit(ip)) {
		return json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 });
	}

	const email: string = body.email?.trim() ?? '';
	if (!email || !EMAIL_REGEX.test(email)) {
		return json({ error: 'Please enter a valid email address.' }, { status: 400 });
	}

	const token = await signToken(email, SUBSCRIBE_HMAC_SECRET);
	const confirmUrl = `${PUBLIC_SITE_URL}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;

	const resend = new Resend(RESEND_API_KEY);
	const { error } = await resend.emails.send({
		from: 'The Buna Print <hello@kidusder.com>',
		to: [email],
		subject: 'Confirm your subscription to The Buna Print',
		html: buildConfirmationEmail(confirmUrl)
	});

	if (error) return json({ error: 'Failed to send confirmation. Please try again.' }, { status: 500 });
	return json({ success: true, message: 'Check your inbox for a confirmation link.' });
};
