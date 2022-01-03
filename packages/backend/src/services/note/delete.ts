import { publishNoteStream } from '@/services/stream';
import renderDelete from '@/remote/activitypub/renderer/delete';
import renderAnnounce from '@/remote/activitypub/renderer/announce';
import renderUndo from '@/remote/activitypub/renderer/undo';
import { renderActivity } from '@/remote/activitypub/renderer/index';
import renderTombstone from '@/remote/activitypub/renderer/tombstone';
import config from '@/config/index';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc';
import { User, ILocalUser, IRemoteUser } from '@/models/entities/user';
import { Note, IMentionedRemoteUsers } from '@/models/entities/note';
import { Notes, Users, Instances } from '@/models/index';
import { notesChart, perUserNotesChart, instanceChart } from '@/services/chart/index';
import { deliverToFollowers, deliverToUser } from '@/remote/activitypub/deliver-manager';
import { countSameRenotes } from '@/misc/count-same-renotes';
import { deliverToRelays } from '../relay';
import { Brackets, In } from 'typeorm';

/**
 * 投稿を削除します。
 * @param user 投稿者
 * @param note 投稿
 */
export default async function(user: User, note: Note, quiet = false) {
	const deletedAt = new Date();

	// この投稿を除く指定したユーザーによる指定したノートのリノートが存在しないとき
	if (note.renoteId && (await countSameRenotes(user.id, note.renoteId, note.id)) === 0) {
		Notes.decrement({ id: note.renoteId }, 'renoteCount', 1);
		Notes.decrement({ id: note.renoteId }, 'score', 1);
	}

	if (!quiet) {
		publishNoteStream(note.id, 'deleted', {
			deletedAt: deletedAt,
		});

		//#region ローカルの投稿なら削除アクティビティを配送
		if (Users.isLocalUser(user) && !note.localOnly) {
			let renote: Note | undefined;

			// if deletd note is renote
			if (note.renoteId && note.text == null && !note.hasPoll && (note.fileIds == null || note.fileIds.length == 0)) {
				renote = await Notes.findOne({
					id: note.renoteId,
				});
			}

			const content = renderActivity(renote
				? renderUndo(renderAnnounce(renote.uri || `${config.url}/notes/${renote.id}`, note), user)
				: renderDelete(renderTombstone(`${config.url}/notes/${note.id}`), user));

			deliverToConcerned(user, note, content);
		}

		// also deliever delete activity to cascaded notes
		const cascadingNotes = (await findCascadingNotes(note)).filter(note => !note.localOnly); // filter out local-only notes
		for (const cascadingNote of cascadingNotes) {
			if (!cascadingNote.user) continue;
			if (!Users.isLocalUser(cascadingNote.user)) continue;
			const content = renderActivity(renderDelete(renderTombstone(`${config.url}/notes/${cascadingNote.id}`), cascadingNote.user));
			deliverToConcerned(cascadingNote.user, cascadingNote, content);
		}
		//#endregion

		// 統計を更新
		notesChart.update(note, false);
		perUserNotesChart.update(user, note, false);

		if (Users.isRemoteUser(user)) {
			registerOrFetchInstanceDoc(user.host).then(i => {
				Instances.decrement({ id: i.id }, 'notesCount', 1);
				instanceChart.updateNote(i.host, note, false);
			});
		}
	}

	await Notes.delete({
		id: note.id,
		userId: user.id,
	});
}

async function findCascadingNotes(note: Note) {
	const cascadingNotes: Note[] = [];

	const recursive = async (noteId: string) => {
		const query = Notes.createQueryBuilder('note')
			.where('note.replyId = :noteId', { noteId })
			.orWhere(new Brackets(q => {
				q.where('note.renoteId = :noteId', { noteId })
				.andWhere('note.text IS NOT NULL');
			}))
			.leftJoinAndSelect('note.user', 'user');
		const replies = await query.getMany();
		for (const reply of replies) {
			cascadingNotes.push(reply);
			await recursive(reply.id);
		}
	};
	await recursive(note.id);

	return cascadingNotes.filter(note => note.userHost === null); // filter out non-local users
}

async function getMentionedRemoteUsers(note: Note) {
	const where = [] as any[];

	// mention / reply / dm
	const uris = (JSON.parse(note.mentionedRemoteUsers) as IMentionedRemoteUsers).map(x => x.uri);
	if (uris.length > 0) {
		where.push(
			{ uri: In(uris) }
		);
	}

	// renote / quote
	if (note.renoteUserId) {
		where.push({
			id: note.renoteUserId,
		});
	}

	if (where.length === 0) return [];

	return await Users.find({
		where,
	}) as IRemoteUser[];
}

async function deliverToConcerned(user: ILocalUser, note: Note, content: any) {
	deliverToFollowers(user, content);
	deliverToRelays(user, content);
	const remoteUsers = await getMentionedRemoteUsers(note);
	for (const remoteUser of remoteUsers) {
		deliverToUser(user, content, remoteUser);
	}
}
