import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';
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
	wsProvider: WebsocketProvider;
	persistence: IndexeddbPersistence;
	awareness: WebrtcProvider['awareness'];
	mainContent: Y.Text;
	fileSync: FileSync;
	createDefaultContent: () => void;
}

export function initializeCollaboration(roomId: string): CollaborationInstance {
	const ydoc = new Y.Doc();

	// Initialize the main text content
	const mainContent = ydoc.getText('main-content');

	// WebRTC provider for P2P collaboration
	const provider = new WebrtcProvider(roomId, ydoc, {
		signaling: [config.signaling.url],
		maxConns: 20,
		filterBcConns: true,
		peerOpts: {
			config: {
				iceServers: [
					{ urls: 'stun:stun.l.google.com:19302' },
					{ urls: 'stun:stun1.l.google.com:19302' }
				]
			}
		}
	});

	// Set user awareness (will be updated later with real user info)
	const userName = `User ${Math.floor(Math.random() * 100)}`;
	provider.awareness.setLocalStateField('user', {
		name: userName,
		color: getRandomColor(),
		colorLight: getRandomLightColor()
	});

	// Create WebSocket provider as fallback
	const wsProvider = new WebsocketProvider(config.signaling.url, roomId, ydoc, {
		awareness: provider.awareness
	});

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
		fileSync.loadFromDB().catch(() => {});
	}

	return {
		ydoc,
		provider,
		wsProvider,
		persistence,
		awareness: provider.awareness,
		mainContent,
		fileSync,
		createDefaultContent
	};
}

// Function to update user awareness with real user information
export function updateUserAwareness(provider: WebrtcProvider, user: { username: string }) {
	provider.awareness.setLocalStateField('user', {
		name: user.username,
		color: getRandomColor(),
		colorLight: getRandomLightColor()
	});
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
