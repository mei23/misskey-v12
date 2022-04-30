import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../core';
import { SchemaType } from '@/misc/schema';
import { Users } from '@/models/index';
import { Not, IsNull } from 'typeorm';
import { User } from '@/models/entities/user';
import { name, schema } from './entities/users';

type UsersLog = SchemaType<typeof schema>;

/**
 * ユーザー数に関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class UsersChart extends Chart<UsersLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest: UsersLog): DeepPartial<UsersLog> {
		return {
			local: {
				total: latest.local.total,
			},
			remote: {
				total: latest.remote.total,
			},
		};
	}

	@autobind
	protected aggregate(logs: UsersLog[]): UsersLog {
		return {
			local: {
				total: logs[0].local.total,
				inc: logs.reduce((a, b) => a + b.local.inc, 0),
				dec: logs.reduce((a, b) => a + b.local.dec, 0),
			},
			remote: {
				total: logs[0].remote.total,
				inc: logs.reduce((a, b) => a + b.remote.inc, 0),
				dec: logs.reduce((a, b) => a + b.remote.dec, 0),
			},
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<UsersLog>> {
		const [localCount, remoteCount] = await Promise.all([
			Users.count({ host: null }),
			Users.count({ host: Not(IsNull()) }),
		]);

		return {
			local: {
				total: localCount,
			},
			remote: {
				total: remoteCount,
			},
		};
	}

	@autobind
	public async update(user: { id: User['id'], host: User['host'] }, isAdditional: boolean): Promise<void> {
		const update: Obj = {};

		update.total = isAdditional ? 1 : -1;
		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		await this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: update,
		});
	}
}
