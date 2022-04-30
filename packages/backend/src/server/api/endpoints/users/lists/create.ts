import $ from 'cafy';
import define from '../../../define';
import { UserLists } from '@/models/index';
import { genId } from '@/misc/gen-id';
import { UserList } from '@/models/entities/user-list';

export const meta = {
	tags: ['lists'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		name: {
			validator: $.str.range(1, 100),
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserList',
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const userList = await UserLists.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
	} as UserList).then(x => UserLists.findOneOrFail(x.identifiers[0]));

	return await UserLists.pack(userList);
});
