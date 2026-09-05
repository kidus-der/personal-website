/**
 * Geometry for `FlowField.svelte` — the site's one signature background.
 *
 * The curve generator is ported from KokonutUI's `backgrounds/background-paths`
 * (MIT, @dorianbaffier); the sets, the ramps and the view box are ours. Kept in
 * a plain module rather than the component so the maths is unit-testable and so
 * the (fairly expensive) trigonometry runs once per set instead of once per
 * render.
 *
 * Everything here is pure and deterministic — no `Math.random`, so SSR and the
 * client hydrate to identical markup and keys stay stable across re-renders.
 */

export type FlowLayer = 'primary' | 'secondary';

/** `bold` for the home hero; `soft` for the About bio, the blog masthead, 404. */
export type FlowIntensity = 'bold' | 'soft';

export interface FlowPath {
	/** Stable, deterministic key: `${layer}-${position}-${index}`. */
	readonly id: string;
	readonly layer: FlowLayer;
	/** SVG path `d` attribute. */
	readonly d: string;
	/**
	 * Position in its own set, 0 at the faintest and 1 at the boldest. The
	 * component turns this into a stroke opacity through CSS variables, so the
	 * light and dark ramps are one declaration each rather than two sets of
	 * numbers baked in here.
	 */
	readonly t: number;
	/** Stroke width in CSS pixels — the paths carry `non-scaling-stroke`. */
	readonly width: number;
	/** Period of one drift loop, in seconds. */
	readonly duration: number;
}

export interface FlowSets {
	readonly primary: FlowPath[];
	readonly secondary: FlowPath[];
}

/**
 * The field is drawn twice, mirrored across the Y axis. The two halves cross in
 * the middle of the view box, which is what makes it read as a weave rather than
 * as a comb.
 */
export const FLOW_MIRRORS = [1, -1] as const;

/**
 * How many paths each layer draws per mirrored half.
 *
 * Bold is 36 paths in all, which is the number the animation budget in
 * `tests/e2e/perf.spec.ts` is written against. Soft is 24, for the pages where
 * the field sits behind reading copy rather than behind a headline.
 */
export const PATH_COUNTS = {
	bold: { primary: 10, secondary: 8 },
	soft: { primary: 7, secondary: 5 }
} as const satisfies Record<FlowIntensity, Record<FlowLayer, number>>;

/** Per-layer curve shape and drift speed. */
const LAYER_CONFIG = {
	primary: { baseAmplitude: 150, segments: 10, duration: 28 },
	secondary: { baseAmplitude: 100, segments: 8, duration: 18 }
} as const satisfies Record<
	FlowLayer,
	{ baseAmplitude: number; segments: number; duration: number }
>;

/** Thinnest and thickest stroke in the ramp, in CSS pixels. */
export const STROKE_WIDTH = [1.5, 4.5] as const;

/**
 * The window onto the curves.
 *
 * The generator sweeps x from ±2400 to ∓2400 and y from 800 down past −800, far
 * outside anything drawn: only the middle of each curve is ever on screen, which
 * is what makes the drift read as a current passing through rather than as a
 * loop. This box is centred on the crossing point of the two mirrored halves and
 * is wide enough that every line runs the full width of the hero — the whole
 * hero, not one column. Paired with `preserveAspectRatio="none"` it stretches to
 * whatever box the field is given.
 */
export const FLOW_VIEW_BOX = '-820 -330 1640 780';

/** The path sweeps far outside the view box; that overshoot is intentional. */
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
 * @param layer    Selects amplitude and segment count.
 */
export function generateAestheticPath(index: number, position: number, layer: FlowLayer): string {
	const { baseAmplitude, segments } = LAYER_CONFIG[layer];
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

function buildLayer(layer: FlowLayer, intensity: FlowIntensity): FlowPath[] {
	// Widened deliberately: the literal counts below make the one-path guard look
	// unreachable to the compiler, and that guard is about the function being
	// correct for any count, not about the two we happen to ship.
	const count: number = PATH_COUNTS[intensity][layer];
	const { duration } = LAYER_CONFIG[layer];
	const [thin, thick] = STROKE_WIDTH;

	return FLOW_MIRRORS.flatMap((position) =>
		Array.from({ length: count }, (_, index) => {
			// A one-path set would divide by zero; it also has no ramp to be at the
			// bottom of, so it sits at the top.
			const t = count === 1 ? 1 : index / (count - 1);
			return {
				id: `${layer}-${position}-${index}`,
				layer,
				d: generateAestheticPath(index, position, layer),
				t,
				width: thin + (thick - thin) * t,
				duration
			};
		})
	);
}

/** Both layers, both mirrors: 36 paths at `bold`, 24 at `soft`. */
export function buildFlowField(intensity: FlowIntensity): FlowSets {
	return {
		primary: buildLayer('primary', intensity),
		secondary: buildLayer('secondary', intensity)
	};
}

/** How many paths `buildFlowField` will produce. */
export function flowPathCount(intensity: FlowIntensity): number {
	const counts = PATH_COUNTS[intensity];
	return (counts.primary + counts.secondary) * FLOW_MIRRORS.length;
}
