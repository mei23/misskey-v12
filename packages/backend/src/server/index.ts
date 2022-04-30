/**
 * Core Server
 */

import * as fs from 'node:fs';
import * as http from 'http';
import Koa from 'koa';
import Router from '@koa/router';
import mount from 'koa-mount';
import koaLogger from 'koa-logger';
import * as slow from 'koa-slow';

import activityPub from './activitypub.js';
import nodeinfo from './nodeinfo.js';
import wellKnown from './well-known.js';
import config from '@/config/index.js';
import apiServer from './api/index.js';
import fileServer from './file/index.js';
import proxyServer from './proxy/index.js';
import webServer from './web/index.js';
import Logger from '@/services/logger.js';
import { envOption } from '../env.js';
import { UserProfiles, Users } from '@/models/index.js';
import { genIdenticon } from '@/misc/gen-identicon.js';
import { createTemp } from '@/misc/create-temp.js';
import { publishMainStream } from '@/services/stream.js';
import * as Acct from '@/misc/acct.js';
import { initializeStreamingServer } from './api/streaming.js';

export const serverLogger = new Logger('server', 'gray', false);

// Init app
const app = new Koa();
app.proxy = true;

if (!['production', 'test'].includes(process.env.NODE_ENV || '')) {
	// Logger
	app.use(koaLogger(str => {
		serverLogger.info(str);
	}));

	// Delay
	if (envOption.slow) {
		app.use(slow({
			delay: 3000,
		}));
	}
}

// HSTS
// 6months (15552000sec)
if (config.url.startsWith('https') && !config.disableHsts) {
	app.use(async (ctx, next) => {
		ctx.set('strict-transport-security', 'max-age=15552000; preload');
		await next();
	});
}

app.use(mount('/api', apiServer));
app.use(mount('/files', fileServer));
app.use(mount('/proxy', proxyServer));

// Init router
const router = new Router();

// Routing
router.use(activityPub.routes());
router.use(nodeinfo.routes());
router.use(wellKnown.routes());

router.get('/avatar/@:acct', async ctx => {
	const { username, host } = Acct.parse(ctx.params.acct);
	const user = await Users.findOne({
		usernameLower: username.toLowerCase(),
		host: host === config.host ? null : host,
		isSuspended: false,
	}, {
		relations: ['avatar'],
	});

	if (user) {
		ctx.redirect(Users.getAvatarUrl(user));
	} else {
		ctx.redirect('/static-assets/user-unknown.png');
	}
});

router.get('/identicon/:x', async ctx => {
	const [temp] = await createTemp();
	await genIdenticon(ctx.params.x, fs.createWriteStream(temp));
	ctx.set('Content-Type', 'image/png');
	ctx.body = fs.createReadStream(temp);
});

router.get('/verify-email/:code', async ctx => {
	const profile = await UserProfiles.findOne({
		emailVerifyCode: ctx.params.code,
	});

	if (profile != null) {
		ctx.body = 'Verify succeeded!';
		ctx.status = 200;

		await UserProfiles.update({ userId: profile.userId }, {
			emailVerified: true,
			emailVerifyCode: null,
		});

		publishMainStream(profile.userId, 'meUpdated', await Users.pack(profile.userId, { id: profile.userId }, {
			detail: true,
			includeSecrets: true,
		}));
	} else {
		ctx.status = 404;
	}
});

// Register router
app.use(router.routes());

app.use(mount(webServer));

function createServer() {
	return http.createServer(app.callback());
}

// For testing
export const startServer = () => {
	const server = createServer();

	initializeStreamingServer(server);

	server.listen(config.port);

	return server;
};

export default () => new Promise(resolve => {
	const server = createServer();

	initializeStreamingServer(server);

	server.listen(config.port, resolve);
});
