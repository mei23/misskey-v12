import { addPinned } from '@/services/i/pin.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { Users } from '@/models/index.js';

export const meta = {
	tags: ['account', 'notes'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '56734f8b-3928-431e-bf80-6ff87df40cb3',
		},

		pinLimitExceeded: {
			message: 'You can not pin notes any more.',
			code: 'PIN_LIMIT_EXCEEDED',
			id: '72dab508-c64d-498f-8740-a8eec1ba385a',
		},

		alreadyPinned: {
			message: 'That note has already been pinned.',
			code: 'ALREADY_PINNED',
			id: '8b18c2b7-68fe-4edb-9892-c0cbaeb6c913',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	await addPinned(user, ps.noteId).catch(e => {
		if (e.id === '70c4e51f-5bea-449c-a030-53bee3cce202') throw new ApiError(meta.errors.noSuchNote);
		if (e.id === '15a018eb-58e5-4da1-93be-330fcc5e4e1a') throw new ApiError(meta.errors.pinLimitExceeded);
		if (e.id === '23f0cf4e-59a3-4276-a91d-61a5891c1514') throw new ApiError(meta.errors.alreadyPinned);
		throw e;
	});

	return await Users.pack<true, true>(user.id, user, {
		detail: true,
	});
});
