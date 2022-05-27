import * as Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'fs';

import { ulid } from 'ulid';
const mime = require('mime-types');
const archiver = require('archiver');
import { queueLogger } from '../../logger';
import { addFile } from '@/services/drive/add-file';
import * as dateFormat from 'dateformat';
import { Users, Emojis } from '@/models/index';
import {  } from '@/queue/types';
import { downloadUrl } from '@/misc/download-url';
import config from '@/config/index';

const logger = queueLogger.createSubLogger('export-custom-emojis');

export async function exportCustomEmojis(job: Bull.Job, done: () => void): Promise<void> {
	logger.info(`Exporting custom emojis ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	// Create temp dir
	const [path, cleanup] = await new Promise<[string, () => void]>((res, rej) => {
		tmp.dir((e, path, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	logger.info(`Temp dir is ${path}`);

	const metaPath = path + '/meta.json';

	fs.writeFileSync(metaPath, '', 'utf-8');

	const metaStream = fs.createWriteStream(metaPath, { flags: 'a' });

	const writeMeta = (text: string): Promise<void> => {
		return new Promise<void>((res, rej) => {
			metaStream.write(text, err => {
				if (err) {
					logger.error(err);
					rej(err);
				} else {
					res();
				}
			});
		});
	};

	await writeMeta(`{"metaVersion":2,"host":"${config.host}","exportedAt":"${new Date().toString()}","emojis":[`);

	const customEmojis = await Emojis.find({
		where: {
			host: null,
		},
		order: {
			id: 'ASC',
		},
	});

	for (const emoji of customEmojis) {
		const ext = mime.extension(emoji.type);
		const fileName = emoji.name + (ext ? '.' + ext : '');
		const emojiPath = path + '/' + fileName;
		fs.writeFileSync(emojiPath, '', 'binary');
		let downloaded = false;

		try {
			await downloadUrl(emoji.originalUrl, emojiPath);
			downloaded = true;
		} catch (e) { // TODO: 何度か再試行
			logger.error(e);
		}

		if (!downloaded) {
			fs.unlinkSync(emojiPath);
		}

		const content = JSON.stringify({
			fileName: fileName,
			downloaded: downloaded,
			emoji: emoji,
		});
		const isFirst = customEmojis.indexOf(emoji) === 0;

		await writeMeta(isFirst ? content : ',\n' + content);
	}

	await writeMeta(']}');

	metaStream.end();

	// Create archive
	const [archivePath, archiveCleanup] = await new Promise<[string, () => void]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});
	const archiveStream = fs.createWriteStream(archivePath);
	const archive = archiver('zip', {
		zlib: { level: 0 },
	});
	archiveStream.on('close', async () => {
		logger.succ(`Exported to: ${archivePath}`);

		const fileName = 'custom-emojis-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.zip';
		const driveFile = await addFile({ user, path: archivePath, name: fileName, force: true });

		logger.succ(`Exported to: ${driveFile.id}`);
		cleanup();
		archiveCleanup();
		done();
	});
	archive.pipe(archiveStream);
	archive.directory(path, false);
	archive.finalize();
}
