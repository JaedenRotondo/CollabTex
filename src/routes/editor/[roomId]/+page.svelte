<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import * as Y from 'yjs';
	import type { WebrtcProvider } from 'y-webrtc';
	import Editor from '$lib/components/Editor.svelte';
	import PDFViewer from '$lib/components/PDFViewer.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import UserPresence from '$lib/components/UserPresence.svelte';
	import CompileErrors from '$lib/components/CompileErrors.svelte';
	import ShareModal from '$lib/components/ShareModal.svelte';
	import { initializeCollaboration, updateUserAwareness } from '$lib/collaboration/yjs-setup';
	import type { FileSync } from '$lib/collaboration/file-sync';
	import type { CompileError } from '$lib/latex/compiler';
	import { configureCompiler } from '$lib/latex/compiler';

	let ydoc: Y.Doc | undefined;
	let provider: WebrtcProvider | undefined;
	let mainContent: Y.Text | undefined;
	let fileSync: FileSync | undefined;
	let roomId = $page.params.roomId;
	let pdfData: ArrayBuffer | null = null;
	let compileErrors: CompileError[] = [];

	// Store PDF data outside of Svelte's reactivity to prevent ArrayBuffer detachment
	let storedPdfData: ArrayBuffer | null = null;
	let showErrors = false;
	let shareModalOpen = false;
	let projectName = 'Untitled Project';
	let editorComponent: Editor;
	let userPermission: 'view' | 'edit' = 'edit';
	let isOwner = false;
	let currentUser: { username: string } | null = null;

	onMount(() => {
		// Configure compiler to use server compilation
		configureCompiler({
			useServer: true,
			serverUrl: 'https://latex-server-q7ci.onrender.com'
		});

		try {
			const collab = initializeCollaboration(roomId);
			ydoc = collab.ydoc;
			provider = collab.provider;
			mainContent = collab.mainContent;
			fileSync = collab.fileSync;
		} catch {
			// Failed to initialize collaboration
		}

		// Fetch project details and user info asynchronously
		(async () => {
			try {
				// Fetch user info first
				const userResponse = await fetch('/api/user');
				if (userResponse.ok) {
					const userData = await userResponse.json();
					currentUser = userData.user;

					// Update user awareness with real user info
					if (currentUser && provider) {
						updateUserAwareness(provider, currentUser);
					}
				}

				// Fetch project details
				const response = await fetch(`/api/projects/${roomId}`);
				if (response.ok) {
					const data = await response.json();
					projectName = data.project?.name || 'Untitled Project';
					userPermission = data.userPermission || 'view';
					isOwner = data.isOwner || false;
				}
			} catch {
				// Failed to fetch project details
			}
		})();

		return () => {
			provider?.destroy();
			ydoc?.destroy();
			fileSync?.destroy();
		};
	});

	function handleCompile(event: CustomEvent<{ pdf?: ArrayBuffer; errors?: CompileError[] }>) {
		if (event.detail.pdf) {
			// Store PDF data outside of Svelte reactivity to prevent detachment
			storedPdfData = event.detail.pdf.slice();
			// Keep pdfData for reactive UI updates (PDFViewer)
			pdfData = event.detail.pdf.slice();
			compileErrors = event.detail.errors || [];
			showErrors = false;
		} else {
			storedPdfData = null;
			pdfData = null;
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
		// Refresh the file sync to load imported files from database
		if (fileSync) {
			await fileSync.loadFromDB();
		}

		// Show success message (you could add a toast notification here)
		alert(`Successfully imported ${event.detail.filesImported} files!`);
	}

	function handleImportError(event: CustomEvent<{ error: string }>) {
		alert(`Import failed: ${event.detail.error}`);
	}

	function handleDownload() {
		// Use storedPdfData for download instead of reactive pdfData
		const dataToDownload = storedPdfData;

		if (!dataToDownload) {
			alert('No PDF available to download. Please compile first.');
			return;
		}

		if (dataToDownload.byteLength === 0) {
			alert('PDF data is empty. Please try compiling again.');
			return;
		}

		try {
			// Create a blob from the stored PDF data
			const blob = new Blob([dataToDownload], { type: 'application/pdf' });

			// Create a temporary URL for the blob
			const url = URL.createObjectURL(blob);

			// Create a temporary anchor element to trigger download
			const a = document.createElement('a');
			a.href = url;

			// Generate filename based on project name and current timestamp
			const sanitizedProjectName =
				projectName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim() || 'document';
			const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
			a.download = `${sanitizedProjectName}_${timestamp}.pdf`;

			// Append to body, click, and remove
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			// Clean up the temporary URL
			URL.revokeObjectURL(url);
		} catch {
			alert('Failed to download PDF. Please try again.');
		}
	}

</script>

<svelte:head>
	<title>CollabTeX - {projectName}</title>
</svelte:head>

{#if ydoc && provider}
	<div class="bg-academic-paper flex h-screen flex-col">
		{#if mainContent}
			<Toolbar
				on:compile={handleCompile}
				on:toggleErrors={handleToggleErrors}
				on:share={handleShare}
				on:download={handleDownload}
				on:import={handleImport}
				on:importError={handleImportError}
				on:foldAll={() => editorComponent?.foldAllSections()}
				on:unfoldAll={() => editorComponent?.unfoldAllSections()}
				{ydoc}
				{mainContent}
				readonly={userPermission === 'view'}
				{isOwner}
			/>
		{/if}

		<div class="flex flex-1 overflow-hidden">
			<!-- FileExplorer disabled for single-file mode -->

			<div class="flex flex-1">
				<div class="bg-academic-editor flex-1">
					{#if ydoc && provider && mainContent}
						<Editor
							bind:this={editorComponent}
							{ydoc}
							{provider}
							{mainContent}
							readonly={userPermission === 'view'}
						/>
					{/if}
					<CompileErrors
						errors={compileErrors}
						show={showErrors}
						onClose={() => (showErrors = false)}
					/>
				</div>

				<div class="bg-academic-gray-50 flex-1 shadow-inner">
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
	on:close={() => (shareModalOpen = false)}
/>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
