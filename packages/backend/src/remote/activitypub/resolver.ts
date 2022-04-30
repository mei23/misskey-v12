import config from '@/config/index';
import { getJson } from '@/misc/fetch';
import { ILocalUser } from '@/models/entities/user';
import { getInstanceActor } from '@/services/instance-actor';
import { signedGet } from './request';
import { IObject, isCollectionOrOrderedCollection, ICollection, IOrderedCollection } from './type';
import { fetchMeta } from '@/misc/fetch-meta';
import { extractDbHost } from '@/misc/convert-host';

export default class Resolver {
	private history: Set<string>;
	private user?: ILocalUser;

	constructor() {
		this.history = new Set();
	}

	public getHistory(): string[] {
		return Array.from(this.history);
	}

	public async resolveCollection(value: string | IObject): Promise<ICollection | IOrderedCollection> {
		const collection = typeof value === 'string'
			? await this.resolve(value)
			: value;

		if (isCollectionOrOrderedCollection(collection)) {
			return collection;
		} else {
			throw new Error(`unrecognized collection type: ${collection.type}`);
		}
	}

	public async resolve(value: string | IObject): Promise<IObject> {
		if (value == null) {
			throw new Error('resolvee is null (or undefined)');
		}

		if (typeof value !== 'string') {
			return value;
		}

		if (this.history.has(value)) {
			throw new Error('cannot resolve already resolved one');
		}

		this.history.add(value);

		const meta = await fetchMeta();
		const host = extractDbHost(value);
		if (meta.blockedHosts.includes(host)) {
			throw new Error('Instance is blocked');
		}

		if (config.signToActivityPubGet && !this.user) {
			this.user = await getInstanceActor();
		}

		const object = this.user
			? await signedGet(value, this.user)
			: await getJson(value, 'application/activity+json, application/ld+json');

		if (object == null || (
			Array.isArray(object['@context']) ?
				!object['@context'].includes('https://www.w3.org/ns/activitystreams') :
				object['@context'] !== 'https://www.w3.org/ns/activitystreams'
		)) {
			throw new Error('invalid response');
		}

		return object;
	}
}
