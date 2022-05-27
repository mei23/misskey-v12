import define from '../../define.js';
import { ClipNotes, Clips } from '@/models/index.js';
import { ApiError } from '../../error.js';
import { genId } from '@/misc/gen-id.js';
import { getNote } from '../../common/getters.js';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf',
		},

		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'fc8c0b49-c7a3-4664-a0a6-b418d386bb8b',
		},

		alreadyClipped: {
			message: 'The note has already been clipped.',
			code: 'ALREADY_CLIPPED',
			id: '734806c4-542c-463a-9311-15c512803965',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		clipId: { type: 'string', format: 'misskey:id' },
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['clipId', 'noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const clip = await Clips.findOneBy({
		id: ps.clipId,
		userId: user.id,
	});

	if (clip == null) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const exist = await ClipNotes.findOneBy({
		noteId: note.id,
		clipId: clip.id,
	});

	if (exist != null) {
		throw new ApiError(meta.errors.alreadyClipped);
	}

	await ClipNotes.insert({
		id: genId(),
		noteId: note.id,
		clipId: clip.id,
	});
});
