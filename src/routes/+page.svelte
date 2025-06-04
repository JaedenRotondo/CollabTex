<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Upload } from 'lucide-svelte';

	let roomId = '';
	let importing = false;
	let fileInput: HTMLInputElement;

	function createNewRoom() {
		const newRoomId = generateRoomId();
		goto(`/editor/${newRoomId}`);
	}

	function joinRoom() {
		if (roomId.trim()) {
			goto(`/editor/${roomId.trim()}`);
		}
	}

	function generateRoomId(): string {
		// Use crypto.randomUUID for better security
		if (typeof crypto !== 'undefined' && crypto.randomUUID) {
			return crypto.randomUUID();
		}
		// Fallback for older browsers
		return (
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		);
	}

	function handleImport() {
		fileInput?.click();
	}

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		
		if (!files || files.length === 0) return;

		importing = true;
		try {
			// Create a new room for the imported project
			const newRoomId = generateRoomId();
			
			const formData = new FormData();
			
			// Add all files to form data
			Array.from(files).forEach(file => {
				formData.append('files', file);
			});
			
			// Add project name based on folder name or use "Imported Project"
			const firstFile = files[0] as any;
			const folderName = firstFile.webkitRelativePath?.split('/')[0] || 'Imported Project';
			formData.append('projectName', folderName);

			const response = await fetch(`/api/projects/${newRoomId}/import`, {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.success) {
				// Navigate to the new project
				goto(`/editor/${newRoomId}`);
			} else {
				console.error('Import failed:', result.error);
				if (result.error === 'Authentication required') {
					alert('Please log in to import projects. You can import projects after creating an account.');
				} else {
					alert(`Import failed: ${result.error}`);
				}
			}
		} catch (error) {
			console.error('Import failed:', error);
			alert('Import failed. Please try again.');
		} finally {
			importing = false;
			// Reset input
			target.value = '';
		}
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4"
>
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-4xl font-bold text-gray-900">CollabTeX</h1>
			<p class="text-lg text-gray-600">Collaborative LaTeX editing in your browser</p>
		</div>

		<div class="space-y-6 rounded-lg bg-white p-6 shadow-lg">
			<div>
				<h2 class="mb-4 text-xl font-semibold">Start a new document</h2>
				<div class="space-y-3">
					<Button
						on:click={createNewRoom}
						size="lg"
						class="bg-overleaf-green hover:bg-overleaf-green/90 w-full"
					>
						Create New Room
					</Button>
					
					<Button
						on:click={handleImport}
						size="lg"
						variant="outline"
						class="w-full"
						disabled={importing}
					>
						{#if importing}
							<span class="mr-2 animate-spin">⟳</span>
							Importing...
						{:else}
							<Upload size={20} class="mr-2" />
							Import Project
						{/if}
					</Button>
				</div>
			</div>

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-white px-2 text-gray-500">Or</span>
				</div>
			</div>

			<div>
				<h2 class="mb-4 text-xl font-semibold">Join existing room</h2>
				<form on:submit|preventDefault={joinRoom} class="space-y-4">
					<input
						type="text"
						bind:value={roomId}
						placeholder="Enter room ID"
						class="focus:ring-overleaf-green w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2"
					/>
					<Button
						type="submit"
						size="lg"
						variant="outline"
						class="w-full"
						disabled={!roomId.trim()}
					>
						Join Room
					</Button>
				</form>
			</div>
		</div>

		<div class="mt-8 text-center text-sm text-gray-600">
			<p>Powered by YJS for real-time collaboration</p>
			<p class="mt-2">LaTeX compilation happens entirely in your browser</p>
		</div>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600">
				Want to save your projects?
				<a href="/demo/lucia/login" class="text-overleaf-green hover:underline font-medium">
					Login / Register
				</a>
			</p>
		</div>
	</div>
</div>

<!-- Hidden file input for import -->
<input
	bind:this={fileInput}
	type="file"
	multiple
	webkitdirectory
	accept=".tex,.bib,.cls,.sty,.txt,.md"
	on:change={handleFileUpload}
	style="display: none;"
/>
