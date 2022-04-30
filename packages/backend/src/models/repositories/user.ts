import $ from 'cafy';
import { EntityRepository, Repository, In, Not } from 'typeorm';
import { User, ILocalUser, IRemoteUser } from '@/models/entities/user';
import { Notes, NoteUnreads, FollowRequests, Notifications, MessagingMessages, UserNotePinings, Followings, Blockings, Mutings, UserProfiles, UserSecurityKeys, UserGroupJoinings, Pages, Announcements, AnnouncementReads, Antennas, AntennaNotes, ChannelFollowings, Instances } from '../index';
import config from '@/config/index';
import { Packed } from '@/misc/schema';
import { awaitAll, Promiseable } from '@/prelude/await-all';
import { populateEmojis } from '@/misc/populate-emojis';
import { getAntennas } from '@/misc/antenna-cache';
import { USER_ACTIVE_THRESHOLD, USER_ONLINE_THRESHOLD } from '@/const';

type IsUserDetailed<Detailed extends boolean> = Detailed extends true ? Packed<'UserDetailed'> : Packed<'UserLite'>;
type IsMeAndIsUserDetailed<ExpectsMe extends boolean | null, Detailed extends boolean> =
	Detailed extends true ? 
		ExpectsMe extends true ? Packed<'MeDetailed'> :
		ExpectsMe extends false ? Packed<'UserDetailedNotMe'> :
		Packed<'UserDetailed'> :
	Packed<'UserLite'>;

@EntityRepository(User)
export class UserRepository extends Repository<User> {
	public async getRelation(me: User['id'], target: User['id']) {
		const [following1, following2, followReq1, followReq2, toBlocking, fromBlocked, mute] = await Promise.all([
			Followings.findOne({
				followerId: me,
				followeeId: target,
			}),
			Followings.findOne({
				followerId: target,
				followeeId: me,
			}),
			FollowRequests.findOne({
				followerId: me,
				followeeId: target,
			}),
			FollowRequests.findOne({
				followerId: target,
				followeeId: me,
			}),
			Blockings.findOne({
				blockerId: me,
				blockeeId: target,
			}),
			Blockings.findOne({
				blockerId: target,
				blockeeId: me,
			}),
			Mutings.findOne({
				muterId: me,
				muteeId: target,
			}),
		]);

		return {
			id: target,
			isFollowing: following1 != null,
			hasPendingFollowRequestFromYou: followReq1 != null,
			hasPendingFollowRequestToYou: followReq2 != null,
			isFollowed: following2 != null,
			isBlocking: toBlocking != null,
			isBlocked: fromBlocked != null,
			isMuted: mute != null,
		};
	}

	public async getHasUnreadMessagingMessage(userId: User['id']): Promise<boolean> {
		const mute = await Mutings.find({
			muterId: userId,
		});

		const joinings = await UserGroupJoinings.find({ userId: userId });

		const groupQs = Promise.all(joinings.map(j => MessagingMessages.createQueryBuilder('message')
			.where(`message.groupId = :groupId`, { groupId: j.userGroupId })
			.andWhere('message.userId != :userId', { userId: userId })
			.andWhere('NOT (:userId = ANY(message.reads))', { userId: userId })
			.andWhere('message.createdAt > :joinedAt', { joinedAt: j.createdAt }) // 自分が加入する前の会話については、未読扱いしない
			.getOne().then(x => x != null)));

		const [withUser, withGroups] = await Promise.all([
			MessagingMessages.count({
				where: {
					recipientId: userId,
					isRead: false,
					...(mute.length > 0 ? { userId: Not(In(mute.map(x => x.muteeId))) } : {}),
				},
				take: 1,
			}).then(count => count > 0),
			groupQs,
		]);

		return withUser || withGroups.some(x => x);
	}

	public async getHasUnreadAnnouncement(userId: User['id']): Promise<boolean> {
		const reads = await AnnouncementReads.find({
			userId: userId,
		});

		const count = await Announcements.count(reads.length > 0 ? {
			id: Not(In(reads.map(read => read.announcementId))),
		} : {});

		return count > 0;
	}

	public async getHasUnreadAntenna(userId: User['id']): Promise<boolean> {
		const myAntennas = (await getAntennas()).filter(a => a.userId === userId);

		const unread = myAntennas.length > 0 ? await AntennaNotes.findOne({
			antennaId: In(myAntennas.map(x => x.id)),
			read: false,
		}) : null;

		return unread != null;
	}

	public async getHasUnreadChannel(userId: User['id']): Promise<boolean> {
		const channels = await ChannelFollowings.find({ followerId: userId });

		const unread = channels.length > 0 ? await NoteUnreads.findOne({
			userId: userId,
			noteChannelId: In(channels.map(x => x.followeeId)),
		}) : null;

		return unread != null;
	}

	public async getHasUnreadNotification(userId: User['id']): Promise<boolean> {
		const mute = await Mutings.find({
			muterId: userId,
		});
		const mutedUserIds = mute.map(m => m.muteeId);

		const count = await Notifications.count({
			where: {
				notifieeId: userId,
				...(mutedUserIds.length > 0 ? { notifierId: Not(In(mutedUserIds)) } : {}),
				isRead: false,
			},
			take: 1,
		});

		return count > 0;
	}

	public async getHasPendingReceivedFollowRequest(userId: User['id']): Promise<boolean> {
		const count = await FollowRequests.count({
			followeeId: userId,
		});

		return count > 0;
	}

	public getOnlineStatus(user: User): 'unknown' | 'online' | 'active' | 'offline' {
		if (user.hideOnlineStatus) return 'unknown';
		if (user.lastActiveDate == null) return 'unknown';
		const elapsed = Date.now() - user.lastActiveDate.getTime();
		return (
			elapsed < USER_ONLINE_THRESHOLD ? 'online' :
			elapsed < USER_ACTIVE_THRESHOLD ? 'active' :
			'offline'
		);
	}

	public getAvatarUrl(user: User): string {
		if (user.avatarUrl) {
			return user.avatarUrl;
		} else {
			return `${config.url}/identicon/${user.id}`;
		}
	}

	public async pack<ExpectsMe extends boolean | null = null, D extends boolean = false>(
		src: User['id'] | User,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: D,
			includeSecrets?: boolean,
		}
	): Promise<IsMeAndIsUserDetailed<ExpectsMe, D>> {
		const opts = Object.assign({
			detail: false,
			includeSecrets: false,
		}, options);

		const user = typeof src === 'object' ? src : await this.findOneOrFail(src);
		const meId = me ? me.id : null;
		const isMe = meId === user.id;

		const relation = meId && !isMe && opts.detail ? await this.getRelation(meId, user.id) : null;
		const pins = opts.detail ? await UserNotePinings.createQueryBuilder('pin')
			.where('pin.userId = :userId', { userId: user.id })
			.innerJoinAndSelect('pin.note', 'note')
			.orderBy('pin.id', 'DESC')
			.getMany() : [];
		const profile = opts.detail ? await UserProfiles.findOneOrFail(user.id) : null;

		const followingCount = profile == null ? null :
			(profile.ffVisibility === 'public') || isMe ? user.followingCount :
			(profile.ffVisibility === 'followers') && (relation && relation.isFollowing) ? user.followingCount :
			null;

		const followersCount = profile == null ? null :
			(profile.ffVisibility === 'public') || isMe ? user.followersCount :
			(profile.ffVisibility === 'followers') && (relation && relation.isFollowing) ? user.followersCount :
			null;

		const falsy = opts.detail ? false : undefined;

		const packed = {
			id: user.id,
			name: user.name,
			username: user.username,
			host: user.host,
			avatarUrl: this.getAvatarUrl(user),
			avatarBlurhash: user.avatarBlurhash,
			avatarColor: null, // 後方互換性のため
			isAdmin: user.isAdmin || falsy,
			isModerator: user.isModerator || falsy,
			isBot: user.isBot || falsy,
			isCat: user.isCat || falsy,
			instance: user.host ? Instances.findOne({ host: user.host }).then(instance => instance ? {
				name: instance.name,
				softwareName: instance.softwareName,
				softwareVersion: instance.softwareVersion,
				iconUrl: instance.iconUrl,
				faviconUrl: instance.faviconUrl,
				themeColor: instance.themeColor,
			} : undefined) : undefined,
			emojis: populateEmojis(user.emojis, user.host),
			onlineStatus: this.getOnlineStatus(user),

			...(opts.detail ? {
				url: profile!.url,
				uri: user.uri,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
				lastFetchedAt: user.lastFetchedAt ? user.lastFetchedAt.toISOString() : null,
				bannerUrl: user.bannerUrl,
				bannerBlurhash: user.bannerBlurhash,
				bannerColor: null, // 後方互換性のため
				isLocked: user.isLocked,
				isSilenced: user.isSilenced || falsy,
				isSuspended: user.isSuspended || falsy,
				description: profile!.description,
				location: profile!.location,
				birthday: profile!.birthday,
				lang: profile!.lang,
				fields: profile!.fields,
				followersCount: followersCount || 0,
				followingCount: followingCount || 0,
				notesCount: user.notesCount,
				pinnedNoteIds: pins.map(pin => pin.noteId),
				pinnedNotes: Notes.packMany(pins.map(pin => pin.note!), me, {
					detail: true,
				}),
				pinnedPageId: profile!.pinnedPageId,
				pinnedPage: profile!.pinnedPageId ? Pages.pack(profile!.pinnedPageId, me) : null,
				publicReactions: profile!.publicReactions,
				ffVisibility: profile!.ffVisibility,
				twoFactorEnabled: profile!.twoFactorEnabled,
				usePasswordLessLogin: profile!.usePasswordLessLogin,
				securityKeys: profile!.twoFactorEnabled
					? UserSecurityKeys.count({
						userId: user.id,
					}).then(result => result >= 1)
					: false,
			} : {}),

			...(opts.detail && isMe ? {
				avatarId: user.avatarId,
				bannerId: user.bannerId,
				injectFeaturedNote: profile!.injectFeaturedNote,
				receiveAnnouncementEmail: profile!.receiveAnnouncementEmail,
				alwaysMarkNsfw: profile!.alwaysMarkNsfw,
				carefulBot: profile!.carefulBot,
				autoAcceptFollowed: profile!.autoAcceptFollowed,
				noCrawle: profile!.noCrawle,
				isExplorable: user.isExplorable,
				isDeleted: user.isDeleted,
				hideOnlineStatus: user.hideOnlineStatus,
				hasUnreadSpecifiedNotes: NoteUnreads.count({
					where: { userId: user.id, isSpecified: true },
					take: 1,
				}).then(count => count > 0),
				hasUnreadMentions: NoteUnreads.count({
					where: { userId: user.id, isMentioned: true },
					take: 1,
				}).then(count => count > 0),
				hasUnreadAnnouncement: this.getHasUnreadAnnouncement(user.id),
				hasUnreadAntenna: this.getHasUnreadAntenna(user.id),
				hasUnreadChannel: this.getHasUnreadChannel(user.id),
				hasUnreadMessagingMessage: this.getHasUnreadMessagingMessage(user.id),
				hasUnreadNotification: this.getHasUnreadNotification(user.id),
				hasPendingReceivedFollowRequest: this.getHasPendingReceivedFollowRequest(user.id),
				integrations: profile!.integrations,
				mutedWords: profile!.mutedWords,
				mutedInstances: profile!.mutedInstances,
				mutingNotificationTypes: profile!.mutingNotificationTypes,
				emailNotificationTypes: profile!.emailNotificationTypes,
			} : {}),

			...(opts.includeSecrets ? {
				email: profile!.email,
				emailVerified: profile!.emailVerified,
				securityKeysList: profile!.twoFactorEnabled
					? UserSecurityKeys.find({
						where: {
							userId: user.id,
						},
						select: ['id', 'name', 'lastUsed'],
					})
					: [],
			} : {}),

			...(relation ? {
				isFollowing: relation.isFollowing,
				isFollowed: relation.isFollowed,
				hasPendingFollowRequestFromYou: relation.hasPendingFollowRequestFromYou,
				hasPendingFollowRequestToYou: relation.hasPendingFollowRequestToYou,
				isBlocking: relation.isBlocking,
				isBlocked: relation.isBlocked,
				isMuted: relation.isMuted,
			} : {}),
		} as Promiseable<Packed<'User'>> as Promiseable<IsMeAndIsUserDetailed<ExpectsMe, D>>;

		return await awaitAll(packed);
	}

	public packMany<D extends boolean = false>(
		users: (User['id'] | User)[],
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: D,
			includeSecrets?: boolean,
		}
	): Promise<IsUserDetailed<D>[]> {
		return Promise.all(users.map(u => this.pack(u, me, options)));
	}

	public isLocalUser(user: User): user is ILocalUser;
	public isLocalUser<T extends { host: User['host'] }>(user: T): user is T & { host: null; };
	public isLocalUser(user: User | { host: User['host'] }): boolean {
		return user.host == null;
	}

	public isRemoteUser(user: User): user is IRemoteUser;
	public isRemoteUser<T extends { host: User['host'] }>(user: T): user is T & { host: string; };
	public isRemoteUser(user: User | { host: User['host'] }): boolean {
		return !this.isLocalUser(user);
	}

	//#region Validators
	public validateLocalUsername = $.str.match(/^\w{1,20}$/);
	public validatePassword = $.str.min(1);
	public validateName = $.str.min(1).max(50);
	public validateDescription = $.str.min(1).max(500);
	public validateLocation = $.str.min(1).max(50);
	public validateBirthday = $.str.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
	//#endregion
}
