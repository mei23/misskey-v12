import { Instance } from '@/models/entities/instance';
import { Instances } from '@/models/index';
import { federationChart } from '@/services/chart/index';
import { genId } from '@/misc/gen-id';
import { toPuny } from '@/misc/convert-host';
import { Cache } from '@/misc/cache';

const cache = new Cache<Instance>(1000 * 60 * 60);

export async function registerOrFetchInstanceDoc(host: string): Promise<Instance> {
	host = toPuny(host);

	const cached = cache.get(host);
	if (cached) return cached;

	const index = await Instances.findOne({ host });

	if (index == null) {
		const i = await Instances.insert({
			id: genId(),
			host,
			caughtAt: new Date(),
			lastCommunicatedAt: new Date(),
		}).then(x => Instances.findOneOrFail(x.identifiers[0]));

		federationChart.update(true);

		cache.set(host, i);
		return i;
	} else {
		cache.set(host, index);
		return index;
	}
}
