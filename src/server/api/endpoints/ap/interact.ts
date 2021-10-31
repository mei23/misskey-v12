import $ from 'cafy';
import define from '../../define';
import * as ms from 'ms';
import webfinger from '@/remote/webfinger';

export const meta = {
	tags: ['federation'],

	requireCredential: true as const,

	limit: {
		duration: ms('1hour'),
		max: 300
	},

	params: {
		acct: {
			validator: $.str,
		},
	},

	errors: {
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
	}
};

export default define(meta, async (ps) => {
	const r = await webfinger(ps.acct);
	const subscribe = r.links.filter(link => link.rel === 'http://ostatus.org/schema/1.0/subscribe')[0];
	if (!subscribe?.template) throw new Error('no subscribe');

	return {
		template: subscribe.template
	};
});
