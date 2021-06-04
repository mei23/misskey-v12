/*
 * Tests for Fetch resource
 *
 * How to run the tests:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/fetch-resource.ts --require ts-node/register
 *
 * To specify test:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/fetch-resource.ts --require ts-node/register -g 'test name'
 */

process.env.NODE_ENV = 'test';

import { IObject } from '@/remote/activitypub/type';
import * as assert from 'assert';
import * as childProcess from 'child_process';
import Resolver from '../src/remote/activitypub/resolver';
import { launchServer, signup, post, request, simpleGet, port, shutdownServer } from './utils';

//#region Mock
type MockResponse = {
	type: string;
	content: string;
};

class MockResolver extends Resolver {
	private _rs = new Map<string, MockResponse>();
	public async _register(uri: string, content: string | Record<string, any>, type = 'application/activity+json') {
		this._rs.set(uri, {
			type,
			content: typeof content === 'string' ? content : JSON.stringify(content)
		});
	}

	public async resolve(value: string | IObject): Promise<IObject> {
		if (typeof value !== 'string') return value;

		const r = this._rs.get(value);

		if (!r) {
			throw {
				name: `StatusError`,
				statusCode: 404,
				message: `Not registed for mock`
			};
		}

		const object = JSON.parse(r.content);

		return object;
	}
}
//#endregion

describe('ActivityPub', () => {
	let p: childProcess.ChildProcess;

	before(launchServer(g => p = g));

	after(async () => {
		await shutdownServer(p);
	});
});
