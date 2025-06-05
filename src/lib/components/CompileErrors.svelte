<script lang="ts">
	import { AlertCircle, X, ChevronDown, ChevronRight } from 'lucide-svelte';

	export let errors: Array<{
		line?: number;
		column?: number;
		message: string;
		file?: string;
		type: 'error' | 'warning';
	}> = [];
	export let show = false;
	export let onClose: () => void = () => {};
	export let onErrorClick: (error: any) => void = () => {};

	let expanded = true;
</script>

{#if show && errors.length > 0}
	<div class="absolute right-0 bottom-0 left-0 z-50 max-h-64 border-t border-academic-border bg-academic-paper shadow-lg">
		<div class="flex items-center justify-between border-b border-academic-border bg-academic-gray-50 px-4 py-2">
			<div class="flex items-center gap-2">
				<button
					on:click={() => (expanded = !expanded)}
					class="rounded p-1 hover:bg-academic-gray-100 text-academic-gray-600 hover:text-academic-gray-800 transition-colors duration-200"
					aria-label="Toggle errors panel"
				>
					{#if expanded}
						<ChevronDown size={16} />
					{:else}
						<ChevronRight size={16} />
					{/if}
				</button>
				<AlertCircle size={16} class="text-academic-error" />
				<span class="text-sm font-semibold text-academic-gray-800">
					{errors.length}
					{errors.length === 1 ? 'Error' : 'Errors'}
				</span>
			</div>
			<button on:click={onClose} class="rounded p-1 hover:bg-academic-gray-100 text-academic-gray-600 hover:text-academic-gray-800 transition-colors duration-200" aria-label="Close">
				<X size={16} />
			</button>
		</div>

		{#if expanded}
			<div class="max-h-48 overflow-y-auto bg-academic-paper">
				{#each errors as error, i}
					<button
						on:click={() => onErrorClick(error)}
						class="flex w-full items-start gap-3 border-b border-academic-gray-100 px-4 py-3 text-left hover:bg-academic-gray-50 transition-colors duration-200"
					>
						<div class="mt-0.5">
							{#if error.type === 'error'}
								<div class="h-2 w-2 rounded-full bg-academic-error"></div>
							{:else}
								<div class="h-2 w-2 rounded-full bg-academic-warning"></div>
							{/if}
						</div>
						<div class="flex-1">
							<div class="text-sm text-academic-gray-900 font-medium">{error.message}</div>
							{#if error.file || error.line}
								<div class="mt-1 text-xs text-academic-gray-600">
									{#if error.file}
										{error.file}
									{/if}
									{#if error.line}
										{error.file ? ' • ' : ''}Line {error.line}
										{#if error.column}:{error.column}{/if}
									{/if}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
