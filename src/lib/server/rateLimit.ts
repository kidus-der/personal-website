interface RateLimitEntry {
	count: number;
	resetAt: number;
}

export function createRateLimiter(limit: number, windowMs: number) {
	const map = new Map<string, RateLimitEntry>();

	return function checkRateLimit(ip: string): boolean {
		const now = Date.now();
		const entry = map.get(ip);
		if (!entry || now > entry.resetAt) {
			map.set(ip, { count: 1, resetAt: now + windowMs });
			return true;
		}
		if (entry.count >= limit) return false;
		entry.count++;
		return true;
	};
}
