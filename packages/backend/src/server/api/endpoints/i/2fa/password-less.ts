import $ from 'cafy';
import define from '../../../define';
import { UserProfiles } from '@/models/index';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		value: {
			validator: $.boolean,
		},
	},
};

export default define(meta, async (ps, user) => {
	await UserProfiles.update(user.id, {
		usePasswordLessLogin: ps.value,
	});
});
