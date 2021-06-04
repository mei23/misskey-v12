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

describe('ActivityPub', () => {
	let p: childProcess.ChildProcess;

	before(launchServer(g => p = g));

	after(async () => {
		await shutdownServer(p);
	});
});
