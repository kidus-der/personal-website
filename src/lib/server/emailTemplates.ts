const DARK_BG = '#0a0a0a';
const ACCENT = '#F05924';
const TEXT = '#f0f0f0';
const TEXT_MUTED = 'rgba(240,240,240,0.65)';
const SURFACE = '#141414';
const BORDER = 'rgba(255,255,255,0.1)';

export function buildConfirmationEmail(confirmUrl: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your subscription</title>
</head>
<body style="margin:0;padding:0;background:${DARK_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${DARK_BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${SURFACE};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 24px;border-bottom:1px solid ${BORDER};">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${ACCENT};font-weight:600;">The Buna Print</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:${TEXT};line-height:1.3;">
                One click to confirm.
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:${TEXT_MUTED};line-height:1.7;">
                You asked to be notified when a new post drops on The Buna Print. Click below to confirm — you won't hear from us unless there's something worth reading.
              </p>
              <a href="${confirmUrl}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.02em;padding:12px 28px;border-radius:9999px;">
                Yes, subscribe me &rarr;
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid ${BORDER};">
              <p style="margin:0;font-size:12px;color:${TEXT_MUTED};line-height:1.6;">
                If you didn't request this, you can safely ignore this email. The link expires in 24 hours.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

interface PostMeta {
	title: string;
	description: string;
	slug: string;
	coverImage?: string;
	readingTime?: number;
}

export function buildNewPostEmail(post: PostMeta, siteUrl: string): string {
	const postUrl = `${siteUrl}/blog/${post.slug}`;

	const coverSection = post.coverImage
		? `<tr>
            <td style="padding:0;">
              <img src="${post.coverImage}" alt="" width="100%" style="display:block;max-height:240px;object-fit:cover;">
            </td>
          </tr>`
		: '';

	const readingTimePart = post.readingTime ? `&nbsp;&middot;&nbsp;${post.readingTime} min read` : '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
</head>
<body style="margin:0;padding:0;background:${DARK_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${DARK_BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${SURFACE};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 36px 20px;border-bottom:1px solid ${BORDER};">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${ACCENT};font-weight:600;">The Buna Print</p>
            </td>
          </tr>
          ${coverSection}
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px 28px;">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT_MUTED};">New post${readingTimePart}</p>
              <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;letter-spacing:-0.02em;color:${TEXT};line-height:1.25;">
                ${post.title}
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:${TEXT_MUTED};line-height:1.7;">
                ${post.description}
              </p>
              <a href="${postUrl}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.02em;padding:12px 28px;border-radius:9999px;">
                Read the post &rarr;
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid ${BORDER};">
              <p style="margin:0;font-size:12px;color:${TEXT_MUTED};line-height:1.6;">
                You're receiving this because you subscribed at <a href="${siteUrl}" style="color:${ACCENT};text-decoration:none;">kidusder.com</a>.
                <br>
                <a href="{{unsubscribe_url}}" style="color:${TEXT_MUTED};text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
