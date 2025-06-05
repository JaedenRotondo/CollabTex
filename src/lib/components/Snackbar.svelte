<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let message: string = '';
	export let type: 'success' | 'error' | 'info' = 'info';
	export let duration: number = 3000;
	export let show: boolean = false;

	const dispatch = createEventDispatcher();

	let timeout: NodeJS.Timeout;

	$: if (show && message) {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			show = false;
			dispatch('close');
		}, duration);
	}

	onMount(() => {
		return () => {
			clearTimeout(timeout);
		};
	});

	function close() {
		show = false;
		dispatch('close');
	}

	$: typeClasses = {
		success: 'bg-green-500 text-white',
		error: 'bg-red-500 text-white',
		info: 'bg-blue-500 text-white'
	}[type];
</script>

{#if show && message}
	<div
		class="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg {typeClasses}"
		transition:fly={{ x: 300, duration: 300 }}
		role="alert"
	>
		<div class="flex-1">
			{message}
		</div>
		<button on:click={close} class="text-white/80 hover:text-white" aria-label="Close notification">
			✕
		</button>
	</div>
{/if}
