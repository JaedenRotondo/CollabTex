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
	<div
		class="border-academic-border bg-academic-paper absolute right-0 bottom-0 left-0 z-50 max-h-64 border-t shadow-lg"
	>
		<div
			class="border-academic-border bg-academic-gray-50 flex items-center justify-between border-b px-4 py-2"
		>
			<div class="flex items-center gap-2">
				<button
					on:click={() => (expanded = !expanded)}
					class="hover:bg-academic-gray-100 text-academic-gray-600 hover:text-academic-gray-800 rounded p-1 transition-colors duration-200"
					aria-label="Toggle errors panel"
				>
					{#if expanded}
						<ChevronDown size={16} />
					{:else}
						<ChevronRight size={16} />
					{/if}
				</button>
				<AlertCircle size={16} class="text-academic-error" />
				<span class="text-academic-gray-800 text-sm font-semibold">
					{errors.length}
					{errors.length === 1 ? 'Error' : 'Errors'}
				</span>
			</div>
			<button
				on:click={onClose}
				class="hover:bg-academic-gray-100 text-academic-gray-600 hover:text-academic-gray-800 rounded p-1 transition-colors duration-200"
				aria-label="Close"
			>
				<X size={16} />
			</button>
		</div>

		{#if expanded}
			<div class="bg-academic-paper max-h-48 overflow-y-auto">
				{#each errors as error, i}
					<button
						on:click={() => onErrorClick(error)}
						class="border-academic-gray-100 hover:bg-academic-gray-50 flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors duration-200"
					>
						<div class="mt-0.5">
							{#if error.type === 'error'}
								<div class="bg-academic-error h-2 w-2 rounded-full"></div>
							{:else}
								<div class="bg-academic-warning h-2 w-2 rounded-full"></div>
							{/if}
						</div>
						<div class="flex-1">
							<div class="text-academic-gray-900 text-sm font-medium">{error.message}</div>
							{#if error.file || error.line}
								<div class="text-academic-gray-600 mt-1 text-xs">
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
