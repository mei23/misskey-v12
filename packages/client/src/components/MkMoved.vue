<template>
<div class="_block" :class="$style.mkmoved">
	<i class="fas fa-info-circle" style="margin-right: 8px;"></i>{{ i18n.ts.accountMoved }}
	<MkMention :username="props.user.username" :host="props.user.host || host"/>
</div>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';
import { i18n } from '@/i18n';
import { host  } from '@/config';
import MkMention from '@/components/MkMention.vue';

const props = defineProps<{
	user: misskey.entities.UserDetailed;
}>();
</script>

<style lang="scss" module>
.mkmoved {
	font-size: 0.8em;
	padding: 16px;
	background: var(--infoBg);
	color: var(--infoFg);
}

.link {
	margin-left: 4px;
}
</style>
