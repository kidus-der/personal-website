import { describe, it, expect } from 'vitest';
import { jsonLd } from '$lib/utils/jsonLd';

describe('jsonLd', () => {
	it('wraps the payload in an ld+json script tag', () => {
		expect(jsonLd({ '@type': 'Person', name: 'Kidus' })).toBe(
			'<script type="application/ld+json">{"@type":"Person","name":"Kidus"}</script>'
		);
	});

	it('escapes < so a value cannot close the script tag', () => {
		const html = jsonLd({ headline: '</script><img onerror=alert(1)>' });
		expect(html).not.toContain('</script><img');
		expect(html).toContain('\\u003c/script>');
		expect(html.endsWith('</script>')).toBe(true);
	});

	it('drops undefined values, as JSON.stringify does', () => {
		expect(jsonLd({ a: 1, b: undefined })).toContain('{"a":1}');
	});
});
