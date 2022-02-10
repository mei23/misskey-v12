import $ from 'cafy';
import define from '../../define';
import { getConnection } from 'typeorm';
import { insertModerationLog } from '@/services/insert-moderation-log';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		full: {
			validator: $.bool,
		},
		analyze: {
			validator: $.bool,
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const params: string[] = [];

	if (ps.full) {
		params.push('FULL');
	}

	if (ps.analyze) {
		params.push('ANALYZE');
	}

	getConnection().query('VACUUM ' + params.join(' '));

	insertModerationLog(me, 'vacuum', ps);
});
