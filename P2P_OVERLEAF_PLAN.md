# P2P Overleaf Clone - Implementation Plan

## Overview

Building a peer-to-peer collaborative LaTeX editor with real-time collaboration, client-side compilation, and PDF preview.

## Tech Stack

- **Frontend**: SvelteKit + Tailwind CSS + shadcn-svelte
- **P2P Collaboration**: YJS with WebRTC provider
- **LaTeX Compilation**: TeXLive.js (WebAssembly LaTeX compiler)
- **PDF Viewer**: PDF.js
- **Code Editor**: CodeMirror 6 with LaTeX support
- **Deployment**: Cloudflare Pages/Workers

## Architecture

### 1. Client-Side Components

- **Editor**: CodeMirror with YJS binding for real-time collaboration
- **PDF Viewer**: PDF.js for rendering compiled documents
- **File Explorer**: Tree view for project structure
- **Toolbar**: Compile, download, share buttons
- **User Presence**: Show active collaborators with cursors

### 2. P2P Infrastructure

- **YJS Document**: Shared CRDT for conflict-free collaboration
- **WebRTC Provider**: Direct peer connections (y-webrtc)
- **Signaling Server**: Minimal WebSocket server for peer discovery
- **Persistence**: IndexedDB for offline support

### 3. LaTeX Processing

- **TeXLive.js**: WebAssembly LaTeX compiler running in Web Worker
- **Virtual File System**: In-memory FS for LaTeX files
- **Asset Management**: Handle images, bibliography, packages

## Step-by-Step Implementation

### Phase 1: Project Setup & UI Foundation

1. **Install Dependencies**

```bash
pnpm add -D @shadcn-svelte/cli tailwindcss @tailwindcss/typography
pnpm add yjs y-webrtc y-indexeddb y-codemirror.next
pnpm add @codemirror/lang-tex @codemirror/autocomplete
pnpm add pdfjs-dist
pnpm add bits-ui clsx tailwind-merge lucide-svelte
```

2. **Initialize shadcn-svelte**

```bash
pnpm dlx @shadcn-svelte/cli init
```

3. **Create Layout Structure**

- Split pane layout (editor left, PDF right)
- Top toolbar with compile/share buttons
- File explorer sidebar
- Status bar

### Phase 2: Editor Implementation

1. **CodeMirror Setup**

```typescript
// src/lib/components/Editor.svelte
import { EditorView, basicSetup } from 'codemirror';
import { tex } from '@codemirror/lang-tex';
import { yCollab } from 'y-codemirror.next';
```

2. **YJS Integration**

```typescript
// src/lib/collaboration/yjs-setup.ts
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

const ydoc = new Y.Doc();
const provider = new WebrtcProvider('collabtex-room', ydoc);
const persistence = new IndexeddbPersistence('collabtex-doc', ydoc);
```

3. **LaTeX Autocomplete**

```typescript
// src/lib/editor/latex-completion.ts
const latexCompletions = [
	{ label: '\\section', type: 'keyword' },
	{ label: '\\subsection', type: 'keyword' },
	{ label: '\\begin', type: 'keyword' }
	// ... more completions
];
```

### Phase 3: LaTeX Compilation

1. **Web Worker Setup**

```typescript
// src/lib/workers/latex-compiler.worker.ts
import { TeXLive } from 'texlive.js';

self.addEventListener('message', async (e) => {
	if (e.data.type === 'compile') {
		const engine = new TeXLive();
		const result = await engine.compile(e.data.content);
		self.postMessage({ type: 'compiled', pdf: result.pdf });
	}
});
```

2. **Virtual File System**

```typescript
// src/lib/latex/virtual-fs.ts
class VirtualFileSystem {
	files: Map<string, Uint8Array>;

	writeFile(path: string, content: string | Uint8Array) {
		this.files.set(path, content);
	}

	readFile(path: string): Uint8Array {
		return this.files.get(path);
	}
}
```

### Phase 4: PDF Viewer

1. **PDF.js Integration**

```typescript
// src/lib/components/PDFViewer.svelte
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.js';

let pdfDoc = null;
let pageNum = 1;
let scale = 1.5;

async function renderPDF(pdfData: ArrayBuffer) {
	pdfDoc = await pdfjsLib.getDocument(pdfData).promise;
	renderPage(pageNum);
}
```

2. **Sync with Editor**

- SyncTeX support for source ↔ PDF navigation
- Highlight current position
- Jump to source from PDF click

### Phase 5: Collaboration Features

1. **User Presence**

```typescript
// src/lib/collaboration/presence.ts
const awareness = provider.awareness;

awareness.setLocalStateField('user', {
	name: userName,
	color: userColor,
	cursor: null
});
```

2. **Cursor Sharing**

```typescript
// Share cursor positions
editor.on('cursorActivity', () => {
	const cursor = editor.getCursor();
	awareness.setLocalStateField('cursor', cursor);
});
```

3. **Room Management**

```typescript
// src/lib/collaboration/rooms.ts
class RoomManager {
	createRoom(): string {
		return crypto.randomUUID();
	}

	joinRoom(roomId: string) {
		provider.connect();
		provider.room = roomId;
	}
}
```

### Phase 6: UI Theme & Components

1. **Overleaf-Inspired Theme**

```css
/* src/app.css */
:root {
	--overleaf-green: #468847;
	--overleaf-dark: #2c3e50;
	--overleaf-sidebar: #f5f5f5;
}
```

2. **Component Library**

- File tree component
- Split pane resizable
- Toolbar with dropdown menus
- Modal dialogs for settings
- User avatar list

### Phase 7: Advanced Features

1. **Project Templates**

```typescript
const templates = {
	article: '\\documentclass{article}\n\\begin{document}\n\\end{document}',
	report: '\\documentclass{report}\n\\begin{document}\n\\end{document}'
	// more templates
};
```

2. **File Management**

- Multi-file projects
- Image/asset uploads to IndexedDB
- Export/import project as ZIP

3. **Settings Panel**

- Compiler options (pdflatex, xelatex, lualatex)
- Theme preferences
- Editor settings

### Phase 8: Deployment

1. **Cloudflare Configuration**

```javascript
// wrangler.toml
name = 'collabtex';
compatibility_date = '2024-01-01'[site];
bucket = './build'[[r2_buckets]];
binding = 'ASSETS';
bucket_name = 'collabtex-assets';
```

2. **Signaling Server**

```typescript
// functions/signaling.ts
export async function onRequestPost({ request, env }) {
	// Minimal signaling for WebRTC peer discovery
	const { roomId, signal } = await request.json();

	// Use Durable Objects for room state
	const roomObject = env.ROOMS.get(env.ROOMS.idFromName(roomId));
	return roomObject.fetch(request);
}
```

3. **Performance Optimizations**

- Lazy load PDF.js and TeXLive.js
- Code splitting for routes
- Service Worker for offline support
- CDN for static assets

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── Editor.svelte
│   │   ├── PDFViewer.svelte
│   │   ├── FileExplorer.svelte
│   │   ├── Toolbar.svelte
│   │   └── UserPresence.svelte
│   ├── collaboration/
│   │   ├── yjs-setup.ts
│   │   ├── presence.ts
│   │   └── rooms.ts
│   ├── latex/
│   │   ├── compiler.ts
│   │   ├── virtual-fs.ts
│   │   └── templates.ts
│   ├── workers/
│   │   └── latex-compiler.worker.ts
│   └── stores/
│       ├── document.ts
│       ├── settings.ts
│       └── project.ts
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── editor/[roomId]/
│   │   └── +page.svelte
│   └── api/
│       └── signaling/
│           └── +server.ts
└── app.css
```

## Security Considerations

- Sanitize LaTeX input to prevent malicious code
- Rate limiting on compilation requests
- Validate file uploads (size, type)
- Secure WebRTC connections
- Room access control (optional)

## Performance Targets

- Initial load: < 3s
- LaTeX compilation: < 5s for typical documents
- Real-time sync latency: < 100ms
- Support 10+ concurrent users per room

## MVP Features

1. Single-file LaTeX editing
2. Real-time collaboration
3. PDF preview
4. Basic LaTeX autocomplete
5. Share via room link

## Future Enhancements

- GitHub integration
- Citation management (BibTeX)
- Spell checking
- Version history
- Comments and track changes
- Export to various formats
- AI-powered LaTeX assistance
