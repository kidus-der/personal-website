import { describe, it, expect } from 'vitest';
import { site } from '$content/site';

describe('site', () => {
	it('has the expected identity fields', () => {
		expect(site.name).toBe('Kidus Dereje Zewde');
		expect(site.shortName).toBe('Kidus');
		expect(site.url).toBe('https://kidusder.com');
		expect(site.email).toBe('kidusdereje41@gmail.com');
		expect(site.tagline).toBe('I build intelligent systems that reason and act.');
	});

	it('has the expected socials', () => {
		expect(site.socials).toEqual({
			github: 'https://github.com/kidus-der',
			linkedin: 'https://www.linkedin.com/in/kidus-dereje-zewde-804424241/',
			scholar: 'https://scholar.google.com/citations?hl=en&user=t-5ck6wAAAAJ'
		});
	});
});
