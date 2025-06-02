<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { WebrtcProvider } from 'y-webrtc';

	export let provider: WebrtcProvider | null = null;

	interface User {
		name: string;
		color: string;
		colorLight: string;
	}

	let users: Map<number, User> = new Map();

	function updateUsers() {
		if (!provider?.awareness) return;

		const states = provider.awareness.getStates();
		users = new Map();

		states.forEach((state, clientId) => {
			if (state.user) {
				users.set(clientId, state.user);
			}
		});

		users = new Map(users);
	}

	onMount(() => {
		if (provider?.awareness) {
			provider.awareness.on('change', updateUsers);
			updateUsers();
		}
	});

	onDestroy(() => {
		if (provider?.awareness) {
			provider.awareness.off('change', updateUsers);
		}
	});
</script>

{#if users.size > 0}
	<div class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-lg">
		<span class="text-sm text-gray-600">Active users:</span>
		<div class="flex -space-x-2">
			{#each Array.from(users.entries()) as [, user], i (user.name)}
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white"
					style="background-color: {user.color}; z-index: {users.size - i}"
					title={user.name}
				>
					{user.name.charAt(0).toUpperCase()}
				</div>
			{/each}
		</div>
		<span class="ml-2 text-sm text-gray-600">
			{users.size}
			{users.size === 1 ? 'user' : 'users'}
		</span>
	</div>
{/if}
