import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { Channels } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['channels', 'account'],

	requireCredential: true as const,

	kind: 'read:channels',

	params: {
		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 5,
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Channel',
		},
	},
};

export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(Channels.createQueryBuilder(), ps.sinceId, ps.untilId)
		.andWhere({ userId: me.id });

	const channels = await query
		.take(ps.limit!)
		.getMany();

	return await Promise.all(channels.map(x => Channels.pack(x, me)));
});
