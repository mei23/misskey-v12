declare var self: ServiceWorkerGlobalScope;

import { createNotification } from '@/scripts/create-notification';
import { swLang } from '@/scripts/lang';
import { pushNotificationDataMap } from '@/types';

self.addEventListener('install', ev => {
	ev.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', ev => {
	ev.waitUntil(
		caches.keys()
			.then(cacheNames => Promise.all(
				cacheNames
					.filter((v) => v !== swLang.cacheName)
					.map(name => caches.delete(name))
			))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', ev => {
	ev.respondWith(
		fetch(ev.request)
		.catch(() => new Response(`Offline. Service Worker @${_VERSION_}`, { status: 200 }))
	);
});

self.addEventListener('push', ev => {
	// クライアント取得
	ev.waitUntil(self.clients.matchAll({
		includeUncontrolled: true,
		type: 'window'
	}).then(async <K extends keyof pushNotificationDataMap>(clients: readonly WindowClient[]) => {
		const data: pushNotificationDataMap[K] = ev.data?.json();

		switch (data.type) {
			case 'notification':
			case 'unreadMessagingMessage':
				// クライアントがあったらストリームに接続しているということなので通知しない
				if (clients.length != 0) return;
				return createNotification(data);
		}
	}));
});

self.addEventListener('notificationclick', <K extends keyof pushNotificationDataMap>(ev: ServiceWorkerGlobalScopeEventMap['notificationclick']) => {
	ev.notification.close();

	ev.waitUntil(self.clients.matchAll({
		type: "window"
	}).then(clientList => {
		for (let i = 0; i < clientList.length; i++) {
			const client = clientList[i];
			if (client.url == '/' && 'focus' in client) {
				return client.focus();
			}
		}
		if (self.clients.openWindow) {
			return self.clients.openWindow('/');
		}
		return null;
	}));

});

self.addEventListener('message', (ev: ServiceWorkerGlobalScopeEventMap['message']) => {
	ev.waitUntil((async () => {
		switch (ev.data) {
			case 'clear':
				// Cache Storage全削除
				await caches.keys()
					.then(cacheNames => Promise.all(
						cacheNames.map(name => caches.delete(name))
					));
				return; // TODO
		}
	
		if (typeof ev.data === 'object') {
			// E.g. '[object Array]' → 'array'
			const otype = Object.prototype.toString.call(ev.data).slice(8, -1).toLowerCase();
	
			if (otype === 'object') {
				if (ev.data.msg === 'initialize') {
					swLang.setLang(ev.data.lang);
				}
			}
		}
	})());
});
