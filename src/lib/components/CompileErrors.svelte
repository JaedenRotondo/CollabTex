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
	<div class="absolute right-0 bottom-0 left-0 z-50 max-h-64 border-t bg-white shadow-lg">
		<div class="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
			<div class="flex items-center gap-2">
				<button
					on:click={() => (expanded = !expanded)}
					class="rounded p-1 hover:bg-gray-200"
					aria-label="Toggle errors panel"
				>
					{#if expanded}
						<ChevronDown size={16} />
					{:else}
						<ChevronRight size={16} />
					{/if}
				</button>
				<AlertCircle size={16} class="text-red-500" />
				<span class="text-sm font-medium">
					{errors.length}
					{errors.length === 1 ? 'Error' : 'Errors'}
				</span>
			</div>
			<button on:click={onClose} class="rounded p-1 hover:bg-gray-200" aria-label="Close">
				<X size={16} />
			</button>
		</div>

		{#if expanded}
			<div class="max-h-48 overflow-y-auto">
				{#each errors as error, i}
					<button
						on:click={() => onErrorClick(error)}
						class="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-gray-50"
					>
						<div class="mt-0.5">
							{#if error.type === 'error'}
								<div class="h-2 w-2 rounded-full bg-red-500"></div>
							{:else}
								<div class="h-2 w-2 rounded-full bg-yellow-500"></div>
							{/if}
						</div>
						<div class="flex-1">
							<div class="text-sm text-gray-900">{error.message}</div>
							{#if error.file || error.line}
								<div class="mt-1 text-xs text-gray-500">
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
