import * as http from 'http';
import * as websocket from 'websocket';

import MainStreamConnection from './stream/index';
import { ParsedUrlQuery } from 'querystring';
import authenticate from './authenticate';
import { EventEmitter } from 'events';
import { subsdcriber as redisClient } from '../../db/redis';
import { Users } from '@/models/index';

module.exports = (server: http.Server) => {
	// Init websocket server
	const ws = new websocket.server({
		httpServer: server,
	});

	ws.on('request', async (request) => {
		const q = request.resourceURL.query as ParsedUrlQuery;

		const [user, app] = await authenticate(q.i as string);

		if (user?.isSuspended) {
			request.reject(400);
			return;
		}

		const connection = request.accept();

		const ev = new EventEmitter();

		async function onRedisMessage(_: string, data: string) {
			const parsed = JSON.parse(data);
			ev.emit(parsed.channel, parsed.message);
		}

		redisClient.on('message', onRedisMessage);

		const main = new MainStreamConnection(connection, ev, user, app);

		const intervalId = user ? setInterval(() => {
			Users.update(user.id, {
				lastActiveDate: new Date(),
			});
		}, 1000 * 60 * 5) : null;
		if (user) {
			Users.update(user.id, {
				lastActiveDate: new Date(),
			});
		}

		connection.once('close', () => {
			ev.removeAllListeners();
			main.dispose();
			redisClient.off('message', onRedisMessage);
			if (intervalId) clearInterval(intervalId);
		});

		connection.on('message', async (data) => {
			if (data.type === 'utf8' && data.utf8Data === 'ping') {
				connection.send('pong');
			}
		});
	});
};
