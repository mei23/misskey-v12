import { computed } from 'vue';
import * as Misskey from 'misskey-js';

// TODO: 他のタブと永続化されたstateを同期

export const instance: Misskey.entities.InstanceMetadata = JSON.parse(document.querySelector('#initial-meta')?.textContent || '{}');

export const emojiCategories = computed(() => {
	if (instance.emojis == null) return [];
	const categories = new Set();
	for (const emoji of instance.emojis) {
		categories.add(emoji.category);
	}
	return Array.from(categories);
});

export const emojiTags = computed(() => {
	if (instance.emojis == null) return [];
	const tags = new Set();
	for (const emoji of instance.emojis) {
		for (const tag of emoji.aliases) {
			tags.add(tag);
		}
	}
	return Array.from(tags);
});

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$instance: typeof instance;
	}
}
