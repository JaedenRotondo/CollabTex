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
	export let mainContent: Y.Text;
	export let readonly: boolean = false;
	export let isOwner: boolean = false;

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
			// Get content from main content
			const content = mainContent.toString();

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

<div
	class="bg-academic-toolbar border-academic-border flex items-center justify-between border-b px-4 py-3 shadow-sm"
>
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

		<div class="bg-academic-gray-300 h-6 w-px"></div>

		<Button
			variant="default"
			size="sm"
			on:click={handleCompile}
			disabled={compiling}
			class="bg-academic-primary hover:bg-academic-primary-dark px-4 py-2 font-medium text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{#if compiling}
				<span class="mr-2 animate-spin">⟳</span>
				Compiling...
			{:else}
				Compile
			{/if}
		</Button>

		{#if lastCompileStatus === 'success'}
			<div
				class="text-academic-success bg-academic-primary-light flex items-center gap-1.5 rounded-md px-3 py-1.5"
			>
				<CheckCircle size={16} />
				<span class="text-sm font-medium">Success</span>
			</div>
		{:else if lastCompileStatus === 'error'}
			<button
				on:click={() => dispatch('toggleErrors')}
				class="text-academic-error flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 transition-colors duration-200 hover:bg-red-100 hover:text-red-700"
			>
				<AlertCircle size={16} />
				<span class="text-sm font-medium">{errorCount} {errorCount === 1 ? 'error' : 'errors'}</span
				>
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

		{#if !readonly}
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
		{/if}
	</div>

	<div class="flex items-center gap-4">
		<div class="flex items-center gap-2">
			<img src="/collabtex-logo.png" alt="CollabTeX" class="h-6 w-6 rounded" />
			<span class="text-academic-gray-700 text-sm font-semibold">CollabTeX</span>
		</div>

		<div class="border-academic-gray-300 flex items-center gap-1 border-l pl-4">
			<button
				on:click={handleFoldAll}
				class="hover:bg-academic-gray-100 text-academic-gray-600 hover:text-academic-gray-800 rounded p-2 transition-colors duration-200"
				title="Fold all sections"
			>
				<ChevronsUp size={16} />
			</button>
			<button
				on:click={handleUnfoldAll}
				class="hover:bg-academic-gray-100 text-academic-gray-600 hover:text-academic-gray-800 rounded p-2 transition-colors duration-200"
				title="Unfold all sections"
			>
				<ChevronsDown size={16} />
			</button>
		</div>

		{#if isOwner}
			<Button
				variant="outline"
				size="sm"
				on:click={handleShare}
				class="border-academic-gray-300 text-academic-gray-700 hover:bg-academic-gray-50 hover:text-academic-gray-900 transition-colors duration-200"
			>
				<Share2 size={16} class="mr-1" />
				Share
			</Button>
		{/if}
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
