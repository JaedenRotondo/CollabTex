<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { buttonVariants, type Variant, type Size } from './index.js';

	type $$Props = HTMLButtonAttributes & {
		variant?: Variant;
		size?: Size;
	};

	let className: $$Props['class'] = undefined;
	export let variant: $$Props['variant'] = 'default';
	export let size: $$Props['size'] = 'default';
	export { className as class };
</script>

<button
	class={cn(buttonVariants({ variant, size }), className)}
	{...$$restProps}
	on:click
	on:keydown
>
	<slot />
</button>
