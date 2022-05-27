import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';
import { MessagingMessages, UserGroups, UserGroupJoinings, Users } from '@/models/index.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { Brackets } from 'typeorm';
import { readUserMessagingMessage, readGroupMessagingMessage, deliverReadActivity } from '../../common/read-messaging-message.js';

export const meta = {
	tags: ['messaging'],

	requireCredential: true,

	kind: 'read:messaging',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'MessagingMessage',
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '11795c64-40ea-4198-b06e-3c873ed9039d',
		},

		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: 'c4d9f88c-9270-4632-b032-6ed8cee36f7f',
		},

		groupAccessDenied: {
			message: 'You can not read messages of groups that you have not joined.',
			code: 'GROUP_ACCESS_DENIED',
			id: 'a053a8dd-a491-4718-8f87-50775aad9284',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		markAsRead: { type: 'boolean', default: true },
	},
	anyOf: [
		{
			properties: {
				userId: { type: 'string', format: 'misskey:id' },
			},
			required: ['userId'],
		},
		{
			properties: {
				groupId: { type: 'string', format: 'misskey:id' },
			},
			required: ['groupId'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	if (ps.userId != null) {
		// Fetch recipient (user)
		const recipient = await getUser(ps.userId).catch(e => {
			if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
			throw e;
		});

		const query = makePaginationQuery(MessagingMessages.createQueryBuilder('message'), ps.sinceId, ps.untilId)
			.andWhere(new Brackets(qb => { qb
				.where(new Brackets(qb => { qb
					.where('message.userId = :meId')
					.andWhere('message.recipientId = :recipientId');
				}))
				.orWhere(new Brackets(qb => { qb
					.where('message.userId = :recipientId')
					.andWhere('message.recipientId = :meId');
				}));
			}))
			.setParameter('meId', user.id)
			.setParameter('recipientId', recipient.id);

		const messages = await query.take(ps.limit).getMany();

		// Mark all as read
		if (ps.markAsRead) {
			readUserMessagingMessage(user.id, recipient.id, messages.filter(m => m.recipientId === user.id).map(x => x.id));

			// リモートユーザーとのメッセージだったら既読配信
			if (Users.isLocalUser(user) && Users.isRemoteUser(recipient)) {
				deliverReadActivity(user, recipient, messages);
			}
		}

		return await Promise.all(messages.map(message => MessagingMessages.pack(message, user, {
			populateRecipient: false,
		})));
	} else if (ps.groupId != null) {
		// Fetch recipient (group)
		const recipientGroup = await UserGroups.findOneBy({ id: ps.groupId });

		if (recipientGroup == null) {
			throw new ApiError(meta.errors.noSuchGroup);
		}

		// check joined
		const joining = await UserGroupJoinings.findOneBy({
			userId: user.id,
			userGroupId: recipientGroup.id,
		});

		if (joining == null) {
			throw new ApiError(meta.errors.groupAccessDenied);
		}

		const query = makePaginationQuery(MessagingMessages.createQueryBuilder('message'), ps.sinceId, ps.untilId)
			.andWhere(`message.groupId = :groupId`, { groupId: recipientGroup.id });

		const messages = await query.take(ps.limit).getMany();

		// Mark all as read
		if (ps.markAsRead) {
			readGroupMessagingMessage(user.id, recipientGroup.id, messages.map(x => x.id));
		}

		return await Promise.all(messages.map(message => MessagingMessages.pack(message, user, {
			populateGroup: false,
		})));
	}
});
