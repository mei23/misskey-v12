import Router from '@koa/router';
import config from '@/config/index.js';
import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderOrderedCollection from '@/remote/activitypub/renderer/ordered-collection.js';
import renderOrderedCollectionPage from '@/remote/activitypub/renderer/ordered-collection-page.js';
import { setResponseType } from '../activitypub.js';
import renderNote from '@/remote/activitypub/renderer/note.js';
import renderCreate from '@/remote/activitypub/renderer/create.js';
import renderAnnounce from '@/remote/activitypub/renderer/announce.js';
import { countIf } from '@/prelude/array.js';
import * as url from '@/prelude/url.js';
import { Users, Notes } from '@/models/index.js';
import { makePaginationQuery } from '../api/common/make-pagination-query.js';
import { Brackets } from 'typeorm';
import { Note } from '@/models/entities/note.js';

export default async (ctx: Router.RouterContext) => {
	const userId = ctx.params.user;

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.default.optional.type(ID).get(ctx.request.query.since_id);

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.default.optional.type(ID).get(ctx.request.query.until_id);

	// Get 'page' parameter
	const pageErr = !$.default.optional.str.or(['true', 'false']).ok(ctx.request.query.page);
	const page: boolean = ctx.request.query.page === 'true';

	// Validate parameters
	if (sinceIdErr || untilIdErr || pageErr || countIf(x => x != null, [sinceId, untilId]) > 1) {
		ctx.status = 400;
		return;
	}

	// Verify user
	const user = await Users.findOne({
		id: userId,
		host: null,
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	const limit = 20;
	const partOf = `${config.url}/users/${userId}/outbox`;

	if (page) {
		const query = makePaginationQuery(Notes.createQueryBuilder('note'), sinceId, untilId)
			.andWhere('note.userId = :userId', { userId: user.id })
			.andWhere(new Brackets(qb => { qb
				.where(`note.visibility = 'public'`)
				.orWhere(`note.visibility = 'home'`);
			}))
			.andWhere('note.localOnly = FALSE');

		const notes = await query.take(limit).getMany();

		if (sinceId) notes.reverse();

		const activities = await Promise.all(notes.map(note => packActivity(note)));
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: 'true',
				since_id: sinceId,
				until_id: untilId,
			})}`,
			user.notesCount, activities, partOf,
			notes.length ? `${partOf}?${url.query({
				page: 'true',
				since_id: notes[0].id,
			})}` : undefined,
			notes.length ? `${partOf}?${url.query({
				page: 'true',
				until_id: notes[notes.length - 1].id,
			})}` : undefined
		);

		ctx.body = renderActivity(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, user.notesCount,
			`${partOf}?page=true`,
			`${partOf}?page=true&since_id=000000000000000000000000`
		);
		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'public, max-age=180');
		setResponseType(ctx);
	}
};

/**
 * Pack Create<Note> or Announce Activity
 * @param note Note
 */
export async function packActivity(note: Note): Promise<any> {
	if (note.renoteId && note.text == null && !note.hasPoll && (note.fileIds == null || note.fileIds.length === 0)) {
		const renote = await Notes.findOneOrFail(note.renoteId);
		return renderAnnounce(renote.uri ? renote.uri : `${config.url}/notes/${renote.id}`, note);
	}

	return renderCreate(await renderNote(note, false), note);
}
