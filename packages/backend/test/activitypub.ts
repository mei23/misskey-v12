process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import rndstr from 'rndstr';
import { initDb } from '../src/db/postgre.js';
import { initTestDb } from './utils.js';

describe('ActivityPub', () => {
	before(async () => {
		//await initTestDb();
		await initDb();
	});

	describe('Parse minimum object', () => {
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
			const { MockResolver } = await import('./misc/mock-resolver.js');
			const { createPerson } = await import('../src/remote/activitypub/models/person.js');

			const resolver = new MockResolver();
			resolver._register(actor.id, actor);

			const user = await createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.uri, actor.id);
			assert.deepStrictEqual(user.username, actor.preferredUsername);
			assert.deepStrictEqual(user.inbox, actor.inbox);
		});

		it('Minimum Note', async () => {
			const { MockResolver } = await import('./misc/mock-resolver.js');
			const { createNote } = await import('../src/remote/activitypub/models/note.js');

			const resolver = new MockResolver();
			resolver._register(actor.id, actor);
			resolver._register(post.id, post);

			const note = await createNote(post.id, resolver, true);

			assert.deepStrictEqual(note?.uri, post.id);
			assert.deepStrictEqual(note.visibility, 'public');
			assert.deepStrictEqual(note.text, post.content);
		});
	});

	describe('Truncate long name', () => {
		const host = 'https://host1.test';
		const preferredUsername = `${rndstr('A-Z', 4)}${rndstr('a-z', 4)}`;
		const actorId = `${host}/users/${preferredUsername.toLowerCase()}`;

		const name = rndstr('0-9a-z', 129);

		const actor = {
			'@context': 'https://www.w3.org/ns/activitystreams',
			id: actorId,
			type: 'Person',
			preferredUsername,
			name,
			inbox: `${actorId}/inbox`,
			outbox: `${actorId}/outbox`,
		};

		it('Actor', async () => {
			const { MockResolver } = await import('./misc/mock-resolver.js');
			const { createPerson } = await import('../src/remote/activitypub/models/person.js');

			const resolver = new MockResolver();
			resolver._register(actor.id, actor);

			const user = await createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.name, actor.name.substr(0, 128));
		});
	});
});
