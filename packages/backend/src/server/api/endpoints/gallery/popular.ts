import define from '../../define';
import { GalleryPosts } from '@/models/index';

export const meta = {
	tags: ['gallery'],

	requireCredential: false as const,

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'GalleryPost',
		},
	},
};

export default define(meta, async (ps, me) => {
	const query = GalleryPosts.createQueryBuilder('post')
		.andWhere('post.likedCount > 0')
		.orderBy('post.likedCount', 'DESC');

	const posts = await query.take(10).getMany();

	return await GalleryPosts.packMany(posts, me);
});
