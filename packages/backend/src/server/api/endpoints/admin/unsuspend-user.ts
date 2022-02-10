import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { Users } from '@/models/index';
import { insertModerationLog } from '@/services/insert-moderation-log';
import { doPostUnsuspend } from '@/services/unsuspend-user';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	await Users.update(user.id, {
		isSuspended: false,
	});

	insertModerationLog(me, 'unsuspend', {
		targetId: user.id,
	});

	doPostUnsuspend(user);
});
