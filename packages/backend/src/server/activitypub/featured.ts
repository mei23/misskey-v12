import * as Router from '@koa/router';
import config from '@/config/index';
import { renderActivity } from '@/remote/activitypub/renderer/index';
import renderOrderedCollection from '@/remote/activitypub/renderer/ordered-collection';
import { setResponseType } from '../activitypub';
import renderNote from '@/remote/activitypub/renderer/note';
import { Users, Notes, UserNotePinings } from '@/models/index';

export default async (ctx: Router.RouterContext) => {
	const userId = ctx.params.user;

	// Verify user
	const user = await Users.findOne({
		id: userId,
		host: null,
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	const pinings = await UserNotePinings.find({
		where: { userId: user.id },
		order: { id: 'DESC' },
	});

	const pinnedNotes = await Promise.all(pinings.map(pining =>
		Notes.findOneOrFail(pining.noteId)));

	const renderedNotes = await Promise.all(pinnedNotes.map(note => renderNote(note)));

	const rendered = renderOrderedCollection(
		`${config.url}/users/${userId}/collections/featured`,
		renderedNotes.length, undefined, undefined, renderedNotes,
	);

	ctx.body = renderActivity(rendered);
	ctx.set('Cache-Control', 'public, max-age=180');
	setResponseType(ctx);
};
