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
import rndstr from 'rndstr';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import Resolver, { MockResolver } from '../src/remote/activitypub/resolver';
import { launchServer, signup, post, request, simpleGet, port, shutdownServer } from './utils';
import { createPerson } from '../src/remote/activitypub/models/person';
import { createNote } from '../src/remote/activitypub/models/note';

describe('Parse minimum object', async () => {
	const host = 'https://host1.test';
	const preferredUsername = `${rndstr('A-Z', 4)}${rndstr('a-z', 4)}`;
	const actorId = `${host}/users/${preferredUsername.toLowerCase()}`;

	const actor = {
		'@context': 'https://www.w3.org/ns/activitystreams',
		id: actorId,
		type: 'Person',
		preferredUsername,
		inbox: `${actorId}/inbox`,
		outbox: `${actorId}/outbox`,
	};

	const post = {
		'@context': 'https://www.w3.org/ns/activitystreams',
		id: `${host}/users/${rndstr('0-9a-z', 8)}`,
		type: 'Note',
		attributedTo: actor.id,
		to: 'https://www.w3.org/ns/activitystreams#Public',
		content: 'あ',
	};

	it('Minimum Actor', async () => {
		const resolver = new MockResolver();
		resolver._register(actor.id, actor);

		const user = await createPerson(actor.id, resolver);

		assert.deepStrictEqual(user.uri, actor.id);
		assert.deepStrictEqual(user.username, actor.preferredUsername);
		assert.deepStrictEqual(user.inbox, actor.inbox);
	});

	it('Minimum Note', async () => {
		const resolver = new MockResolver();
		resolver._register(actor.id, actor);
		resolver._register(post.id, post);

		const note = await createNote(post.id, resolver, true);

		assert.deepStrictEqual(note?.uri, post.id);
		assert.deepStrictEqual(note?.visibility, 'public');
		assert.deepStrictEqual(note?.text, post.content);
	});
});
