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
	console.log('Creating YJS document for room:', roomId);
	console.log('Using signaling server:', config.signaling.url);

	const ydoc = new Y.Doc();

	// Initialize the main text content
	const mainContent = ydoc.getText('main-content');

	console.log('Creating WebRTC provider...');

	// WebRTC provider for P2P collaboration
	console.log('Creating WebRTC provider with roomId:', roomId);
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
	
	console.log('WebRTC provider created, roomId:', provider.roomName);

	console.log('Setting user awareness...');

	// Set user awareness (will be updated later with real user info)
	const userName = `User ${Math.floor(Math.random() * 100)}`;
	provider.awareness.setLocalStateField('user', {
		name: userName,
		color: getRandomColor(),
		colorLight: getRandomLightColor()
	});
	
	console.log('Set local user awareness:', userName);

	// Add connection event listeners for debugging
	provider.on('status', (event: any) => {
		console.log('WebRTC Provider status changed:', event);
	});

	provider.on('peers', (event: any) => {
		console.log('WebRTC Provider peers changed:', {
			added: event.added,
			removed: event.removed,
			webrtcPeers: event.webrtcPeers,
			bcPeers: event.bcPeers,
			totalPeers: (event.webrtcPeers || []).length + (event.bcPeers || []).length
		});
	});

	provider.on('synced', (event: any) => {
		console.log('WebRTC Provider sync status:', event);
	});

	// Add signaling connection debugging
	provider.signalingConns.forEach((conn, i) => {
		console.log(`Signaling connection ${i}:`, conn.url);
		conn.on('connect', () => console.log(`Signaling ${i} connected`));
		conn.on('disconnect', () => console.log(`Signaling ${i} disconnected`)); 
		conn.on('error', (error: any) => console.log(`Signaling ${i} error:`, error));
	});

	// Create WebSocket provider as fallback
	console.log('Creating WebSocket provider as fallback...');
	const wsProvider = new WebsocketProvider(config.signaling.url, roomId, ydoc, {
		awareness: provider.awareness // Share the same awareness
	});
	
	wsProvider.on('status', (event: any) => {
		console.log('WebSocket Provider status:', event);
	});
	
	wsProvider.on('sync', (isSynced: boolean) => {
		console.log('WebSocket Provider synced:', isSynced);
	});

	// Add awareness debugging
	provider.awareness.on('change', (changes: any) => {
		const states = provider.awareness.getStates();
		console.log('Awareness changed:', {
			added: changes.added,
			updated: changes.updated, 
			removed: changes.removed,
			totalStates: states.size,
			allUsers: Array.from(states.values()).map(state => state.user?.name).filter(Boolean)
		});
	});

	// Also log initial awareness state
	setTimeout(() => {
		const states = provider.awareness.getStates();
		console.log('Initial awareness state:', {
			totalStates: states.size,
			allUsers: Array.from(states.values()).map(state => state.user?.name).filter(Boolean)
		});
	}, 1000);

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
