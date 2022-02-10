import { URL } from 'url';
import define from '../../../define';
import { inboxQueue } from '@/queue/queues';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				anyOf: [
					{
						type: 'string',
					},
					{
						type: 'number',
					},
				],
			},
		},
		example: [[
			'example.com',
			12,
		]],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	const jobs = await inboxQueue.getJobs(['delayed']);

	const res = [] as [string, number][];

	for (const job of jobs) {
		const host = new URL(job.data.signature.keyId).host;
		if (res.find(x => x[0] === host)) {
			res.find(x => x[0] === host)![1]++;
		} else {
			res.push([host, 1]);
		}
	}

	res.sort((a, b) => b[1] - a[1]);

	return res;
});
