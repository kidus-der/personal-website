// Ambient module declarations for Vanta.js dist files (no bundled types)
declare module 'vanta/dist/vanta.globe.min' {
	const GLOBE: (options: Record<string, unknown>) => { destroy: () => void };
	export default GLOBE;
}

declare module 'vanta/dist/vanta.net.min' {
	const NET: (options: Record<string, unknown>) => { destroy: () => void };
	export default NET;
}
