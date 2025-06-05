<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Upload } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let roomId = '';
	let importing = false;
	let fileInput: HTMLInputElement;
	let folderInput: HTMLInputElement;
	let showImportOptions = false;

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
		showImportOptions = !showImportOptions;
	}

	function handleImportFiles() {
		fileInput?.click();
		showImportOptions = false;
	}

	function handleImportFolder() {
		folderInput?.click();
		showImportOptions = false;
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
			Array.from(files).forEach((file) => {
				formData.append('files', file);
			});

			// Add project name based on folder name or file name
			const firstFile = files[0] as any;
			let projectName = 'Imported Project';

			if (firstFile.webkitRelativePath) {
				// Folder import - use folder name
				projectName = firstFile.webkitRelativePath.split('/')[0];
			} else if (files.length === 1) {
				// Single file import - use file name without extension
				projectName = firstFile.name.replace(/\.[^/.]+$/, '');
			} else {
				// Multiple files import
				projectName = 'Imported Files';
			}

			formData.append('projectName', projectName);

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
					alert(
						'Please log in to import projects. You can import projects after creating an account.'
					);
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

	// Close import options when clicking outside
	onMount(() => {
		function handleClickOutside(event: MouseEvent) {
			if (showImportOptions && !(event.target as Element)?.closest('.relative')) {
				showImportOptions = false;
			}
		}

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-b from-academic-gray-50 to-academic-gray-100 p-4"
>
	<div class="w-full max-w-md">
		<!-- CollabTeX official logo centered -->
		<div class="flex justify-center mb-6">
			<img src="/collabtex-logo.png" alt="CollabTeX" class="h-32 w-32 opacity-90 hover:opacity-100 transition-opacity duration-200 rounded-lg shadow-lg bg-white" />
		</div>
		<div class="mb-8 text-center">
			<p class="text-lg text-academic-gray-600">Collaborative LaTeX editing in your browser</p>
		</div>

		<div class="space-y-6 rounded-lg bg-academic-paper border border-academic-border p-6 shadow-lg">
			<div>
				<h2 class="mb-4 text-xl font-semibold text-academic-gray-800">Start a new document</h2>
				<div class="space-y-3">
					<Button
						on:click={createNewRoom}
						size="lg"
						class="bg-academic-primary hover:bg-academic-primary-dark text-white w-full"
					>
						Create New Room
					</Button>

					<div class="relative">
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

						{#if showImportOptions}
							<div
								class="absolute top-full right-0 left-0 z-10 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg"
							>
								<div class="space-y-1 p-2">
									<button
										on:click={handleImportFiles}
										class="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
									>
										<Upload size={16} class="mr-2" />
										Import Files (.tex, .bib, etc.)
									</button>
									<button
										on:click={handleImportFolder}
										class="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
									>
										<Upload size={16} class="mr-2" />
										Import Folder (entire project)
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-academic-paper px-2 text-academic-gray-500">Or</span>
				</div>
			</div>

			<div>
				<h2 class="mb-4 text-xl font-semibold text-academic-gray-800">Join existing room</h2>
				<form on:submit|preventDefault={joinRoom} class="space-y-4">
					<input
						type="text"
						bind:value={roomId}
						placeholder="Enter room ID"
						class="focus:ring-academic-primary w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2"
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

		<div class="mt-8 text-center text-sm text-academic-gray-600">
			<p>Powered by YJS for real-time collaboration</p>
			<p class="mt-2">LaTeX compilation happens entirely in your browser</p>
		</div>

		<div class="mt-6 text-center">
			<p class="text-sm text-academic-gray-600">
				Want to save your projects?
				<a href="/demo/lucia/login" class="text-academic-primary font-medium hover:underline">
					Login / Register
				</a>
			</p>
		</div>
	</div>
</div>

<!-- Hidden file inputs for import -->
<input
	bind:this={fileInput}
	type="file"
	multiple
	accept=".tex,.bib,.cls,.sty,.txt,.md"
	on:change={handleFileUpload}
	style="display: none;"
/>

<input
	bind:this={folderInput}
	type="file"
	multiple
	webkitdirectory
	accept=".tex,.bib,.cls,.sty,.txt,.md"
	on:change={handleFileUpload}
	style="display: none;"
/>
