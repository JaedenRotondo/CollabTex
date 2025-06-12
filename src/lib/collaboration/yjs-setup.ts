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
	mainContent: Y.Text;
	fileSync: FileSync;
	createDefaultContent: () => void;
}

export function initializeCollaboration(roomId: string): CollaborationInstance {
	console.log('Creating YJS document for room:', roomId);

	const ydoc = new Y.Doc();

	// Initialize the main text content
	const mainContent = ydoc.getText('main-content');

	console.log('Creating WebRTC provider...');

	// WebRTC provider for P2P collaboration
	const provider = new WebrtcProvider(roomId, ydoc, {
		signaling: [config.signaling.url],
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
		if (mainContent.length === 0) {
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

			// Initialize the Y.Text content
			mainContent.insert(0, defaultContent);
		}
	};

	// File synchronization with database
	const fileSync = new FileSync(mainContent, roomId, createDefaultContent);

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
		mainContent,
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
