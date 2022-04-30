import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as Koa from 'koa';
import * as send from 'koa-send';
import * as rename from 'rename';
import * as tmp from 'tmp';
import { serverLogger } from '../index';
import { contentDisposition } from '@/misc/content-disposition';
import { DriveFiles } from '@/models/index';
import { InternalStorage } from '@/services/drive/internal-storage';
import { downloadUrl } from '@/misc/download-url';
import { detectType } from '@/misc/get-file-info';
import { convertToJpeg, convertToPng, convertToPngOrJpeg } from '@/services/drive/image-processor';
import { GenerateVideoThumbnail } from '@/services/drive/generate-video-thumbnail';
import { StatusError } from '@/misc/fetch';
import { FILE_TYPE_BROWSERSAFE } from '@/const';

//const _filename = fileURLToPath(import.meta.url);
const _filename = __filename;
const _dirname = dirname(_filename);

const assets = `${_dirname}/../../server/file/assets/`;

const commonReadableHandlerGenerator = (ctx: Koa.Context) => (e: Error): void => {
	serverLogger.error(e);
	ctx.status = 500;
	ctx.set('Cache-Control', 'max-age=300');
};

// eslint-disable-next-line import/no-default-export
export default async function(ctx: Koa.Context) {
	const key = ctx.params.key;

	// Fetch drive file
	const file = await DriveFiles.createQueryBuilder('file')
		.where('file.accessKey = :accessKey', { accessKey: key })
		.orWhere('file.thumbnailAccessKey = :thumbnailAccessKey', { thumbnailAccessKey: key })
		.orWhere('file.webpublicAccessKey = :webpublicAccessKey', { webpublicAccessKey: key })
		.getOne();

	if (file == null) {
		ctx.status = 404;
		ctx.set('Cache-Control', 'max-age=86400');
		await send(ctx as any, '/dummy.png', { root: assets });
		return;
	}

	const isThumbnail = file.thumbnailAccessKey === key;
	const isWebpublic = file.webpublicAccessKey === key;

	if (!file.storedInternal) {
		if (file.isLink && file.uri) {	// 期限切れリモートファイル
			const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
				tmp.file((e, path, fd, cleanup) => {
					if (e) return rej(e);
					res([path, cleanup]);
				});
			});

			try {
				await downloadUrl(file.uri, path);

				const { mime, ext } = await detectType(path);

				const convertFile = async () => {
					if (isThumbnail) {
						if (['image/jpeg', 'image/webp'].includes(mime)) {
							return await convertToJpeg(path, 498, 280);
						} else if (['image/png', 'image/svg+xml'].includes(mime)) {
							return await convertToPngOrJpeg(path, 498, 280);
						} else if (mime.startsWith('video/')) {
							return await GenerateVideoThumbnail(path);
						}
					}

					if (isWebpublic) {
						if (['image/svg+xml'].includes(mime)) {
							return await convertToPng(path, 2048, 2048);
						}
					}

					return {
						data: fs.readFileSync(path),
						ext,
						type: mime,
					};
				};

				const image = await convertFile();
				ctx.body = image.data;
				ctx.set('Content-Type', FILE_TYPE_BROWSERSAFE.includes(image.type) ? image.type : 'application/octet-stream');
				ctx.set('Cache-Control', 'max-age=31536000, immutable');
			} catch (e) {
				serverLogger.error(`${e}`);

				if (e instanceof StatusError && e.isClientError) {
					ctx.status = e.statusCode;
					ctx.set('Cache-Control', 'max-age=86400');
				} else {
					ctx.status = 500;
					ctx.set('Cache-Control', 'max-age=300');
				}
			} finally {
				cleanup();
			}
			return;
		}

		ctx.status = 204;
		ctx.set('Cache-Control', 'max-age=86400');
		return;
	}

	if (isThumbnail || isWebpublic) {
		const { mime, ext } = await detectType(InternalStorage.resolvePath(key));
		const filename = rename(file.name, {
			suffix: isThumbnail ? '-thumb' : '-web',
			extname: ext ? `.${ext}` : undefined,
		}).toString();

		ctx.body = InternalStorage.read(key);
		ctx.set('Content-Type', FILE_TYPE_BROWSERSAFE.includes(mime) ? mime : 'application/octet-stream');
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.set('Content-Disposition', contentDisposition('inline', filename));
	} else {
		const readable = InternalStorage.read(file.accessKey!);
		readable.on('error', commonReadableHandlerGenerator(ctx));
		ctx.body = readable;
		ctx.set('Content-Type', FILE_TYPE_BROWSERSAFE.includes(file.type) ? file.type : 'application/octet-stream');
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.set('Content-Disposition', contentDisposition('inline', file.name));
	}
}
