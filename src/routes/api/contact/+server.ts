import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// In-memory rate limiter: 3 submissions per IP per 15 minutes.
// Resets per serverless instance — sufficient protection for a personal site.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const entry = rateLimitMap.get(ip);
	if (!entry || now > entry.resetAt) {
		rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
		return true;
	}
	if (entry.count >= RATE_LIMIT) return false;
	entry.count++;
	return true;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;');
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	if (!checkRateLimit(ip)) {
		return json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 });
	}

	const { name, email, subject, message } = await request.json();

	if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
		return json({ error: 'All fields are required.' }, { status: 400 });
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ error: 'Invalid email address.' }, { status: 400 });
	}

	const safeName = escapeHtml(name.trim());
	const safeEmail = escapeHtml(email.trim());
	const safeSubject = escapeHtml(subject.trim());
	const safeMessage = escapeHtml(message.trim()).replace(/\n/g, '<br>');

	const resend = new Resend(RESEND_API_KEY);
	const { error } = await resend.emails.send({
		from: 'Contact Form <onboarding@resend.dev>',
		to: ['kidusdereje41@gmail.com'],
		replyTo: email.trim(),
		subject: `[kidusder.com] ${safeSubject}`,
		html: `
      <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <hr />
      <p>${safeMessage}</p>
    `
	});

	if (error) return json({ error: 'Failed to send. Please try again.' }, { status: 500 });
	return json({ success: true });
};
