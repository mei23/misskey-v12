import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import ms from 'ms';
import deleteReaction from '@/services/note/reaction/delete';
import { getNote } from '../../../common/getters';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['reactions', 'notes'],

	requireCredential: true as const,

	kind: 'write:reactions',

	limit: {
		duration: ms('1hour'),
		max: 60,
		minInterval: ms('3sec'),
	},

	params: {
		noteId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '764d9fce-f9f2-4a0e-92b1-6ceac9a7ad37',
		},

		notReacted: {
			message: 'You are not reacting to that note.',
			code: 'NOT_REACTED',
			id: '92f4426d-4196-4125-aa5b-02943e2ec8fc',
		},
	},
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});
	await deleteReaction(user, note).catch(e => {
		if (e.id === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') throw new ApiError(meta.errors.notReacted);
		throw e;
	});
});
