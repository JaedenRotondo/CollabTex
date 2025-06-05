<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { compileLatex, type CompileError } from '$lib/latex/compiler';
	import type * as Y from 'yjs';
	import {
		AlertCircle,
		CheckCircle,
		Share2,
		Upload,
		ChevronsUp,
		ChevronsDown,
		Home
	} from 'lucide-svelte';

	export let ydoc: Y.Doc;
	export let activeFile: Y.Map<{ id: string }>;

	const dispatch = createEventDispatcher();
	let compiling = false;
	let shareUrl = '';
	let lastCompileStatus: 'success' | 'error' | null = null;
	let errorCount = 0;
	let importing = false;
	let fileInput: HTMLInputElement;

	$: if ($page.params.roomId) {
		shareUrl = `${$page.url.origin}/editor/${$page.params.roomId}`;
	}

	async function handleCompile() {
		if (!ydoc || compiling) return;

		compiling = true;
		lastCompileStatus = null;
		try {
			let content = '';

			// Get content from active file
			const activeData = activeFile?.get('id');
			const activeFileId = typeof activeData === 'object' && activeData?.id ? activeData.id : null;
			if (activeFileId) {
				const ytext = ydoc.getText(`file-${activeFileId}`);
				content = ytext.toString();
			} else {
				// Fallback to legacy content
				content = ydoc.getText('latex-content').toString();
			}

			const result = await compileLatex(content);

			if (result.pdf) {
				lastCompileStatus = 'success';
				errorCount = result.errors?.length || 0;
				dispatch('compile', {
					pdf: result.pdf,
					errors: result.errors || []
				});
			} else {
				lastCompileStatus = 'error';
				errorCount = result.errors?.length || 1;
				dispatch('compile', {
					errors: result.errors || [
						{
							message: result.error || 'Compilation failed',
							type: 'error' as const
						}
					]
				});
			}
		} catch (error) {
			console.error('Compilation failed:', error);
			lastCompileStatus = 'error';
			errorCount = 1;
			dispatch('compile', {
				errors: [
					{
						message: error instanceof Error ? error.message : 'Unknown error',
						type: 'error' as const
					}
				]
			});
		} finally {
			compiling = false;
		}
	}

	async function handleDownload() {
		// Get the current PDF from the PDFViewer
		dispatch('download');
	}

	function handleShare() {
		dispatch('share');
	}

	function handleFoldAll() {
		dispatch('foldAll');
	}

	function handleUnfoldAll() {
		dispatch('unfoldAll');
	}

	function handleImport() {
		fileInput?.click();
	}

	function handleHome() {
		goto('/dashboard');
	}

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (!files || files.length === 0) return;

		importing = true;
		try {
			const formData = new FormData();

			// Add all files to form data
			Array.from(files).forEach((file) => {
				formData.append('files', file);
			});

			// Add project name (optional)
			formData.append('projectName', 'Imported Project');

			const response = await fetch(`/api/projects/${$page.params.roomId}/import`, {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.success) {
				// Refresh the project to load imported files
				dispatch('import', {
					message: result.message,
					filesImported: result.filesImported
				});
			} else {
				console.error('Import failed:', result.error);
				dispatch('importError', {
					error: result.error
				});
			}
		} catch (error) {
			console.error('Import failed:', error);
			dispatch('importError', {
				error: error instanceof Error ? error.message : 'Import failed'
			});
		} finally {
			importing = false;
			// Reset input
			target.value = '';
		}
	}
</script>

<div class="bg-academic-toolbar border-b border-academic-border px-4 py-3 shadow-sm flex items-center justify-between">
	<div class="flex items-center gap-3">
		<Button
			variant="outline"
			size="sm"
			on:click={handleHome}
			title="Go to Dashboard"
			class="border-academic-gray-300 text-academic-gray-600 hover:bg-academic-gray-50 hover:text-academic-gray-800 transition-colors duration-200"
		>
			<Home size={16} />
		</Button>

		<div class="h-6 w-px bg-academic-gray-300"></div>

		<Button
			variant="default"
			size="sm"
			on:click={handleCompile}
			disabled={compiling}
			class="bg-academic-primary hover:bg-academic-primary-dark text-white font-medium px-4 py-2 shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
		>
			{#if compiling}
				<span class="mr-2 animate-spin">⟳</span>
				Compiling...
			{:else}
				Compile
			{/if}
		</Button>

		{#if lastCompileStatus === 'success'}
			<div class="flex items-center gap-1.5 text-academic-success bg-academic-primary-light px-3 py-1.5 rounded-md">
				<CheckCircle size={16} />
				<span class="text-sm font-medium">Success</span>
			</div>
		{:else if lastCompileStatus === 'error'}
			<button
				on:click={() => dispatch('toggleErrors')}
				class="flex items-center gap-1.5 text-academic-error hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors duration-200"
			>
				<AlertCircle size={16} />
				<span class="text-sm font-medium">{errorCount} {errorCount === 1 ? 'error' : 'errors'}</span>
			</button>
		{/if}

		<Button 
			variant="outline" 
			size="sm" 
			on:click={handleDownload}
			class="border-academic-gray-300 text-academic-gray-700 hover:bg-academic-gray-50 hover:text-academic-gray-900 transition-colors duration-200"
		>
			Download PDF
		</Button>

		<Button
			variant="outline"
			size="sm"
			on:click={handleImport}
			disabled={importing}
			id="toolbar-import"
			class="border-academic-gray-300 text-academic-gray-700 hover:bg-academic-gray-50 hover:text-academic-gray-900 transition-colors duration-200"
		>
			{#if importing}
				<span class="mr-2 animate-spin">⟳</span>
				Importing...
			{:else}
				<Upload size={16} class="mr-1" />
				Import
			{/if}
		</Button>
	</div>

	<div class="flex items-center gap-4">
		<div class="text-academic-gray-600 text-sm font-medium">CollabTeX Editor</div>

		<div class="flex items-center gap-1 border-l border-academic-gray-300 pl-4">
			<button
				on:click={handleFoldAll}
				class="rounded p-2 hover:bg-academic-gray-100 text-academic-gray-600 hover:text-academic-gray-800 transition-colors duration-200"
				title="Fold all sections"
			>
				<ChevronsUp size={16} />
			</button>
			<button
				on:click={handleUnfoldAll}
				class="rounded p-2 hover:bg-academic-gray-100 text-academic-gray-600 hover:text-academic-gray-800 transition-colors duration-200"
				title="Unfold all sections"
			>
				<ChevronsDown size={16} />
			</button>
		</div>

		<Button 
			variant="outline" 
			size="sm" 
			on:click={handleShare}
			class="border-academic-gray-300 text-academic-gray-700 hover:bg-academic-gray-50 hover:text-academic-gray-900 transition-colors duration-200"
		>
			<Share2 size={16} class="mr-1" />
			Share
		</Button>
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
