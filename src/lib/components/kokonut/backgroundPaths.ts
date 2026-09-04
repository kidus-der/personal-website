/**
 * Geometry for `BackgroundPaths.svelte`.
 *
 * Ported from KokonutUI's `backgrounds/background-paths` (MIT, @dorianbaffier).
 * Kept in a plain module rather than the component so the maths is unit-testable
 * and so the (fairly expensive) trigonometry runs once per position instead of
 * once per render.
 *
 * Everything here is pure and deterministic — no `Math.random`, so SSR and the
 * client hydrate to identical markup and keys stay stable across re-renders.
 */

export type PathType = 'primary' | 'secondary' | 'accent';

export interface AestheticPath {
	/** Stable, deterministic key: `${type}-${position}-${index}`. */
	readonly id: string;
	/** SVG path `d` attribute. */
	readonly d: string;
	/** Base stroke opacity for this path. */
	readonly opacity: number;
	/** Stroke width in user units. */
	readonly width: number;
	/** Loop duration in seconds for the draw-in animation. */
	readonly duration: number;
}

export interface PathSets {
	readonly primary: AestheticPath[];
	readonly secondary: AestheticPath[];
	readonly accent: AestheticPath[];
}

/** Per-type constants, straight from the original component. */
const TYPE_CONFIG = {
	primary: { baseAmplitude: 150, segments: 10 },
	secondary: { baseAmplitude: 100, segments: 8 },
	accent: { baseAmplitude: 60, segments: 6 }
} as const satisfies Record<PathType, { baseAmplitude: number; segments: number }>;

/** Set-level constants: how many paths and how their opacity/width/speed ramp. */
const SET_CONFIG = {
	primary: { count: 12, opacity: [0.15, 0.02], width: [4, 0.3], duration: 25 },
	secondary: { count: 15, opacity: [0.12, 0.015], width: [3, 0.25], duration: 20 },
	accent: { count: 10, opacity: [0.08, 0.12], width: [2, 0.2], duration: 15 }
} as const satisfies Record<
	PathType,
	{
		count: number;
		opacity: readonly [number, number];
		width: readonly [number, number];
		duration: number;
	}
>;

/** The path sweeps far outside the viewBox; that overshoot is intentional. */
const START_X = 2400;
const START_Y = 800;
const END_X = -2400;
const END_Y_BASE = -800;
const END_Y_STEP = 25;
/** Bezier control-point placement between consecutive sample points. */
const TENSION = 0.4;

/**
 * Build one flowing path.
 *
 * @param index    Path index within its set — shifts the wave phase and end Y.
 * @param position `1` or `-1`; `-1` mirrors the path across the Y axis.
 * @param type     Selects amplitude and segment count.
 */
export function generateAestheticPath(index: number, position: number, type: PathType): string {
	const { baseAmplitude, segments } = TYPE_CONFIG[type];
	const phase = index * 0.2;
	const endY = END_Y_BASE + index * END_Y_STEP;

	const points: { x: number; y: number }[] = [];
	for (let i = 0; i <= segments; i++) {
		const progress = i / segments;
		// Ease-out quad: samples bunch up toward the end of the sweep.
		const eased = 1 - (1 - progress) ** 2;
		const baseX = START_X + (END_X - START_X) * eased;
		const baseY = START_Y + (endY - START_Y) * eased;
		const amplitudeFactor = 1 - eased * 0.3;
		const wave1 =
			Math.sin(progress * Math.PI * 3 + phase) * (baseAmplitude * 0.7 * amplitudeFactor);
		const wave2 =
			Math.cos(progress * Math.PI * 4 + phase) * (baseAmplitude * 0.3 * amplitudeFactor);
		const wave3 =
			Math.sin(progress * Math.PI * 2 + phase) * (baseAmplitude * 0.2 * amplitudeFactor);
		points.push({ x: baseX * position, y: baseY + wave1 + wave2 + wave3 });
	}

	return points
		.map((point, i) => {
			if (i === 0) return `M ${point.x} ${point.y}`;
			const prev = points[i - 1];
			const cp1x = prev.x + (point.x - prev.x) * TENSION;
			const cp2x = prev.x + (point.x - prev.x) * (1 - TENSION);
			return `C ${cp1x} ${prev.y}, ${cp2x} ${point.y}, ${point.x} ${point.y}`;
		})
		.join(' ');
}

function buildSet(type: PathType, position: number): AestheticPath[] {
	const { count, opacity, width, duration } = SET_CONFIG[type];
	return Array.from({ length: count }, (_, i) => ({
		id: `${type}-${position}-${i}`,
		d: generateAestheticPath(i, position, type),
		// Accent ramps fast enough to overshoot; the original caps it at full.
		opacity: Math.min(1, opacity[0] + i * opacity[1]),
		width: width[0] + i * width[1],
		duration
	}));
}

/** All three path sets for one mirror half. 37 paths per call. */
export function buildPathSets(position: number): PathSets {
	return {
		primary: buildSet('primary', position),
		secondary: buildSet('secondary', position),
		accent: buildSet('accent', position)
	};
}
