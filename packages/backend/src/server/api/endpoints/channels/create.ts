import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { Channels, DriveFiles } from '@/models/index';
import { Channel } from '@/models/entities/channel';
import { genId } from '@/misc/gen-id';
import { ID } from '@/misc/cafy-id';

export const meta = {
	tags: ['channels'],

	requireCredential: true,

	kind: 'write:channels',

	params: {
		name: {
			validator: $.str.range(1, 128),
		},

		description: {
			validator: $.nullable.optional.str.range(1, 2048),
		},

		bannerId: {
			validator: $.nullable.optional.type(ID),
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Channel',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'cd1e9f3e-5a12-4ab4-96f6-5d0a2cc32050',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	let banner = null;
	if (ps.bannerId != null) {
		banner = await DriveFiles.findOne({
			id: ps.bannerId,
			userId: user.id,
		});

		if (banner == null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	}

	const channel = await Channels.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
		description: ps.description || null,
		bannerId: banner ? banner.id : null,
	} as Channel).then(x => Channels.findOneOrFail(x.identifiers[0]));

	return await Channels.pack(channel, user);
});
