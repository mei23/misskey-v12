import $ from 'cafy';
import define from '../../define';
import { AccessTokens, Apps } from '@/models/index';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0,
		},

		sort: {
			validator: $.optional.str.or('desc|asc'),
			default: 'desc',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	// Get tokens
	const tokens = await AccessTokens.find({
		where: {
			userId: user.id,
		},
		take: ps.limit!,
		skip: ps.offset,
		order: {
			id: ps.sort == 'asc' ? 1 : -1,
		},
	});

	return await Promise.all(tokens.map(token => Apps.pack(token.appId, user, {
		detail: true,
	})));
});
