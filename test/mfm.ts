/*
 * Tests of MFM
 *
 * How to run the tests:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/mfm.ts --require ts-node/register
 *
 * To specify test:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/mfm.ts --require ts-node/register -g 'test name'
 */

import * as assert from 'assert';
import * as mfm from 'mfm-js';

import { toHtml } from '../src/mfm/to-html';
import { fromHtml } from '../src/mfm/from-html';

describe('toHtml', () => {
	it('br', () => {
		const input = 'foo\nbar\nbaz';
		const output = '<p><span>foo<br>bar<br>baz</span></p>';
		assert.equal(toHtml(mfm.parse(input)), output);
	});

	it('br alt', () => {
		const input = 'foo\r\nbar\rbaz';
		const output = '<p><span>foo<br>bar<br>baz</span></p>';
		assert.equal(toHtml(mfm.parse(input)), output);
	});
});

describe('fromHtml', () => {
	it('br', () => {
		assert.deepStrictEqual(fromHtml('<p>abc<br><br/>d</p>'), 'abc\n\nd');
	});

	it('link with different text', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/b">c</a> d</p>'), 'a [c](https://example.com/b) d');
	});

	it('link with different text, but not encoded', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/ä">c</a> d</p>'), 'a [c](<https://example.com/ä>) d');
	});

	it('link with same text', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/b">https://example.com/b</a> d</p>'), 'a https://example.com/b d');
	});

	it('link with same text, but not encoded', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/ä">https://example.com/ä</a> d</p>'), 'a <https://example.com/ä> d');
	});

	it('link with no url', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="b">c</a> d</p>'), 'a [c](b) d');
	});

	it('link without href', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a>c</a> d</p>'), 'a c d');
	});

	it('link without text', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/b"></a> d</p>'), 'a https://example.com/b d');
	});

	it('link without both', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a></a> d</p>'), 'a  d');
	});

	it('mention', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/@user" class="u-url mention">@user</a> d</p>'), 'a @user@example.com d');
	});

	it('hashtag', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/tags/a">#a</a> d</p>', ['#a']), 'a #a d');
	});
});
