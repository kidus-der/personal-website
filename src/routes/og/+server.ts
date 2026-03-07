import { ImageResponse } from '@vercel/og';
import { createElement as h } from 'react';
import type { RequestHandler } from './$types';

const ACCENT = '#F05924';
const BG = '#111111';
const TEXT = '#f0f0f0';
const MUTED = '#888888';
const ACCENT_DIM = 'rgba(240,89,36,0.15)';

// Cache fonts across requests (warm function instances reuse module scope)
let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

async function loadFonts(origin: string) {
	if (fontCache) return fontCache;
	const [regular, bold] = await Promise.all([
		fetch(`${origin}/fonts/inter-regular.woff`).then((r) => r.arrayBuffer()),
		fetch(`${origin}/fonts/inter-bold.woff`).then((r) => r.arrayBuffer())
	]);
	fontCache = { regular, bold };
	return fontCache;
}

export const GET: RequestHandler = async ({ url }) => {
	const title = url.searchParams.get('title') ?? 'Kidus Dereje';
	const description = url.searchParams.get('description') ?? '';
	const type = url.searchParams.get('type') ?? 'website';
	const tagsStr = url.searchParams.get('tags') ?? '';
	const tags = tagsStr ? tagsStr.split(',').filter(Boolean) : [];

	const { regular, bold } = await loadFonts(url.origin);

	const titleFontSize = title.length > 55 ? '48px' : title.length > 35 ? '56px' : '64px';

	const card = h(
		'div',
		{
			style: {
				display: 'flex',
				width: '1200px',
				height: '630px',
				backgroundColor: BG,
				position: 'relative',
				fontFamily: 'Inter'
			}
		},
		// Orange accent bar — left edge
		h('div', {
			style: {
				position: 'absolute',
				left: 0,
				top: 0,
				bottom: 0,
				width: '5px',
				backgroundColor: ACCENT
			}
		}),
		// Main content column
		h(
			'div',
			{
				style: {
					display: 'flex',
					flexDirection: 'column',
					padding: '56px 72px 56px 84px',
					flex: 1
				}
			},
			// Top row: domain + article badge
			h(
				'div',
				{
					style: {
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center'
					}
				},
				h('span', { style: { color: MUTED, fontSize: '20px', fontWeight: 400 } }, 'kidusder.com'),
				type === 'article'
					? h(
							'span',
							{
								style: {
									color: ACCENT,
									fontSize: '15px',
									fontWeight: 400,
									border: `1px solid ${ACCENT}`,
									padding: '4px 14px',
									borderRadius: '9999px',
									letterSpacing: '0.05em',
									textTransform: 'uppercase'
								}
							},
							'article'
						)
					: null
			),
			// Spacer
			h('div', { style: { flex: 1 } }),
			// Bottom block: title + description + tags
			h(
				'div',
				{ style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
				// Title
				h(
					'div',
					{
						style: {
							color: TEXT,
							fontSize: titleFontSize,
							fontWeight: 700,
							lineHeight: 1.1,
							letterSpacing: '-0.02em'
						}
					},
					title
				),
				// Description (capped to 2 lines)
				description
					? h(
							'div',
							{
								style: {
									color: MUTED,
									fontSize: '22px',
									fontWeight: 400,
									lineHeight: 1.4,
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden'
								}
							},
							description
						)
					: null,
				// Tags
				tags.length > 0
					? h(
							'div',
							{ style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' } },
							...tags.slice(0, 5).map((tag) =>
								h(
									'span',
									{
										key: tag,
										style: {
											color: ACCENT,
											fontSize: '17px',
											fontWeight: 400,
											backgroundColor: ACCENT_DIM,
											padding: '4px 14px',
											borderRadius: '9999px'
										}
									},
									tag
								)
							)
						)
					: null
			)
		)
	);

	return new ImageResponse(card, {
		width: 1200,
		height: 630,
		fonts: [
			{ name: 'Inter', data: regular, weight: 400, style: 'normal' },
			{ name: 'Inter', data: bold, weight: 700, style: 'normal' }
		]
	}) as unknown as Response;
};
