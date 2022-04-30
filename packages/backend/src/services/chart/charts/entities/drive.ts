import Chart from '../../core.js';

export const name = 'drive';

export const schema = {
	'local.incCount': {},
	'local.incSize': {}, // in kilobyte
	'local.decCount': {},
	'local.decSize': {}, // in kilobyte
	'remote.incCount': {},
	'remote.incSize': {}, // in kilobyte
	'remote.decCount': {},
	'remote.decSize': {}, // in kilobyte
} as const;

export const entity = Chart.schemaToEntity(name, schema);
