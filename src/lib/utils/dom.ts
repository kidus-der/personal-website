/** Get element's bounding rect relative to the document */
export function getBounds(el: Element): DOMRect {
	return el.getBoundingClientRect();
}

/** Get all sibling elements of a given element */
export function getSiblings(el: Element): Element[] {
	if (!el.parentElement) return [];
	return Array.from(el.parentElement.children).filter((child) => child !== el);
}

/** Check if an element is in the viewport */
export function isInViewport(el: Element, threshold = 0): boolean {
	const rect = el.getBoundingClientRect();
	return (
		rect.top < window.innerHeight - threshold &&
		rect.bottom > threshold &&
		rect.left < window.innerWidth - threshold &&
		rect.right > threshold
	);
}

/** Wrap each word in an element with a span.word */
export function wrapWords(el: HTMLElement): HTMLSpanElement[] {
	const text = el.textContent || '';
	const words = text.trim().split(/\s+/);
	el.innerHTML = words
		.map((w) => `<span class="word" style="display:inline-block;overflow:hidden"><span class="word-inner" style="display:inline-block">${w}</span></span>`)
		.join(' ');
	return Array.from(el.querySelectorAll('.word-inner')) as HTMLSpanElement[];
}
