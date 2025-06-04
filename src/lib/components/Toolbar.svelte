<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { compileLatex, type CompileError } from '$lib/latex/compiler';
	import type * as Y from 'yjs';
	import { AlertCircle, CheckCircle } from 'lucide-svelte';

	export let ydoc: Y.Doc;
	export let activeFile: Y.Map<{ id: string }>;

	const dispatch = createEventDispatcher();
	let compiling = false;
	let shareUrl = '';
	let lastCompileStatus: 'success' | 'error' | null = null;
	let errorCount = 0;

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

	async function handleShare() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			dispatch('notification', {
				message: 'Link copied to clipboard!',
				type: 'success'
			});
		} catch (error) {
			console.error('Failed to copy link:', error);
			dispatch('notification', {
				message: 'Failed to copy link',
				type: 'error'
			});
		}
	}
</script>

<div class="bg-overleaf-toolbar flex items-center justify-between border-b px-4 py-2">
	<div class="flex items-center gap-2">
		<Button
			variant="default"
			size="sm"
			on:click={handleCompile}
			disabled={compiling}
			class="bg-overleaf-green hover:bg-overleaf-green/90"
		>
			{#if compiling}
				<span class="mr-2 animate-spin">⟳</span>
				Compiling...
			{:else}
				Compile
			{/if}
		</Button>

		{#if lastCompileStatus === 'success'}
			<div class="flex items-center gap-1 text-green-600">
				<CheckCircle size={16} />
				<span class="text-sm">Success</span>
			</div>
		{:else if lastCompileStatus === 'error'}
			<button
				on:click={() => dispatch('toggleErrors')}
				class="flex items-center gap-1 text-red-600 hover:text-red-700"
			>
				<AlertCircle size={16} />
				<span class="text-sm">{errorCount} {errorCount === 1 ? 'error' : 'errors'}</span>
			</button>
		{/if}

		<Button variant="outline" size="sm" on:click={handleDownload}>Download PDF</Button>
	</div>

	<div class="flex items-center gap-4">
		<div class="text-muted-foreground text-sm">CollabTeX Editor</div>

		<Button variant="outline" size="sm" on:click={handleShare}>Share</Button>
	</div>
</div>
