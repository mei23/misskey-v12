import $ from 'cafy';
import define from '../../../define';
import { Emojis } from '@/models/index';
import { toPuny } from '@/misc/convert-host';
import { makePaginationQuery } from '../../../common/make-pagination-query';
import { ID } from '@/misc/cafy-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		query: {
			validator: $.optional.nullable.str,
			default: null,
		},

		host: {
			validator: $.optional.nullable.str,
			default: null,
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id',
				},
				aliases: {
					type: 'array' as const,
					optional: false as const, nullable: false as const,
					items: {
						type: 'string' as const,
						optional: false as const, nullable: false as const,
					},
				},
				name: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
				category: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
				},
				host: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
				},
				url: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},
	},
};

export default define(meta, async (ps) => {
	const q = makePaginationQuery(Emojis.createQueryBuilder('emoji'), ps.sinceId, ps.untilId);

	if (ps.host == null) {
		q.andWhere(`emoji.host IS NOT NULL`);
	} else {
		q.andWhere(`emoji.host = :host`, { host: toPuny(ps.host) });
	}

	if (ps.query) {
		q.andWhere('emoji.name like :query', { query: '%' + ps.query + '%' });
	}

	const emojis = await q
		.orderBy('emoji.id', 'DESC')
		.take(ps.limit!)
		.getMany();

	return Emojis.packMany(emojis);
});
