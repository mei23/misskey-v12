import * as assert from 'assert';
import { query } from '../../src/prelude/url.js';

describe('url', () => {
	it('query', () => {
		const s = query({
			foo: 'ふぅ',
			bar: 'b a r',
			baz: undefined,
		});
		assert.deepStrictEqual(s, 'foo=%E3%81%B5%E3%81%85&bar=b%20a%20r');
	});
});
