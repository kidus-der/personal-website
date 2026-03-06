import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { name, email, subject, message } = await request.json();

	if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
		return json({ error: 'All fields are required.' }, { status: 400 });
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ error: 'Invalid email address.' }, { status: 400 });
	}

	const resend = new Resend(RESEND_API_KEY);
	const { error } = await resend.emails.send({
		from: 'Contact Form <onboarding@resend.dev>',
		to: ['kidusdereje41@gmail.com'],
		replyTo: email,
		subject: `[kidus.dev] ${subject}`,
		html: `
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <p>${message.replace(/\n/g, '<br>')}</p>
    `
	});

	if (error) return json({ error: 'Failed to send. Please try again.' }, { status: 500 });
	return json({ success: true });
};
