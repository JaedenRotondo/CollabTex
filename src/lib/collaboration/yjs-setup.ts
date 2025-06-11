import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { FileSync } from './file-sync';
import { config } from '$lib/config';

export interface FileNode {
	id: string;
	name: string;
	type: 'file' | 'folder';
	parentId: string | null;
	content?: string;
}

export interface CollaborationInstance {
	ydoc: Y.Doc;
	provider: WebrtcProvider;
	persistence: IndexeddbPersistence;
	awareness: WebrtcProvider['awareness'];
	files: Y.Map<FileNode>;
	activeFile: Y.Map<{ id: string }>;
	fileSync: FileSync;
	createDefaultContent: () => void;
}

export function initializeCollaboration(roomId: string): CollaborationInstance {
	console.log('Creating YJS document for room:', roomId);

	const ydoc = new Y.Doc();

	// Initialize the main text content
	const ytext = ydoc.getText('latex-content');

	// Initialize file system
	const files = ydoc.getMap<FileNode>('files');
	const activeFile = ydoc.getMap<{ id: string }>('activeFile');

	console.log('Creating WebRTC provider...');

	// WebRTC provider for P2P collaboration
	// Append API key to signaling URL if provided
	const signalingUrl = config.signaling.apiKey 
		? `${config.signaling.url}?apiKey=${config.signaling.apiKey}`
		: config.signaling.url;
	
	const provider = new WebrtcProvider(roomId, ydoc, {
		signaling: [signalingUrl],
		maxConns: 20,
		filterBcConns: true,
		peerOpts: {}
	});

	console.log('Setting user awareness...');

	// Set user awareness
	provider.awareness.setLocalStateField('user', {
		name: `User ${Math.floor(Math.random() * 100)}`,
		color: getRandomColor(),
		colorLight: getRandomLightColor()
	});

	console.log('Creating IndexedDB persistence...');

	// IndexedDB persistence for offline support
	const persistence = new IndexeddbPersistence(roomId, ydoc);

	// Function to create default content when needed
	const createDefaultContent = () => {
		if (files.size === 0) {
			const mainFileId = 'main-tex';
			const defaultContent = `\\documentclass{article}
\\usepackage{graphicx}
\\usepackage{amsmath}

\\title{Your Document Title}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Start writing your LaTeX document here...

\\end{document}`;

			files.set(mainFileId, {
				id: mainFileId,
				name: 'main.tex',
				type: 'file',
				parentId: null,
				content: defaultContent
			});

			// Set as active file
			activeFile.set('id', { id: mainFileId });

			// Initialize the Y.Text content for this file
			const fileYText = ydoc.getText(`file-${mainFileId}`);
			if (fileYText.length === 0) {
				fileYText.insert(0, defaultContent);
			}
		}
	};

	// File synchronization with database
	const fileSync = new FileSync(files, roomId, ydoc, createDefaultContent);

	// Load files from database if user is authenticated
	if (typeof window !== 'undefined') {
		fileSync.loadFromDB().catch(console.error);
	}

	console.log('Collaboration setup complete');

	return {
		ydoc,
		provider,
		persistence,
		awareness: provider.awareness,
		files,
		activeFile,
		fileSync,
		createDefaultContent
	};
}

function getRandomColor(): string {
	const colors = [
		'#FF6B6B',
		'#4ECDC4',
		'#45B7D1',
		'#96CEB4',
		'#FFEAA7',
		'#DDA0DD',
		'#FA8072',
		'#98D8C8'
	];
	return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomLightColor(): string {
	const colors = [
		'#FFE5E5',
		'#E5F9F6',
		'#E5F3F7',
		'#F0F7ED',
		'#FFF9E5',
		'#F5E5F5',
		'#FFE5E0',
		'#E8F5F2'
	];
	return colors[Math.floor(Math.random() * colors.length)];
}
