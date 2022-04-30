import * as cluster from 'cluster';
import * as chalk from 'chalk';
import * as tls from 'tls';
import Xev from 'xev';

import Logger from '@/services/logger';
import { envOption } from '../env';

// for typeorm
import 'reflect-metadata';
import { masterMain } from './master';
import { workerMain } from './worker';
import config from '@/config';

const logger = new Logger('core', 'cyan');
const clusterLogger = logger.createSubLogger('cluster', 'orange', false);
const ev = new Xev();

/**
 * Init process
 */
export default async function() {
	if (config.minTlsVersion) {
		(tls as any).DEFAULT_MIN_VERSION = config.minTlsVersion;
	}

	process.title = `Misskey (${cluster.isPrimary ? 'master' : 'worker'})`;

	if (cluster.isPrimary || envOption.disableClustering) {
		await masterMain();

		if (cluster.isPrimary) {
			ev.mount();
		}
	}

	if (cluster.isWorker || envOption.disableClustering) {
		await workerMain();
	}

	// ユニットテスト時にMisskeyが子プロセスで起動された時のため
	// それ以外のときは process.send は使えないので弾く
	if (process.send) {
		process.send('ok');
	}
}

//#region Events

// Listen new workers
cluster.on('fork', worker => {
	clusterLogger.debug(`Process forked: [${worker.id}]`);
});

// Listen online workers
cluster.on('online', worker => {
	clusterLogger.debug(`Process is now online: [${worker.id}]`);
});

// Listen for dying workers
cluster.on('exit', worker => {
	// Replace the dead worker,
	// we're not sentimental
	clusterLogger.error(chalk.red(`[${worker.id}] died :(`));
	cluster.fork();
});

// Display detail of unhandled promise rejection
if (!envOption.quiet) {
	process.on('unhandledRejection', console.dir);
}

// Display detail of uncaught exception
process.on('uncaughtException', err => {
	try {
		logger.error(err);
	} catch { }
});

// Dying away...
process.on('exit', code => {
	logger.info(`The process is going to exit with code ${code}`);
});

//#endregion
