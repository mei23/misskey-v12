import $ from 'cafy';
import define from '../../../define';
import { Ads } from '@/models/index';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		url: {
			validator: $.str.min(1),
		},
		memo: {
			validator: $.str,
		},
		place: {
			validator: $.str,
		},
		priority: {
			validator: $.str,
		},
		ratio: {
			validator: $.num.int().min(0),
		},
		expiresAt: {
			validator: $.num.int(),
		},
		imageUrl: {
			validator: $.str.min(1),
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	await Ads.insert({
		id: genId(),
		createdAt: new Date(),
		expiresAt: new Date(ps.expiresAt),
		url: ps.url,
		imageUrl: ps.imageUrl,
		priority: ps.priority,
		ratio: ps.ratio,
		place: ps.place,
		memo: ps.memo,
	});
});
