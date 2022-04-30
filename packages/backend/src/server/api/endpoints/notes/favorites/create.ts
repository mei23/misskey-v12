import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getNote } from '../../../common/getters';
import { NoteFavorites } from '@/models/index';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['notes', 'favorites'],

	requireCredential: true,

	kind: 'write:favorites',

	params: {
		noteId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '6dd26674-e060-4816-909a-45ba3f4da458',
		},

		alreadyFavorited: {
			message: 'The note has already been marked as a favorite.',
			code: 'ALREADY_FAVORITED',
			id: 'a402c12b-34dd-41d2-97d8-4d2ffd96a1a6',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	// Get favoritee
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	// if already favorited
	const exist = await NoteFavorites.findOne({
		noteId: note.id,
		userId: user.id,
	});

	if (exist != null) {
		throw new ApiError(meta.errors.alreadyFavorited);
	}

	// Create favorite
	await NoteFavorites.insert({
		id: genId(),
		createdAt: new Date(),
		noteId: note.id,
		userId: user.id,
	});
});
