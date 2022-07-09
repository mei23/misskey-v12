/*
 * Notification manager for SW
 */
declare var self: ServiceWorkerGlobalScope;

import { swLang } from '@/scripts/lang';
import { cli } from '@/scripts/operations';
import { pushNotificationDataMap } from '@/types';
import getUserName from '@/scripts/get-user-name';
import { I18n } from '@/scripts/i18n';
import { getAccountFromId } from '@/scripts/get-account-from-id';
import { char2fileName } from '@/scripts/twemoji-base';
import * as url from '@/scripts/url';

const iconUrl = (name: string) => `/static-assets/notification-badges/${name}.png`;

export async function createNotification<K extends keyof pushNotificationDataMap>(data: pushNotificationDataMap[K]) {
	const n = await composeNotification(data);

	if (n) {
		return self.registration.showNotification(...n);
	} else {
		console.error('Could not compose notification', data);
	}
}

async function composeNotification<K extends keyof pushNotificationDataMap>(data: pushNotificationDataMap[K]): Promise<[string, NotificationOptions] | null> {
	if (!swLang.i18n) swLang.fetchLocale();
	const i18n = await swLang.i18n as I18n<any>;
	const { t } = i18n;
	switch (data.type) {
		/*
		case 'driveFileCreated': // TODO (Server Side)
			return [t('_notification.fileUploaded'), {
				body: body.name,
				icon: body.url,
				data
			}];
		*/
		case 'notification':
			switch (data.body.type) {
				case 'follow':
					// users/showの型定義をswos.apiへ当てはめるのが困難なのでapiFetch.requestを直接使用
					const account = await getAccountFromId(data.userId);
					if (!account) return null;
					return [t('_notification.youWereFollowed'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl,
						badge: iconUrl('user-plus'),
						data,
					}];

				case 'mention':
					return [t('_notification.youGotMention', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						badge: iconUrl('at'),
						data,
					}];

				case 'reply':
					return [t('_notification.youGotReply', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						badge: iconUrl('reply'),
						data,
					}];

				case 'renote':
					return [t('_notification.youRenoted', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						badge: iconUrl('retweet'),
						data,
					}];

				case 'quote':
					return [t('_notification.youGotQuote', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						badge: iconUrl('quote-right'),
						data,
					}];

				case 'reaction':
					let reaction = data.body.reaction;
					let badge: string | undefined;

					if (reaction.startsWith(':')) {
						// カスタム絵文字の場合
						const customEmoji = data.body.note.emojis.find(x => x.name === reaction.substr(1, reaction.length - 2));
						if (customEmoji) {
							if (reaction.includes('@')) {
								reaction = `:${reaction.substr(1, reaction.indexOf('@') - 1)}:`;
							}

							const u = new URL(customEmoji.url);
							if (u.href.startsWith(`${origin}/proxy/`)) {
								// もう既にproxyっぽそうだったらsearchParams付けるだけ
								u.searchParams.set('badge', '1');
								badge = u.href;
							} else {
								const dummy = `${u.host}${u.pathname}`;	// 拡張子がないとキャッシュしてくれないCDNがあるので
								badge = `${origin}/proxy/${dummy}?${url.query({
									url: u.href,
									badge: '1'
								})}`;
							}
						}
					} else {
						// Unicode絵文字の場合
						badge = `/twemoji-badge/${char2fileName(reaction)}.png`;
					}


					if (badge ? await fetch(badge).then(res => res.status !== 200).catch(() => true) : true) {
						badge = iconUrl('plus');
					}

					return [`${reaction} ${getUserName(data.body.user)}`, {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						badge,
						data,
					}];

				case 'pollVote':
					return [t('_notification.youGotPoll', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						badge: iconUrl('poll-h'),
						data,
					}];

				case 'pollEnded':
					return [t('_notification.pollEnded'), {
						body: data.body.note.text || '',
						badge: iconUrl('clipboard-check-solid'),
						data,
					}];

				case 'receiveFollowRequest':
					return [t('_notification.youReceivedFollowRequest'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl,
						badge: iconUrl('clock'),
						data,
					}];

				case 'followRequestAccepted':
					return [t('_notification.yourFollowRequestAccepted'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl,
						badge: iconUrl('check'),
						data,
					}];

				case 'groupInvited':
					return [t('_notification.youWereInvitedToGroup', { userName: getUserName(data.body.user) }), {
						body: data.body.invitation.group.name,
						badge: iconUrl('id-card-alt'),
						data,
					}];

				case 'app':
						return [data.body.header || data.body.body, {
							body: data.body.header && data.body.body,
							icon: data.body.icon,
							data
						}];

				default:
					return null;
			}
		case 'unreadMessagingMessage':
			if (data.body.groupId === null) {
				return [t('_notification.youGotMessagingMessageFromUser', { name: getUserName(data.body.user) }), {
					icon: data.body.user.avatarUrl,
					badge: iconUrl('comments'),
					tag: `messaging:user:${data.body.userId}`,
					data,
					renotify: true,
				}];
			}
			return [t('_notification.youGotMessagingMessageFromGroup', { name: data.body.group.name }), {
				icon: data.body.user.avatarUrl,
				badge: iconUrl('comments'),
				tag: `messaging:group:${data.body.groupId}`,
				data,
				renotify: true,
			}];
		default:
			return null;
	}
}
