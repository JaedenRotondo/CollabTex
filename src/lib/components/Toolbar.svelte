<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { compileLatex } from '$lib/latex/compiler';
	import type * as Y from 'yjs';

	export let ydoc: Y.Doc;

	const dispatch = createEventDispatcher();
	let compiling = false;
	let shareUrl = '';

	$: if ($page.params.roomId) {
		shareUrl = `${$page.url.origin}/editor/${$page.params.roomId}`;
	}

	async function handleCompile() {
		if (!ydoc || compiling) return;

		compiling = true;
		try {
			const content = ydoc.getText('latex-content').toString();
			const result = await compileLatex(content);

			if (result.pdf) {
				dispatch('compile', { pdf: result.pdf });
			} else if (result.error) {
				console.error('Compilation error:', result.error);
				// TODO: Show error to user
			}
		} catch (error) {
			console.error('Compilation failed:', error);
		} finally {
			compiling = false;
		}
	}

	function handleDownload() {
		// TODO: Implement download functionality
		console.log('Download clicked');
	}

	async function handleShare() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			// TODO: Show success message
			console.log('Link copied to clipboard');
		} catch (error) {
			console.error('Failed to copy link:', error);
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

		<Button variant="outline" size="sm" on:click={handleDownload}>Download PDF</Button>
	</div>

	<div class="flex items-center gap-4">
		<div class="text-muted-foreground text-sm">CollabTeX Editor</div>

		<Button variant="outline" size="sm" on:click={handleShare}>Share</Button>
	</div>
</div>
