import Chart from '../../core.js';

export const name = 'testUnique';

export const schema = {
	'foo': { uniqueIncrement: true },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
