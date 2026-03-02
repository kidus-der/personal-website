/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/** Map a value from one range to another */
export function mapRange(
	value: number,
	inMin: number,
	inMax: number,
	outMin: number,
	outMax: number
): number {
	return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/** Normalize a value to 0–1 range */
export function normalize(value: number, min: number, max: number): number {
	return (value - min) / (max - min);
}
