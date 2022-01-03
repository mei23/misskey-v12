import { Notes } from '@/models/index';
import { IRemoteUser } from '@/models/entities/user';
import { IAnnounce, getApId } from '../../type';
import deleteNote from '@/services/note/delete';

export const undoAnnounce = async (actor: IRemoteUser, activity: IAnnounce): Promise<string> => {
	const uri = getApId(activity);

	const note = await Notes.findOne({
		uri,
	});

	if (!note) return 'skip: no such Announce';

	await deleteNote(actor, note);
	return 'ok: deleted';
};
