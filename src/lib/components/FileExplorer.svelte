<script lang="ts">
	import { File, Folder, FolderOpen, Plus, Trash2 } from 'lucide-svelte';

	interface FileNode {
		id: string;
		name: string;
		type: 'file' | 'folder';
		children?: FileNode[];
		content?: string;
	}

	let files: FileNode[] = [
		{
			id: '1',
			name: 'main.tex',
			type: 'file',
			content: ''
		}
	];

	let selectedFile: string | null = '1';
	let expandedFolders: Set<string> = new Set();

	function toggleFolder(id: string) {
		if (expandedFolders.has(id)) {
			expandedFolders.delete(id);
		} else {
			expandedFolders.add(id);
		}
		expandedFolders = new Set(expandedFolders);
	}

	function selectFile(id: string) {
		selectedFile = id;
		// TODO: Emit event to load file content
	}

	function createNewFile() {
		const newFile: FileNode = {
			id: Date.now().toString(),
			name: 'untitled.tex',
			type: 'file',
			content: ''
		};
		files = [...files, newFile];
	}

	function deleteFile(id: string) {
		// TODO: Implement delete functionality
		console.log('Delete file:', id);
	}
</script>

<div class="bg-overleaf-sidebar flex h-full flex-col">
	<div class="flex items-center justify-between border-b p-4">
		<h3 class="text-sm font-semibold">Files</h3>
		<button on:click={createNewFile} class="rounded p-1 hover:bg-gray-200" title="New file">
			<Plus size={16} />
		</button>
	</div>

	<div class="flex-1 overflow-y-auto p-2">
		{#each files as file (file.id)}
			<div class="py-1">
				{#if file.type === 'folder'}
					<button
						on:click={() => toggleFolder(file.id)}
						class="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray-200"
					>
						{#if expandedFolders.has(file.id)}
							<FolderOpen size={16} />
						{:else}
							<Folder size={16} />
						{/if}
						<span class="text-sm">{file.name}</span>
					</button>

					{#if expandedFolders.has(file.id) && file.children}
						<div class="ml-4">
							{#each file.children as child (child.id)}
								<button
									on:click={() => selectFile(child.id)}
									class="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray-200
                    {selectedFile === child.id ? 'bg-blue-100' : ''}"
								>
									<File size={16} />
									<span class="text-sm">{child.name}</span>
								</button>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="flex w-full items-center gap-2">
						<button
							on:click={() => selectFile(file.id)}
							class="flex flex-1 items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray-200
                {selectedFile === file.id ? 'bg-blue-100' : ''}"
						>
							<File size={16} />
							<span class="text-sm">{file.name}</span>
						</button>
						{#if files.length > 1}
							<button on:click={() => deleteFile(file.id)} class="rounded p-1 hover:bg-red-100">
								<Trash2 size={14} />
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
