import autobind from 'autobind-decorator';
import Chart, { DeepPartial } from '../core';
import { User } from '@/models/entities/user';
import { Note } from '@/models/entities/note';
import { SchemaType } from '@/misc/schema';
import { Users } from '@/models/index';
import { name, schema } from './entities/per-user-reactions';

type PerUserReactionsLog = SchemaType<typeof schema>;

/**
 * ユーザーごとのリアクションに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class PerUserReactionsChart extends Chart<PerUserReactionsLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected genNewLog(latest: PerUserReactionsLog): DeepPartial<PerUserReactionsLog> {
		return {};
	}

	@autobind
	protected aggregate(logs: PerUserReactionsLog[]): PerUserReactionsLog {
		return {
			local: {
				count: logs.reduce((a, b) => a + b.local.count, 0),
			},
			remote: {
				count: logs.reduce((a, b) => a + b.remote.count, 0),
			},
		};
	}

	@autobind
	protected async fetchActual(group: string): Promise<DeepPartial<PerUserReactionsLog>> {
		return {};
	}

	@autobind
	public async update(user: { id: User['id'], host: User['host'] }, note: Note): Promise<void> {
		this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: { count: 1 },
		}, note.userId);
	}
}
