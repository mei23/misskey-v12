import Chart from '../../core.js';

export const name = 'perUserDrive';

export const schema = {
	'totalCount': { accumulate: true },
	'totalSize': { accumulate: true }, // in kilobyte
	'incCount': { range: 'small' },
	'incSize': {}, // in kilobyte
	'decCount': { range: 'small' },
	'decSize': {}, // in kilobyte
} as const;

export const entity = Chart.schemaToEntity(name, schema, true);
