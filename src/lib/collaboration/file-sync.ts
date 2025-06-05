import * as Y from 'yjs';
import type { FileNode } from './yjs-setup';

export class FileSync {
	private files: Y.Map<FileNode>;
	private roomId: string;
	private ydoc: Y.Doc;
	private createDefaultContent: () => void;
	private syncInterval: number | null = null;
	private pendingChanges: Set<string> = new Set();

	constructor(
		files: Y.Map<FileNode>,
		roomId: string,
		ydoc: Y.Doc,
		createDefaultContent: () => void
	) {
		this.files = files;
		this.roomId = roomId;
		this.ydoc = ydoc;
		this.createDefaultContent = createDefaultContent;
		this.setupObservers();
	}

	private setupObservers() {
		// Observe file changes
		this.files.observe((event) => {
			event.changes.keys.forEach((change, key) => {
				if (change.action === 'add' || change.action === 'update') {
					this.pendingChanges.add(key);
				} else if (change.action === 'delete') {
					this.pendingChanges.add(`delete:${key}`);
				}
			});

			// Debounce sync
			if (this.syncInterval) {
				clearTimeout(this.syncInterval);
			}
			this.syncInterval = window.setTimeout(() => {
				this.syncChanges();
			}, 1000);
		});
	}

	private async syncChanges() {
		if (this.pendingChanges.size === 0) return;

		const changes = Array.from(this.pendingChanges);
		this.pendingChanges.clear();

		for (const change of changes) {
			if (change.startsWith('delete:')) {
				const fileId = change.substring(7);
				await this.deleteFileFromDB(fileId);
			} else {
				const file = this.files.get(change);
				if (file) {
					await this.syncFileToDB(file);
				}
			}
		}
	}

	private async syncFileToDB(file: FileNode) {
		try {
			const response = await fetch(`/api/projects/${this.roomId}/files`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					fileId: file.id,
					updates: {
						name: file.name,
						content: file.content,
						parentId: file.parentId
					}
				})
			});

			if (!response.ok) {
				console.error('Failed to sync file:', await response.text());
			}
		} catch (error) {
			console.error('Error syncing file:', error);
		}
	}

	private async deleteFileFromDB(fileId: string) {
		try {
			const response = await fetch(`/api/projects/${this.roomId}/files`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ fileId })
			});

			if (!response.ok) {
				console.error('Failed to delete file:', await response.text());
			}
		} catch (error) {
			console.error('Error deleting file:', error);
		}
	}

	async loadFromDB() {
		try {
			const response = await fetch(`/api/projects/${this.roomId}`);
			if (!response.ok) {
				if (response.status === 404) {
					// Project doesn't exist in DB, check if we're authenticated
					const authCheck = await fetch('/api/projects');
					if (authCheck.ok) {
						// User is authenticated, create project in DB
						await this.createProject();
					} else {
						// User is not authenticated, create default content
						this.createDefaultContent();
					}
				} else if (response.status === 401) {
					// User is not authenticated, create default content
					this.createDefaultContent();
				} else {
					throw new Error('Failed to load project');
				}
				return;
			}

			const data = await response.json();

			// Clear existing files and Y.Text documents
			this.files.clear();

			// Load files from database
			for (const file of data.files) {
				this.files.set(file.id, {
					id: file.id,
					name: file.name,
					type: file.type,
					parentId: file.parentId,
					content: file.content || ''
				});

				// Initialize Y.Text for this file with database content
				if (file.type === 'file') {
					const fileYText = this.ydoc.getText(`file-${file.id}`);
					if (fileYText.length === 0 && file.content) {
						fileYText.insert(0, file.content);
					}
				}
			}

			// Set the first file as active if no active file is set, or if current active file doesn't exist
			const activeFileMap = this.ydoc.getMap('activeFile');
			const currentActiveFile = activeFileMap.get('id');
			const currentActiveFileId = currentActiveFile && typeof currentActiveFile === 'object' && currentActiveFile.id ? currentActiveFile.id : null;
			
			// Check if current active file is valid
			const isActiveFileValid = currentActiveFileId && data.files.some((f: { id: string; type: string }) => f.id === currentActiveFileId && f.type === 'file');
			
			if (data.files.length > 0 && (!currentActiveFileId || !isActiveFileValid)) {
				const firstFile = data.files.find((f: { type: string }) => f.type === 'file');
				if (firstFile) {
					activeFileMap.set('id', { id: firstFile.id });
					console.log('Set active file to:', firstFile.id, isActiveFileValid ? '(correcting invalid active file)' : '(no active file set)');
				}
			}
		} catch (error) {
			console.error('Error loading from database:', error);
			// If there's an error, create default content
			this.createDefaultContent();
		}
	}

	private async createProject() {
		try {
			const response = await fetch(`/api/projects/${this.roomId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: 'Untitled Project'
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create project');
			}

			const data = await response.json();

			// Clear existing files
			this.files.clear();

			// Load the created files
			for (const file of data.files) {
				this.files.set(file.id, {
					id: file.id,
					name: file.name,
					type: file.type,
					parentId: file.parentId,
					content: file.content || ''
				});

				// Initialize Y.Text for this file with database content
				if (file.type === 'file') {
					const fileYText = this.ydoc.getText(`file-${file.id}`);
					if (fileYText.length === 0 && file.content) {
						fileYText.insert(0, file.content);
					}
				}
			}

			// Set the first file as active
			const firstFile = data.files.find((f: { type: string }) => f.type === 'file');
			if (firstFile) {
				const activeFileMap = this.ydoc.getMap('activeFile');
				activeFileMap.set('id', { id: firstFile.id });
				console.log('Set active file to:', firstFile.id);
			}
		} catch (error) {
			console.error('Error creating project:', error);
		}
	}

	destroy() {
		if (this.syncInterval) {
			clearTimeout(this.syncInterval);
		}
	}
}
