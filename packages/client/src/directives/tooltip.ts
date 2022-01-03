// TODO: useTooltip関数使うようにしたい
// ただディレクティブ内でonUnmountedなどのcomposition api使えるのか不明

import { Directive, ref } from 'vue';
import { isTouchUsing } from '@/scripts/touch';
import { popup, alert } from '@/os';

const start = isTouchUsing ? 'touchstart' : 'mouseover';
const end = isTouchUsing ? 'touchend' : 'mouseleave';
const delay = 100;

export default {
	mounted(el: HTMLElement, binding, vn) {
		const self = (el as any)._tooltipDirective_ = {} as any;

		self.text = binding.value as string;
		self._close = null;
		self.showTimer = null;
		self.hideTimer = null;
		self.checkTimer = null;

		self.close = () => {
			if (self._close) {
				clearInterval(self.checkTimer);
				self._close();
				self._close = null;
			}
		};

		if (binding.arg === 'dialog') {
			el.addEventListener('click', (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				alert({
					type: 'info',
					text: binding.value,
				});
				return false;
			});
		}

		self.show = () => {
			if (!document.body.contains(el)) return;
			if (self._close) return;
			if (self.text == null) return;

			const showing = ref(true);
			popup(import('@/components/ui/tooltip.vue'), {
				showing,
				text: self.text,
				source: el
			}, {}, 'closed');

			self._close = () => {
				showing.value = false;
			};
		};

		el.addEventListener('selectstart', e => {
			e.preventDefault();
		});

		el.addEventListener(start, () => {
			clearTimeout(self.showTimer);
			clearTimeout(self.hideTimer);
			self.showTimer = setTimeout(self.show, delay);
		}, { passive: true });

		el.addEventListener(end, () => {
			clearTimeout(self.showTimer);
			clearTimeout(self.hideTimer);
			self.hideTimer = setTimeout(self.close, delay);
		}, { passive: true });

		el.addEventListener('click', () => {
			clearTimeout(self.showTimer);
			self.close();
		});
	},

	updated(el, binding) {
		const self = el._tooltipDirective_;
		self.text = binding.value as string;
	},

	unmounted(el, binding, vn) {
		const self = el._tooltipDirective_;
		clearInterval(self.checkTimer);
	},
} as Directive;
