import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ClipNotes, Clips, Notes } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query';
import { ApiError } from '../../error';
import { generateBlockedUserQuery } from '../../common/generate-block-query';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: false,

	kind: 'read:account',

	params: {
		clipId: {
			validator: $.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},
	},

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: '1d7645e6-2b6d-4635-b0fe-fe22b0e72e00',
		},
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const clip = await Clips.findOne({
		id: ps.clipId,
	});

	if (clip == null) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	if (!clip.isPublic && (user == null || (clip.userId !== user.id))) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	const clipQuery = ClipNotes.createQueryBuilder('joining')
		.select('joining.noteId')
		.where('joining.clipId = :clipId', { clipId: clip.id });

	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.andWhere(`note.id IN (${ clipQuery.getQuery() })`)
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser')
		.setParameters(clipQuery.getParameters());

	if (user) {
		generateVisibilityQuery(query, user);
		generateMutedUserQuery(query, user);
		generateBlockedUserQuery(query, user);
	}

	const notes = await query
		.take(ps.limit!)
		.getMany();

	return await Notes.packMany(notes, user);
});
