import $ from 'cafy';
import define from '../../define';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query';
import { Notes } from '@/models/index';
import { generateBlockedUserQuery } from '../../common/generate-block-query';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0,
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
	const max = 30;
	const day = 1000 * 60 * 60 * 24 * 3; // 3日前まで

	const query = Notes.createQueryBuilder('note')
		.addSelect('note.score')
		.where('note.userHost IS NULL')
		.andWhere(`note.score > 0`)
		.andWhere(`note.createdAt > :date`, { date: new Date(Date.now() - day) })
		.andWhere(`note.visibility = 'public'`)
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser');

	if (user) generateMutedUserQuery(query, user);
	if (user) generateBlockedUserQuery(query, user);

	let notes = await query
		.orderBy('note.score', 'DESC')
		.take(max)
		.getMany();

	notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	notes = notes.slice(ps.offset, ps.offset + ps.limit);

	return await Notes.packMany(notes, user);
});
