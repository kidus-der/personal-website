const SEPARATOR = ':';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function base64urlEncode(buf: Uint8Array): string {
	return btoa(String.fromCharCode(...buf))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

function base64urlDecode(str: string): Uint8Array<ArrayBuffer> {
	const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(base64);
	const arr = new Uint8Array(new ArrayBuffer(binary.length));
	for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
	return arr;
}

async function getKey(secret: string): Promise<CryptoKey> {
	const keyData = new TextEncoder().encode(secret);
	return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign',
		'verify'
	]);
}

export async function signToken(email: string, secret: string): Promise<string> {
	const encodedEmail = base64urlEncode(new TextEncoder().encode(email));
	const timestamp = Date.now().toString();
	const message = `${encodedEmail}${SEPARATOR}${timestamp}`;

	const key = await getKey(secret);
	const signatureBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
	const signature = base64urlEncode(new Uint8Array(signatureBuf));

	return `${message}${SEPARATOR}${signature}`;
}

export async function verifyToken(
	token: string,
	secret: string
): Promise<{ email: string } | null> {
	const parts = token.split(SEPARATOR);
	if (parts.length !== 3) return null;

	const [encodedEmail, timestamp, signature] = parts;
	const message = `${encodedEmail}${SEPARATOR}${timestamp}`;

	// Check expiry
	const ts = parseInt(timestamp, 10);
	if (isNaN(ts) || Date.now() - ts > TOKEN_TTL_MS) return null;

	// Verify signature
	const key = await getKey(secret);
	const sigBytes = base64urlDecode(signature);
	const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(message));
	if (!valid) return null;

	const emailBytes = base64urlDecode(encodedEmail);
	const email = new TextDecoder().decode(emailBytes);
	return { email };
}
