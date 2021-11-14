/*
import * as assert from 'assert';
import { initTestDb } from 'utils';

describe('toDbReaction', async () => {
	let toDbReaction: any;

	before(async () => {
		await initTestDb();
		toDbReaction = (await import('../src/misc/reaction-lib')).toDbReaction;
	});

	it('Legacy文字列リアクションはUnicodeに', async () => {
		assert.strictEqual(await toDbReaction('like'), '👍');
	});

	it('それ以外はUnicodeのまま', async () => {
		assert.strictEqual(await toDbReaction('🍅'), '🍅');
	});

	it('異体字セレクタ除去', async () => {
		assert.strictEqual(await toDbReaction('㊗️'), '㊗');
	});

	it('異体字セレクタ除去 必要なし', async () => {
		assert.strictEqual(await toDbReaction('㊗'), '㊗');
	});

	it('fallback - undefined', async () => {
		assert.strictEqual(await toDbReaction(undefined), '👍');
	});

	it('fallback - null', async () => {
		assert.strictEqual(await toDbReaction(null), '👍');
	});

	it('fallback - empty', async () => {
		assert.strictEqual(await toDbReaction(''), '👍');
	});

	it('fallback - unknown', async () => {
		assert.strictEqual(await toDbReaction('unknown'), '👍');
	});
});
*/
