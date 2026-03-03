// @ts-nocheck
/**
 * Rehype plugin that transforms Obsidian-style callouts into styled divs.
 * Handles: > [!NOTE], > [!TIP], > [!WARNING], > [!DANGER], > [!IMPORTANT]
 *
 * Input:  <blockquote><p>[!NOTE] Some note text</p></blockquote>
 * Output: <div class="callout callout--note">
 *           <div class="callout__title">📝 Note</div>
 *           <div class="callout__body"><p>Some note text</p></div>
 *         </div>
 */
import { visit } from 'unist-util-visit';

/** @type {Record<string, { icon: string; label: string }>} */
const CALLOUT_TYPES = {
	NOTE: { icon: '📝', label: 'Note' },
	TIP: { icon: '💡', label: 'Tip' },
	WARNING: { icon: '⚠️', label: 'Warning' },
	DANGER: { icon: '🚨', label: 'Danger' },
	IMPORTANT: { icon: '❗', label: 'Important' }
};

const CALLOUT_REGEX = /^\[!(NOTE|TIP|WARNING|DANGER|IMPORTANT)\]\s*/i;

export default function rehypeCallouts() {
	return (tree) => {
		visit(tree, 'element', (node, index, parent) => {
			if (node.tagName !== 'blockquote' || !parent || index === undefined) return;

			// Find the first <p> child
			const firstP = node.children?.find(
				(c) => c.type === 'element' && c.tagName === 'p'
			);
			if (!firstP?.children) return;

			// Find the first text node inside the <p>
			const firstText = firstP.children.find((c) => c.type === 'text');
			if (!firstText?.value) return;

			const match = firstText.value.match(CALLOUT_REGEX);
			if (!match) return;

			const type = match[1].toUpperCase();
			const info = CALLOUT_TYPES[type];

			// Strip the [!TYPE] prefix from the first text node
			firstText.value = firstText.value.slice(match[0].length);

			// If first <p> is now empty (only had the marker), remove it from body
			const firstPIsEmpty =
				firstP.children.every((c) => c.type === 'text' && !c.value?.trim()) ||
				firstP.children.length === 0;

			const bodyChildren = firstPIsEmpty
				? (node.children?.slice(1) ?? [])
				: (node.children ?? []);

			// Build the callout replacement node
			const calloutNode = {
				type: 'element',
				tagName: 'div',
				properties: { className: ['callout', `callout--${type.toLowerCase()}`] },
				children: [
					{
						type: 'element',
						tagName: 'div',
						properties: { className: ['callout__title'] },
						children: [{ type: 'text', value: `${info.icon} ${info.label}` }]
					},
					{
						type: 'element',
						tagName: 'div',
						properties: { className: ['callout__body'] },
						children: bodyChildren
					}
				]
			};

			parent.children.splice(index, 1, calloutNode);
		});
	};
}
