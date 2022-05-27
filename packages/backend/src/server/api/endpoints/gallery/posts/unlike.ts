import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { GalleryPosts, GalleryLikes } from '@/models/index.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	kind: 'write:gallery-likes',

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: 'c32e6dd0-b555-4413-925e-b3757d19ed84',
		},

		notLiked: {
			message: 'You have not liked that post.',
			code: 'NOT_LIKED',
			id: 'e3e8e06e-be37-41f7-a5b4-87a8250288f0',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		postId: { type: 'string', format: 'misskey:id' },
	},
	required: ['postId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const post = await GalleryPosts.findOneBy({ id: ps.postId });
	if (post == null) {
		throw new ApiError(meta.errors.noSuchPost);
	}

	const exist = await GalleryLikes.findOneBy({
		postId: post.id,
		userId: user.id,
	});

	if (exist == null) {
		throw new ApiError(meta.errors.notLiked);
	}

	// Delete like
	await GalleryLikes.delete(exist.id);

	GalleryPosts.decrement({ id: post.id }, 'likedCount', 1);
});
