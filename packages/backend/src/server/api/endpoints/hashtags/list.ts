import define from '../../define.js';
import { Hashtags } from '@/models/index.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Hashtag',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		attachedToUserOnly: { type: 'boolean', default: false },
		attachedToLocalUserOnly: { type: 'boolean', default: false },
		attachedToRemoteUserOnly: { type: 'boolean', default: false },
		sort: { type: 'string', enum: ['+mentionedUsers', '-mentionedUsers', '+mentionedLocalUsers', '-mentionedLocalUsers', '+mentionedRemoteUsers', '-mentionedRemoteUsers', '+attachedUsers', '-attachedUsers', '+attachedLocalUsers', '-attachedLocalUsers', '+attachedRemoteUsers', '-attachedRemoteUsers'] },
	},
	required: ['sort'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = Hashtags.createQueryBuilder('tag');

	if (ps.attachedToUserOnly) query.andWhere('tag.attachedUsersCount != 0');
	if (ps.attachedToLocalUserOnly) query.andWhere('tag.attachedLocalUsersCount != 0');
	if (ps.attachedToRemoteUserOnly) query.andWhere('tag.attachedRemoteUsersCount != 0');

	switch (ps.sort) {
		case '+mentionedUsers': query.orderBy('tag.mentionedUsersCount', 'DESC'); break;
		case '-mentionedUsers': query.orderBy('tag.mentionedUsersCount', 'ASC'); break;
		case '+mentionedLocalUsers': query.orderBy('tag.mentionedLocalUsersCount', 'DESC'); break;
		case '-mentionedLocalUsers': query.orderBy('tag.mentionedLocalUsersCount', 'ASC'); break;
		case '+mentionedRemoteUsers': query.orderBy('tag.mentionedRemoteUsersCount', 'DESC'); break;
		case '-mentionedRemoteUsers': query.orderBy('tag.mentionedRemoteUsersCount', 'ASC'); break;
		case '+attachedUsers': query.orderBy('tag.attachedUsersCount', 'DESC'); break;
		case '-attachedUsers': query.orderBy('tag.attachedUsersCount', 'ASC'); break;
		case '+attachedLocalUsers': query.orderBy('tag.attachedLocalUsersCount', 'DESC'); break;
		case '-attachedLocalUsers': query.orderBy('tag.attachedLocalUsersCount', 'ASC'); break;
		case '+attachedRemoteUsers': query.orderBy('tag.attachedRemoteUsersCount', 'DESC'); break;
		case '-attachedRemoteUsers': query.orderBy('tag.attachedRemoteUsersCount', 'ASC'); break;
	}

	query.select([
		'tag.name',
		'tag.mentionedUsersCount',
		'tag.mentionedLocalUsersCount',
		'tag.mentionedRemoteUsersCount',
		'tag.attachedUsersCount',
		'tag.attachedLocalUsersCount',
		'tag.attachedRemoteUsersCount',
	]);

	const tags = await query.take(ps.limit).getMany();

	return Hashtags.packMany(tags);
});
