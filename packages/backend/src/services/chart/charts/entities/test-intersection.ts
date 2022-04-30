import Chart from '../../core.js';

export const name = 'testIntersection';

export const schema = {
	'a': { uniqueIncrement: true },
	'b': { uniqueIncrement: true },
	'aAndB': { intersection: ['a', 'b'] },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
