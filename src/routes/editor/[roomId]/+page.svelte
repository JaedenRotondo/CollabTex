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
	import { initializeCollaboration } from '$lib/collaboration/yjs-setup';

	let ydoc: Y.Doc | undefined;
	let provider: WebrtcProvider | undefined;
	let roomId = $page.params.roomId;
	let showFileExplorer = true;
	let splitPosition = 50;
	let pdfData: ArrayBuffer | null = null;
	let initialized = false;

	onMount(() => {
		console.log('Initializing collaboration for room:', roomId);
		
		try {
			const collab = initializeCollaboration(roomId);
			ydoc = collab.ydoc;
			provider = collab.provider;
			initialized = true;
			
			console.log('Collaboration initialized successfully');
		} catch (error) {
			console.error('Failed to initialize collaboration:', error);
		}

		return () => {
			console.log('Cleaning up collaboration');
			provider?.destroy();
			ydoc?.destroy();
		};
	});

	function handleCompile(event: CustomEvent<{ pdf: ArrayBuffer }>) {
		pdfData = event.detail.pdf;
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
		<Toolbar on:compile={handleCompile} {ydoc} />

		<div class="flex flex-1 overflow-hidden">
			{#if showFileExplorer}
				<div class="border-border bg-overleaf-sidebar w-64 border-r">
					<FileExplorer />
				</div>
			{/if}

			<div class="relative flex flex-1">
				<div class="relative" style="width: {splitPosition}%">
					<Editor {ydoc} {provider} />
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
			<div class="mb-4 inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			<p class="text-lg text-muted-foreground">Initializing editor...</p>
			<p class="text-sm text-muted-foreground mt-2">Room ID: {roomId}</p>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
