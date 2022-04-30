import Channel from '../channel.js';
import { Notes } from '@/models/index.js';
import { isInstanceMuted, isUserFromMutedInstance } from '@/misc/is-instance-muted.js';

export default class extends Channel {
	public readonly chName = 'main';
	public static shouldShare = true;
	public static requireCredential = true;

	public async init(params: any) {
		// Subscribe main stream channel
		this.subscriber.on(`mainStream:${this.user!.id}`, async data => {
			switch (data.type) {
				case 'notification': {
					// Ignore notifications from instances the user has muted
					if (isUserFromMutedInstance(data.body, new Set<string>(this.userProfile?.mutedInstances ?? []))) return;
					if (data.body.userId && this.muting.has(data.body.userId)) return;

					if (data.body.note && data.body.note.isHidden) {
						const note = await Notes.pack(data.body.note.id, this.user, {
							detail: true,
						});
						this.connection.cacheNote(note);
						data.body.note = note;
					}
					break;
				}
				case 'mention': {
					if (isInstanceMuted(data.body, new Set<string>(this.userProfile?.mutedInstances ?? []))) return;

					if (this.muting.has(data.body.userId)) return;
					if (data.body.isHidden) {
						const note = await Notes.pack(data.body.id, this.user, {
							detail: true,
						});
						this.connection.cacheNote(note);
						data.body = note;
					}
					break;
				}
			}

			this.send(data.type, data.body);
		});
	}
}
