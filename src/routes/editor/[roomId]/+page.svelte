<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import * as Y from 'yjs';
	import type { WebrtcProvider } from 'y-webrtc';
	import Editor from '$lib/components/Editor.svelte';
	import PDFViewer from '$lib/components/PDFViewer.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import FileExplorer from '$lib/components/FileExplorer.svelte';
	import UserPresence from '$lib/components/UserPresence.svelte';
	import CompileErrors from '$lib/components/CompileErrors.svelte';
	import ShareModal from '$lib/components/ShareModal.svelte';
	import { initializeCollaboration, type FileNode } from '$lib/collaboration/yjs-setup';
	import type { FileSync } from '$lib/collaboration/file-sync';
	import type { CompileError } from '$lib/latex/compiler';
	import { configureCompiler } from '$lib/latex/compiler';

	let ydoc: Y.Doc | undefined;
	let provider: WebrtcProvider | undefined;
	let files: Y.Map<FileNode> | undefined;
	let activeFile: Y.Map<{ id: string }> | undefined;
	let fileSync: FileSync | undefined;
	let roomId = $page.params.roomId;
	let showFileExplorer = true;
	let splitPosition = 50;
	let pdfData: ArrayBuffer | null = null;
	let compileErrors: CompileError[] = [];
	let showErrors = false;
	let shareModalOpen = false;
	let projectName = 'Untitled Project';

	onMount(() => {
		console.log('Initializing collaboration for room:', roomId);

		// Configure compiler to use server compilation
		configureCompiler({
			useServer: true,
			serverUrl: 'https://latex-server-q7ci.onrender.com'
		});

		try {
			const collab = initializeCollaboration(roomId);
			ydoc = collab.ydoc;
			provider = collab.provider;
			files = collab.files;
			activeFile = collab.activeFile;
			fileSync = collab.fileSync;

			console.log('Collaboration initialized successfully');
		} catch (error) {
			console.error('Failed to initialize collaboration:', error);
		}

		// Fetch project name asynchronously
		(async () => {
			try {
				const response = await fetch(`/api/projects/${roomId}`);
				if (response.ok) {
					const data = await response.json();
					projectName = data.project?.name || 'Untitled Project';
				}
			} catch (error) {
				console.error('Failed to fetch project details:', error);
			}
		})();

		return () => {
			console.log('Cleaning up collaboration');
			provider?.destroy();
			ydoc?.destroy();
			fileSync?.destroy();
		};
	});

	function handleCompile(event: CustomEvent<{ pdf?: ArrayBuffer; errors?: CompileError[] }>) {
		if (event.detail.pdf) {
			pdfData = event.detail.pdf;
			compileErrors = event.detail.errors || [];
			showErrors = false;
		} else {
			compileErrors = event.detail.errors || [];
			showErrors = true;
		}
	}

	function handleToggleErrors() {
		showErrors = !showErrors;
	}

	function handleShare() {
		shareModalOpen = true;
	}

	async function handleImport(event: CustomEvent<{ message: string; filesImported: number }>) {
		console.log('Import successful:', event.detail);
		
		// Refresh the file sync to load imported files from database
		if (fileSync) {
			await fileSync.loadFromDB();
		}
		
		// Show success message (you could add a toast notification here)
		alert(`Successfully imported ${event.detail.filesImported} files!`);
	}

	function handleImportError(event: CustomEvent<{ error: string }>) {
		console.error('Import failed:', event.detail.error);
		alert(`Import failed: ${event.detail.error}`);
	}


	function handleFileSelect() {
		// File selection is handled by the FileExplorer component
		// The active file is automatically synced via Yjs
	}

	function handleSplitDrag(event: MouseEvent) {
		const startX = event.clientX;
		const startSplit = splitPosition;

		function handleMouseMove(e: MouseEvent) {
			const delta = ((e.clientX - startX) / window.innerWidth) * 100;
			splitPosition = Math.max(20, Math.min(80, startSplit + delta));
		}

		function handleMouseUp() {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}
</script>

{#if ydoc && provider}
	<div class="bg-overleaf-editor flex h-screen flex-col">
		{#if activeFile}
			<Toolbar
				on:compile={handleCompile}
				on:toggleErrors={handleToggleErrors}
				on:share={handleShare}
				on:import={handleImport}
				on:importError={handleImportError}
				{ydoc}
				{activeFile}
			/>
		{/if}

		<div class="flex flex-1 overflow-hidden">
			{#if showFileExplorer}
				<div class="border-border bg-overleaf-sidebar w-64 border-r">
					{#if files && activeFile}
						<FileExplorer 
							{files} 
							{activeFile} 
							on:fileSelect={handleFileSelect}
							on:import={() => document.getElementById('toolbar-import')?.click()} 
						/>
					{:else}
						<div class="flex h-full items-center justify-center">
							<p class="text-sm text-gray-500">Loading files...</p>
						</div>
					{/if}
				</div>
			{/if}

			<div class="relative flex flex-1">
				<div class="relative" style="width: {splitPosition}%">
					{#if files && activeFile}
						<Editor {ydoc} {provider} {files} {activeFile} />
					{/if}
					<CompileErrors
						errors={compileErrors}
						show={showErrors}
						onClose={() => (showErrors = false)}
					/>
				</div>

				<button
					class="bg-border hover:bg-primary absolute top-0 bottom-0 z-10 w-1 cursor-col-resize"
					style="left: {splitPosition}%"
					on:mousedown={handleSplitDrag}
					aria-label="Resize panes"
				></button>

				<div class="flex-1 bg-gray-100">
					<PDFViewer {pdfData} />
				</div>
			</div>
		</div>

		<div class="absolute right-4 bottom-4 z-20">
			<UserPresence {provider} />
		</div>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="border-primary mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2"
			></div>
			<p class="text-muted-foreground text-lg">Initializing editor...</p>
			<p class="text-muted-foreground mt-2 text-sm">Room ID: {roomId}</p>
		</div>
	</div>
{/if}

<ShareModal
	bind:isOpen={shareModalOpen}
	{projectName}
	{roomId}
	on:close={() => shareModalOpen = false}
/>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
