export function structuredClone<T>(s: T): T {
	return JSON.parse(JSON.stringify(s));
}
