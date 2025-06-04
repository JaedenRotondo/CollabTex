<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Snackbar from '$lib/components/Snackbar.svelte';
	import { createEventDispatcher } from 'svelte';

	export let projectName: string = '';
	export let roomId: string = '';
	export let isOpen: boolean = false;

	const dispatch = createEventDispatcher();

	let shares: Array<{
		id: string;
		username: string | null;
		permission: 'view' | 'edit';
		isPublic: boolean;
	}> = [];
	let loading = true;
	let error = '';
	let shareUsername = '';
	let sharePermission: 'view' | 'edit' = 'view';
	let publicLinkPermission: 'view' | 'edit' = 'view';
	let sharing = false;
	let snackbarMessage = '';
	let snackbarType: 'success' | 'error' | 'info' = 'info';
	let showSnackbar = false;

	$: if (isOpen && roomId) {
		loadShares();
	}

	async function loadShares() {
		loading = true;
		error = '';
		try {
			const response = await fetch(`/api/projects/${roomId}/share`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error('Load shares error:', response.status, errorData);
				
				if (response.status === 403) {
					error = 'Only project owners can manage sharing settings';
				} else if (response.status === 401) {
					error = 'Please log in to manage sharing settings';
				} else {
					throw new Error(errorData.error || `Failed to load shares (${response.status})`);
				}
				return;
			}
			const data = await response.json();
			shares = data.shares;
		} catch (err) {
			console.error('Load shares error:', err);
			error = err instanceof Error ? err.message : 'Failed to load shares';
		} finally {
			loading = false;
		}
	}

	async function shareWithUser() {
		if (!shareUsername.trim()) return;

		sharing = true;
		error = '';
		try {
			const response = await fetch(`/api/projects/${roomId}/share`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: shareUsername,
					permission: sharePermission
				})
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				console.error('Share user error:', response.status, data);
				throw new Error(data.error || `Failed to share project (${response.status})`);
			}

			const sharedWith = shareUsername;
			shareUsername = '';
			await loadShares();
			showSnackbar = true;
			snackbarType = 'success';
			snackbarMessage = `Project shared with ${sharedWith} successfully`;
		} catch (err: any) {
			error = err.message || 'Failed to share project';
		} finally {
			sharing = false;
		}
	}

	async function createPublicLink() {
		sharing = true;
		error = '';
		try {
			const response = await fetch(`/api/projects/${roomId}/share`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					permission: publicLinkPermission
				})
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				console.error('Create public link error:', response.status, data);
				throw new Error(data.error || `Failed to create public link (${response.status})`);
			}

			await loadShares();
			showSnackbar = true;
			snackbarType = 'success';
			snackbarMessage = 'Public link created successfully';
		} catch (err) {
			error = 'Failed to create public link';
			console.error(err);
		} finally {
			sharing = false;
		}
	}

	async function removeShare(shareId: string) {
		try {
			const response = await fetch(`/api/projects/${roomId}/share`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ shareId })
			});

			if (!response.ok) {
				throw new Error('Failed to remove share');
			}

			await loadShares();
			showSnackbar = true;
			snackbarType = 'success';
			snackbarMessage = 'Share removed successfully';
		} catch (err) {
			error = 'Failed to remove share';
			console.error(err);
		}
	}

	function close() {
		dispatch('close');
		isOpen = false;
	}

	function copyPublicLink() {
		const url = `${window.location.origin}/editor/${roomId}`;
		navigator.clipboard.writeText(url).then(() => {
			showSnackbar = true;
			snackbarType = 'success';
			snackbarMessage = 'Link copied to clipboard';
		}).catch(() => {
			showSnackbar = true;
			snackbarType = 'error';
			snackbarMessage = 'Failed to copy link';
		});
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" on:click={close}>
		<div
			class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
			on:click|stopPropagation
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">Share "{projectName}"</h2>
				<button
					on:click={close}
					class="text-gray-500 hover:text-gray-700"
				>
					✕
				</button>
			</div>

			{#if error}
				<div class="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
					{error}
				</div>
			{/if}

			{#if error && (error.includes('owner') || error.includes('log in'))}
				<!-- Show room link for non-owners -->
				<div class="space-y-4">
					<div>
						<h3 class="mb-3 font-medium">Room Link</h3>
						<p class="text-sm text-gray-600 mb-2">You can share this room link with others:</p>
						<div class="flex gap-2">
							<input
								type="text"
								value={`${window.location.origin}/editor/${roomId}`}
								readonly
								class="flex-1 rounded border bg-gray-50 px-3 py-2 text-sm"
							/>
							<Button size="sm" on:click={copyPublicLink}>
								Copy
							</Button>
						</div>
					</div>
				</div>
				<div class="mt-6 flex justify-end">
					<Button variant="outline" on:click={close}>
						Close
					</Button>
				</div>
			{:else}
				<div class="space-y-6">
				<!-- Share with specific user -->
				<div>
					<h3 class="mb-3 font-medium">Share with user</h3>
					<form on:submit|preventDefault={shareWithUser} class="flex gap-2">
						<input
							type="text"
							bind:value={shareUsername}
							placeholder="Username"
							class="flex-1 rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
							disabled={sharing}
						/>
						<select
							bind:value={sharePermission}
							class="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
							disabled={sharing}
						>
							<option value="view">View</option>
							<option value="edit">Edit</option>
						</select>
						<Button type="submit" disabled={sharing || !shareUsername.trim()}>
							Share
						</Button>
					</form>
				</div>

				<!-- Public link -->
				<div>
					<h3 class="mb-3 font-medium">Public link</h3>
					{#if shares.some(s => s.isPublic)}
						<div class="rounded bg-gray-50 p-3">
							<div class="mb-2 flex items-center justify-between">
								<span class="text-sm">
									Anyone with the link can {shares.find(s => s.isPublic)?.permission}
								</span>
								<button
									on:click={() => {
										const publicShare = shares.find(s => s.isPublic);
										if (publicShare) removeShare(publicShare.id);
									}}
									class="text-sm text-red-600 hover:underline"
								>
									Remove
								</button>
							</div>
							<div class="flex gap-2">
								<input
									type="text"
									value={`${window.location.origin}/editor/${roomId}`}
									readonly
									class="flex-1 rounded border bg-white px-3 py-2 text-sm"
								/>
								<Button size="sm" on:click={copyPublicLink}>
									Copy
								</Button>
							</div>
						</div>
					{:else}
						<div class="flex gap-2">
							<select
								bind:value={publicLinkPermission}
								class="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
								disabled={sharing}
							>
								<option value="view">View only</option>
								<option value="edit">Edit</option>
							</select>
							<Button on:click={createPublicLink} disabled={sharing}>
								Create public link
							</Button>
						</div>
					{/if}
				</div>

				<!-- Existing shares -->
				{#if loading}
					<p class="text-gray-500">Loading shares...</p>
				{:else if shares.filter(s => !s.isPublic).length > 0}
					<div>
						<h3 class="mb-3 font-medium">Shared with</h3>
						<div class="space-y-2">
							{#each shares.filter(s => !s.isPublic) as share}
								<div class="flex items-center justify-between rounded bg-gray-50 p-3">
									<div>
										<span class="font-medium">{share.username}</span>
										<span class="ml-2 text-sm text-gray-600">({share.permission})</span>
									</div>
									<button
										on:click={() => removeShare(share.id)}
										class="text-sm text-red-600 hover:underline"
									>
										Remove
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="mt-6 flex justify-end">
				<Button variant="outline" on:click={close}>
					Close
				</Button>
			</div>
		{/if}
		</div>
	</div>
{/if}

<Snackbar
	bind:show={showSnackbar}
	message={snackbarMessage}
	type={snackbarType}
	on:close={() => showSnackbar = false}
/>