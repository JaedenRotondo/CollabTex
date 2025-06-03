<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type * as Y from 'yjs';
	import { Plus, FolderPlus } from 'lucide-svelte';
	import type { FileNode } from '$lib/collaboration/yjs-setup';
	import FileTreeNode from './FileTreeNode.svelte';

	export let files: Y.Map<FileNode>;
	export let activeFile: Y.Map<{ id: string }>;

	const dispatch = createEventDispatcher();

	let fileTree: (FileNode & { children?: FileNode[] })[] = [];
	let selectedFileId: string | null = null;
	let expandedFolders: Set<string> = new Set();
	let editingId: string | null = null;
	let editingName: string = '';
	let showNewFileDialog = false;
	let showNewFolderDialog = false;
	let newItemName = '';
	let newItemParentId: string | null = null;

	$: {
		// Convert Y.Map to tree structure
		fileTree = buildFileTree();
		const activeData = activeFile.get('id');
		const activeId = typeof activeData === 'object' && activeData?.id ? activeData.id : null;
		if (activeId) {
			selectedFileId = activeId;
		}
	}

	// Subscribe to file changes
	files.observe(() => {
		fileTree = buildFileTree();
	});

	function buildFileTree(): (FileNode & { children?: FileNode[] })[] {
		const allFiles: FileNode[] = [];
		files.forEach((file) => {
			allFiles.push(file);
		});

		// Build tree structure
		const tree: (FileNode & { children?: FileNode[] })[] = [];
		const map = new Map<string, FileNode & { children?: FileNode[] }>();

		// First pass: create all nodes
		allFiles.forEach((file) => {
			map.set(file.id, { ...file, children: file.type === 'folder' ? [] : undefined });
		});

		// Second pass: build tree
		allFiles.forEach((file) => {
			const node = map.get(file.id)!;
			if (file.parentId === null) {
				tree.push(node);
			} else {
				const parent = map.get(file.parentId);
				if (parent && parent.children) {
					parent.children.push(node);
				}
			}
		});

		// Sort folders first, then files
		const sortNodes = (
			nodes: (FileNode & { children?: FileNode[] })[]
		): (FileNode & { children?: FileNode[] })[] => {
			return nodes.sort((a, b) => {
				if (a.type === 'folder' && b.type === 'file') return -1;
				if (a.type === 'file' && b.type === 'folder') return 1;
				return a.name.localeCompare(b.name);
			});
		};

		const sortTree = (nodes: (FileNode & { children?: FileNode[] })[]): void => {
			sortNodes(nodes);
			nodes.forEach((node) => {
				if (node.children) {
					sortTree(node.children);
				}
			});
		};

		sortTree(tree);
		return tree;
	}

	function handleToggleFolder(id: string) {
		if (expandedFolders.has(id)) {
			expandedFolders.delete(id);
		} else {
			expandedFolders.add(id);
		}
		expandedFolders = new Set(expandedFolders);
	}

	function handleSelectFile(id: string) {
		const file = files.get(id);
		if (file && file.type === 'file') {
			selectedFileId = id;
			activeFile.set('id', { id });
			dispatch('fileSelect', { file });
		}
	}

	function handleStartEditing(id: string, currentName: string) {
		editingId = id;
		editingName = currentName;
	}

	function handleCancelEditing() {
		editingId = null;
		editingName = '';
	}

	function handleSaveEdit() {
		if (editingId && editingName.trim()) {
			const file = files.get(editingId);
			if (file) {
				files.set(editingId, { ...file, name: editingName.trim() });
			}
		}
		handleCancelEditing();
	}

	function handleDeleteItem(id: string) {
		// Recursively delete item and its children
		const deleteRecursive = (itemId: string) => {
			// Find all children
			files.forEach((file) => {
				if (file.parentId === itemId) {
					deleteRecursive(file.id);
				}
			});
			files.delete(itemId);
		};

		// If deleting active file, select another
		const activeData = activeFile.get('id');
		if (typeof activeData === 'object' && activeData?.id === id) {
			const remainingFiles = Array.from(files.values()).filter(
				(f) => f.type === 'file' && f.id !== id
			);
			if (remainingFiles.length > 0) {
				handleSelectFile(remainingFiles[0].id);
			}
		}

		deleteRecursive(id);
	}

	function handleShowNewItemDialog(type: 'file' | 'folder', parentId: string | null = null) {
		if (type === 'file') {
			showNewFileDialog = true;
		} else {
			showNewFolderDialog = true;
		}
		newItemParentId = parentId;
		newItemName = '';
	}

	function getDefaultContent(filename: string): string {
		if (filename.endsWith('.tex')) {
			return `% ${filename}\n\\section{New Section}\n\nStart writing your content here...\n`;
		}
		return '';
	}

	function createNewItem(type: 'file' | 'folder') {
		if (!newItemName.trim()) return;

		const id = `${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		const newItem: FileNode = {
			id,
			name: newItemName.trim(),
			type,
			parentId: newItemParentId,
			content: type === 'file' ? getDefaultContent(newItemName.trim()) : undefined
		};

		files.set(id, newItem);

		if (type === 'file') {
			handleSelectFile(id);
		} else if (newItemParentId) {
			expandedFolders.add(newItemParentId);
			expandedFolders = new Set(expandedFolders);
		}

		showNewFileDialog = false;
		showNewFolderDialog = false;
		newItemName = '';
		newItemParentId = null;
	}
</script>

<div class="bg-overleaf-sidebar flex h-full flex-col">
	<div class="flex items-center justify-between border-b p-4">
		<h3 class="text-sm font-semibold">Files</h3>
		<div class="flex gap-1">
			<button
				on:click={() => handleShowNewItemDialog('folder')}
				class="rounded p-1 hover:bg-gray-200"
				title="New folder"
			>
				<FolderPlus size={16} />
			</button>
			<button
				on:click={() => handleShowNewItemDialog('file')}
				class="rounded p-1 hover:bg-gray-200"
				title="New file"
			>
				<Plus size={16} />
			</button>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto p-2">
		{#each fileTree as node (node.id)}
			<FileTreeNode
				{node}
				{files}
				{activeFile}
				{selectedFileId}
				{expandedFolders}
				{editingId}
				{editingName}
				onToggleFolder={handleToggleFolder}
				onSelectFile={handleSelectFile}
				onStartEditing={handleStartEditing}
				onSaveEdit={handleSaveEdit}
				onCancelEditing={handleCancelEditing}
				onDeleteItem={handleDeleteItem}
				onShowNewItemDialog={handleShowNewItemDialog}
			/>
		{/each}
	</div>
</div>

<!-- New File Dialog -->
{#if showNewFileDialog}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="w-80 rounded bg-white p-4 shadow-lg">
			<h3 class="mb-4 font-semibold">New File</h3>
			<input
				type="text"
				bind:value={newItemName}
				placeholder="filename.tex"
				class="mb-4 w-full rounded border px-3 py-2"
				on:keydown={(e) => {
					if (e.key === 'Enter') createNewItem('file');
					if (e.key === 'Escape') showNewFileDialog = false;
				}}
			/>
			<div class="flex justify-end gap-2">
				<button
					on:click={() => (showNewFileDialog = false)}
					class="rounded px-3 py-1 hover:bg-gray-100"
				>
					Cancel
				</button>
				<button
					on:click={() => createNewItem('file')}
					class="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
				>
					Create
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- New Folder Dialog -->
{#if showNewFolderDialog}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="w-80 rounded bg-white p-4 shadow-lg">
			<h3 class="mb-4 font-semibold">New Folder</h3>
			<input
				type="text"
				bind:value={newItemName}
				placeholder="folder name"
				class="mb-4 w-full rounded border px-3 py-2"
				on:keydown={(e) => {
					if (e.key === 'Enter') createNewItem('folder');
					if (e.key === 'Escape') showNewFolderDialog = false;
				}}
			/>
			<div class="flex justify-end gap-2">
				<button
					on:click={() => (showNewFolderDialog = false)}
					class="rounded px-3 py-1 hover:bg-gray-100"
				>
					Cancel
				</button>
				<button
					on:click={() => createNewItem('folder')}
					class="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
				>
					Create
				</button>
			</div>
		</div>
	</div>
{/if}
