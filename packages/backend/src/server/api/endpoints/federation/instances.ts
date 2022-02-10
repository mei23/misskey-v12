import $ from 'cafy';
import config from '@/config/index';
import define from '../../define';
import { Instances } from '@/models/index';
import { fetchMeta } from '@/misc/fetch-meta';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	params: {
		host: {
			validator: $.optional.nullable.str,
		},

		blocked: {
			validator: $.optional.nullable.bool,
		},

		notResponding: {
			validator: $.optional.nullable.bool,
		},

		suspended: {
			validator: $.optional.nullable.bool,
		},

		federating: {
			validator: $.optional.nullable.bool,
		},

		subscribing: {
			validator: $.optional.nullable.bool,
		},

		publishing: {
			validator: $.optional.nullable.bool,
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 30,
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0,
		},

		sort: {
			validator: $.optional.str,
		},
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'FederationInstance',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const query = Instances.createQueryBuilder('instance');

	switch (ps.sort) {
		case '+pubSub': query.orderBy('instance.followingCount', 'DESC').orderBy('instance.followersCount', 'DESC'); break;
		case '-pubSub': query.orderBy('instance.followingCount', 'ASC').orderBy('instance.followersCount', 'ASC'); break;
		case '+notes': query.orderBy('instance.notesCount', 'DESC'); break;
		case '-notes': query.orderBy('instance.notesCount', 'ASC'); break;
		case '+users': query.orderBy('instance.usersCount', 'DESC'); break;
		case '-users': query.orderBy('instance.usersCount', 'ASC'); break;
		case '+following': query.orderBy('instance.followingCount', 'DESC'); break;
		case '-following': query.orderBy('instance.followingCount', 'ASC'); break;
		case '+followers': query.orderBy('instance.followersCount', 'DESC'); break;
		case '-followers': query.orderBy('instance.followersCount', 'ASC'); break;
		case '+caughtAt': query.orderBy('instance.caughtAt', 'DESC'); break;
		case '-caughtAt': query.orderBy('instance.caughtAt', 'ASC'); break;
		case '+lastCommunicatedAt': query.orderBy('instance.lastCommunicatedAt', 'DESC'); break;
		case '-lastCommunicatedAt': query.orderBy('instance.lastCommunicatedAt', 'ASC'); break;
		case '+driveUsage': query.orderBy('instance.driveUsage', 'DESC'); break;
		case '-driveUsage': query.orderBy('instance.driveUsage', 'ASC'); break;
		case '+driveFiles': query.orderBy('instance.driveFiles', 'DESC'); break;
		case '-driveFiles': query.orderBy('instance.driveFiles', 'ASC'); break;

		default: query.orderBy('instance.id', 'DESC'); break;
	}

	if (typeof ps.blocked === 'boolean') {
		const meta = await fetchMeta(true);
		if (ps.blocked) {
			query.andWhere('instance.host IN (:...blocks)', { blocks: meta.blockedHosts });
		} else {
			query.andWhere('instance.host NOT IN (:...blocks)', { blocks: meta.blockedHosts });
		}
	}

	if (typeof ps.notResponding === 'boolean') {
		if (ps.notResponding) {
			query.andWhere('instance.isNotResponding = TRUE');
		} else {
			query.andWhere('instance.isNotResponding = FALSE');
		}
	}

	if (typeof ps.suspended === 'boolean') {
		if (ps.suspended) {
			query.andWhere('instance.isSuspended = TRUE');
		} else {
			query.andWhere('instance.isSuspended = FALSE');
		}
	}

	if (typeof ps.federating === 'boolean') {
		if (ps.federating) {
			query.andWhere('((instance.followingCount > 0) OR (instance.followersCount > 0))');
		} else {
			query.andWhere('((instance.followingCount = 0) AND (instance.followersCount = 0))');
		}
	}

	if (typeof ps.subscribing === 'boolean') {
		if (ps.subscribing) {
			query.andWhere('instance.followersCount > 0');
		} else {
			query.andWhere('instance.followersCount = 0');
		}
	}

	if (typeof ps.publishing === 'boolean') {
		if (ps.publishing) {
			query.andWhere('instance.followingCount > 0');
		} else {
			query.andWhere('instance.followingCount = 0');
		}
	}

	if (ps.host) {
		query.andWhere('instance.host like :host', { host: '%' + ps.host.toLowerCase() + '%' });
	}

	const instances = await query.take(ps.limit!).skip(ps.offset).getMany();

	return instances;
});
