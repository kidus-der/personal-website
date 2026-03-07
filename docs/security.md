# Security

Reference for the security measures in place on this site. Covers HTTP headers, API endpoint hardening, and environment variable management.

---

## HTTP Security Headers

**File:** `vercel.json` (project root)

Applied globally to all routes via Vercel's `headers` configuration:

| Header | Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Prevents the site from being embedded in an `<iframe>` — mitigates clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from MIME-sniffing responses away from the declared `Content-Type` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends the full URL as referrer for same-origin requests; only the origin for cross-origin; nothing for downgrade (HTTPS → HTTP) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Explicitly disables access to camera, microphone, and geolocation APIs |

HTTPS / HSTS is handled automatically by Vercel — no manual configuration needed.

---

## Contact Form API — `/api/contact`

**File:** `src/routes/api/contact/+server.ts`

Three layers of hardening on the only server-side POST endpoint:

### 1. Rate limiting

```ts
const RATE_LIMIT = 3;       // max submissions
const RATE_WINDOW_MS = 15 * 60 * 1000;  // per 15-minute window
```

IP address is obtained from SvelteKit's `getClientAddress()`. Each IP is tracked in an in-memory `Map`. On limit breach, the endpoint returns `429` before any validation or Resend call.

**Note:** This is an in-memory rate limiter — state does not persist across Vercel function cold starts or scale-out. For a personal site's contact form this provides meaningful protection against casual abuse without requiring external infrastructure (Redis, Upstash, etc.). If spam becomes a problem, upgrade to Upstash Rate Limit.

### 2. Server-side validation

All four fields (name, email, subject, message) are checked for presence and non-empty after trimming. Email format is validated with a regex. Returns `400` with a descriptive error message on failure. Client-side validation is UX-only — the server is the authoritative gate.

### 3. HTML escaping

All user-supplied fields are passed through `escapeHtml()` before interpolation into the HTML email template:

```ts
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

This prevents HTML injection in the received email (e.g. hidden `<img>` tags, misleading formatting, phishing-style layout tricks). It does not affect the site itself — the email is rendered only in your Gmail inbox.

---

## Environment Variables

### What must stay server-side

| Variable | Used in | Risk if leaked |
|---|---|---|
| `RESEND_API_KEY` | `src/routes/api/contact/+server.ts` | Anyone could send emails from your Resend account |
| Destination email | Hardcoded in `+server.ts` | Spam targeting; currently not an env var |

Both are accessed via `$env/static/private` (SvelteKit built-in). SvelteKit statically analyzes imports from this module and **never bundles them into client JS**. This is enforced at build time — if you accidentally import from `$env/static/private` in a file that runs client-side, the build fails.

### Verifying the client bundle

After any change to the API route, verify the email address is absent from the client bundle:

```bash
pnpm build
grep -r "kidusdereje41" .svelte-kit/output/client/
# Should output nothing
```

### Local development

```bash
# .env.local (gitignored — never commit this file)
RESEND_API_KEY=re_your_key_here
PUBLIC_SITE_URL=https://kidus.dev
```

### Production (Vercel)

Add `RESEND_API_KEY` in **Vercel project → Settings → Environment Variables** for Production, Preview, and Development environments. Vercel injects it at build time — no code change needed.

---

## What is NOT a concern for this site

| Attack | Why not applicable |
|---|---|
| SQL injection | No database |
| Session hijacking | No authentication, no sessions |
| Stored XSS | No user-generated content rendered on pages |
| CSRF | JSON-body API endpoints; browser CORS prevents cross-origin reads; no cookies involved |
| Dependency supply chain | Worth periodic `pnpm audit` but not a blocking concern |
