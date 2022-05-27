import define from '../../define.js';
import { Users } from '@/models/index.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,

	res: {
		optional: false, nullable: false,
		oneOf: [
			{
				type: 'object',
				properties: {
					id: {
						type: 'string',
						optional: false, nullable: false,
						format: 'id',
					},
					isFollowing: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					hasPendingFollowRequestFromYou: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					hasPendingFollowRequestToYou: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					isFollowed: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					isBlocking: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					isBlocked: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					isMuted: {
						type: 'boolean',
						optional: false, nullable: false,
					},
				},
			},
			{
				type: 'array',
				items: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						id: {
							type: 'string',
							optional: false, nullable: false,
							format: 'id',
						},
						isFollowing: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						hasPendingFollowRequestFromYou: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						hasPendingFollowRequestToYou: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						isFollowed: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						isBlocking: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						isBlocked: {
							type: 'boolean',
							optional: false, nullable: false,
						},
						isMuted: {
							type: 'boolean',
							optional: false, nullable: false,
						},
					},
				},
			},
		],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: {
			anyOf: [
				{ type: 'string', format: 'misskey:id' },
				{
					type: 'array',
					items: { type: 'string', format: 'misskey:id' },
				},
			],
		},
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const ids = Array.isArray(ps.userId) ? ps.userId : [ps.userId];

	const relations = await Promise.all(ids.map(id => Users.getRelation(me.id, id)));

	return Array.isArray(ps.userId) ? relations : relations[0];
});
