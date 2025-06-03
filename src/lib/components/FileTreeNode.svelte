<script lang="ts">
	import type * as Y from 'yjs';
	import { File, Folder, FolderOpen, Plus, Trash2, Edit2 } from 'lucide-svelte';
	import type { FileNode } from '$lib/collaboration/yjs-setup';

	export let node: FileNode & { children?: FileNode[] };
	export let files: Y.Map<FileNode>;
	export let activeFile: Y.Map<{ id: string }>;
	export let selectedFileId: string | null;
	export let expandedFolders: Set<string>;
	export let editingId: string | null;
	export let editingName: string;
	export let onToggleFolder: (id: string) => void;
	export let onSelectFile: (id: string) => void;
	export let onStartEditing: (id: string, name: string) => void;
	export let onSaveEdit: () => void;
	export let onCancelEditing: () => void;
	export let onDeleteItem: (id: string) => void;
	export let onShowNewItemDialog: (type: 'file' | 'folder', parentId: string | null) => void;

	$: isFolder = node.type === 'folder';
	$: isExpanded = expandedFolders.has(node.id);
	$: hasChildren = isFolder && node.children !== undefined && node.children.length > 0;
</script>

<div class="py-0.5">
	{#if isFolder}
		<div class="group flex w-full items-center gap-1">
			<button
				on:click={() => onToggleFolder(node.id)}
				class="flex flex-1 items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray-200"
			>
				{#if isExpanded}
					<FolderOpen size={16} />
				{:else}
					<Folder size={16} />
				{/if}
				{#if editingId === node.id}
					<input
						type="text"
						bind:value={editingName}
						on:blur={onSaveEdit}
						on:keydown={(e) => {
							if (e.key === 'Enter') onSaveEdit();
							if (e.key === 'Escape') onCancelEditing();
						}}
						class="flex-1 rounded border px-1 text-sm"
						on:click|stopPropagation
					/>
				{:else}
					<span class="text-sm">{node.name}</span>
				{/if}
			</button>
			<div class="hidden gap-1 group-hover:flex">
				<button
					on:click={() => onShowNewItemDialog('file', node.id)}
					class="rounded p-1 hover:bg-gray-300"
					title="New file in folder"
				>
					<Plus size={14} />
				</button>
				<button
					on:click={() => onStartEditing(node.id, node.name)}
					class="rounded p-1 hover:bg-gray-300"
					title="Rename"
				>
					<Edit2 size={14} />
				</button>
				<button
					on:click={() => onDeleteItem(node.id)}
					class="rounded p-1 hover:bg-red-100"
					title="Delete"
				>
					<Trash2 size={14} />
				</button>
			</div>
		</div>

		{#if isExpanded && hasChildren && node.children}
			<div class="ml-4">
				{#each node.children as child (child.id)}
					<svelte:self
						node={child}
						{files}
						{activeFile}
						{selectedFileId}
						{expandedFolders}
						{editingId}
						{editingName}
						{onToggleFolder}
						{onSelectFile}
						{onStartEditing}
						{onSaveEdit}
						{onCancelEditing}
						{onDeleteItem}
						{onShowNewItemDialog}
					/>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="group flex w-full items-center gap-1">
			<button
				on:click={() => onSelectFile(node.id)}
				class="flex flex-1 items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray-200
				{selectedFileId === node.id ? 'bg-blue-100' : ''}"
			>
				<File size={16} />
				{#if editingId === node.id}
					<input
						type="text"
						bind:value={editingName}
						on:blur={onSaveEdit}
						on:keydown={(e) => {
							if (e.key === 'Enter') onSaveEdit();
							if (e.key === 'Escape') onCancelEditing();
						}}
						class="flex-1 rounded border px-1 text-sm"
						on:click|stopPropagation
					/>
				{:else}
					<span class="text-sm">{node.name}</span>
				{/if}
			</button>
			<div class="hidden gap-1 group-hover:flex">
				<button
					on:click={() => onStartEditing(node.id, node.name)}
					class="rounded p-1 hover:bg-gray-300"
					title="Rename"
				>
					<Edit2 size={14} />
				</button>
				<button
					on:click={() => onDeleteItem(node.id)}
					class="rounded p-1 hover:bg-red-100"
					title="Delete"
				>
					<Trash2 size={14} />
				</button>
			</div>
		</div>
	{/if}
</div>
