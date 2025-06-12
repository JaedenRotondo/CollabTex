import * as Y from 'yjs';

export class FileSync {
	private fileContent: Y.Text;
	private roomId: string;
	private createDefaultContent: () => void;
	private syncInterval: number | null = null;
	private contentChanged: boolean = false;
	private fileExists: boolean = false;

	constructor(fileContent: Y.Text, roomId: string, createDefaultContent: () => void) {
		this.fileContent = fileContent;
		this.roomId = roomId;
		this.createDefaultContent = createDefaultContent;
		this.setupObservers();
	}

	private setupObservers() {
		// Observe content changes
		this.fileContent.observe(() => {
			this.contentChanged = true;

			// Debounce sync
			if (this.syncInterval) {
				clearTimeout(this.syncInterval);
			}
			this.syncInterval = window.setTimeout(() => {
				this.syncContent();
			}, 1000);
		});
	}

	private async syncContent() {
		if (!this.contentChanged) return;

		this.contentChanged = false;
		const content = this.fileContent.toString();
		await this.syncContentToDB(content);
	}

	private async syncContentToDB(content: string) {
		try {
			const response = await fetch(`/api/projects/${this.roomId}/content`, {
				method: this.fileExists ? 'PATCH' : 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content })
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`Failed to ${this.fileExists ? 'update' : 'create'} content:`, errorText);
				throw new Error(`Failed to ${this.fileExists ? 'update' : 'create'} content: ${errorText}`);
			}

			if (!this.fileExists) {
				this.fileExists = true;
			}
		} catch (error) {
			console.error('Error syncing content:', error);
			this.contentChanged = true;
			throw error;
		}
	}

	async loadFromDB() {
		try {
			console.log('Loading project content from DB, roomId:', this.roomId);
			const response = await fetch(`/api/projects/${this.roomId}/content`);
			console.log('API response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.log('API error response:', errorText);

				if (response.status === 404) {
					// Project doesn't exist in DB, check if we're authenticated
					console.log('Project not found (404), checking authentication...');
					const authCheck = await fetch('/api/projects');
					if (authCheck.ok) {
						// User is authenticated, create project in DB
						console.log('User is authenticated, creating new project');
						await this.createProject();
					} else {
						// User is not authenticated, create default content
						console.log('User not authenticated, creating default content');
						this.createDefaultContent();
					}
				} else if (response.status === 401) {
					// User is not authenticated and project is not publicly shared
					console.log('Project not publicly accessible (401), creating default content');
					this.createDefaultContent();
				} else if (response.status === 403) {
					// User is authenticated but doesn't have access
					console.log('Access denied to project (403), creating default content');
					this.createDefaultContent();
				} else {
					throw new Error(`Failed to load project: ${response.status} ${errorText}`);
				}
				return;
			}

			const data = await response.json();
			console.log('Successfully loaded project content:', data);

			// Load content into Y.Text
			if (data.content && this.fileContent.length === 0) {
				this.fileContent.insert(0, data.content);
				this.fileExists = true;
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

			// Load initial content if available
			if (data.content && this.fileContent.length === 0) {
				this.fileContent.insert(0, data.content);
				this.fileExists = true;
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
