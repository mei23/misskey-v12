import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { publishDriveStream } from '@/services/stream';
import { ApiError } from '../../../error';
import { DriveFolders, DriveFiles } from '@/models/index';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	params: {
		folderId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: '1069098f-c281-440f-b085-f9932edbe091',
		},

		hasChildFilesOrFolders: {
			message: 'This folder has child files or folders.',
			code: 'HAS_CHILD_FILES_OR_FOLDERS',
			id: 'b0fc8a17-963c-405d-bfbc-859a487295e1',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	// Get folder
	const folder = await DriveFolders.findOne({
		id: ps.folderId,
		userId: user.id,
	});

	if (folder == null) {
		throw new ApiError(meta.errors.noSuchFolder);
	}

	const [childFoldersCount, childFilesCount] = await Promise.all([
		DriveFolders.count({ parentId: folder.id }),
		DriveFiles.count({ folderId: folder.id }),
	]);

	if (childFoldersCount !== 0 || childFilesCount !== 0) {
		throw new ApiError(meta.errors.hasChildFilesOrFolders);
	}

	await DriveFolders.delete(folder.id);

	// Publish folderCreated event
	publishDriveStream(user.id, 'folderDeleted', folder.id);
});
