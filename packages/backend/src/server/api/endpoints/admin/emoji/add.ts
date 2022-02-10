import $ from 'cafy';
import define from '../../../define';
import { Emojis, DriveFiles } from '@/models/index';
import { genId } from '@/misc/gen-id';
import { getConnection } from 'typeorm';
import { insertModerationLog } from '@/services/insert-moderation-log';
import { ApiError } from '../../../error';
import { ID } from '@/misc/cafy-id';
import rndstr from 'rndstr';
import { publishBroadcastStream } from '@/services/stream';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		fileId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'MO_SUCH_FILE',
			id: 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const file = await DriveFiles.findOne(ps.fileId);

	if (file == null) throw new ApiError(meta.errors.noSuchFile);

	const name = file.name.split('.')[0].match(/^[a-z0-9_]+$/) ? file.name.split('.')[0] : `_${rndstr('a-z0-9', 8)}_`;

	const emoji = await Emojis.insert({
		id: genId(),
		updatedAt: new Date(),
		name: name,
		category: null,
		host: null,
		aliases: [],
		originalUrl: file.url,
		publicUrl: file.webpublicUrl ?? file.url,
		type: file.webpublicType ?? file.type,
	}).then(x => Emojis.findOneOrFail(x.identifiers[0]));

	await getConnection().queryResultCache!.remove(['meta_emojis']);

	publishBroadcastStream('emojiAdded', {
		emoji: await Emojis.pack(emoji.id),
	});

	insertModerationLog(me, 'addEmoji', {
		emojiId: emoji.id,
	});

	return {
		id: emoji.id,
	};
});
