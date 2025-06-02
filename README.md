# CollabTeX - Collaborative LaTeX Editor

A peer-to-peer collaborative LaTeX editor built with SvelteKit, featuring real-time collaboration, client-side compilation, and an Overleaf-inspired interface.

## Features

- 🤝 **Real-time P2P Collaboration** - Multiple users can edit the same document simultaneously using YJS and WebRTC
- 🖥️ **Client-side LaTeX Compilation** - LaTeX documents compile entirely in your browser
- 📄 **Live PDF Preview** - See your compiled document update in real-time
- ✨ **LaTeX Autocomplete** - Smart suggestions for LaTeX commands and environments
- 💾 **Offline Support** - Documents are persisted locally using IndexedDB
- 🎨 **Overleaf-inspired UI** - Familiar interface for LaTeX users
- ☁️ **Cloudflare Deployment** - Fast, global edge deployment

## Tech Stack

- **Frontend**: SvelteKit 2.0 + TypeScript
- **Styling**: Tailwind CSS 4.0 + shadcn-svelte
- **Collaboration**: YJS + WebRTC
- **Editor**: CodeMirror 6
- **PDF Viewer**: PDF.js
- **LaTeX Compilation**: Browser-based jsPDF (production would use TeXLive WASM)
- **Deployment**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/collabtex.git
cd collabtex

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to see the application.

## Usage

1. **Create a Room**: Click "Create New Room" on the home page
2. **Share the Link**: Copy the room URL and share it with collaborators
3. **Start Writing**: Begin typing your LaTeX document
4. **Compile**: Click the "Compile" button to generate a PDF
5. **Collaborate**: See other users' cursors and edits in real-time

## Development

```bash
# Run development server
pnpm dev

# Type checking
pnpm check

# Linting
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy to Cloudflare Pages:

```bash
pnpm run build
wrangler pages publish .svelte-kit/cloudflare --project-name=collabtex
```

## Architecture

- **P2P Collaboration**: Uses YJS with WebRTC for serverless real-time sync
- **LaTeX Compilation**: Runs entirely in Web Workers for non-blocking compilation
- **File System**: Virtual file system in IndexedDB for multi-file projects
- **State Management**: YJS documents handle both text content and collaboration state

## Roadmap

- [ ] Full TeXLive WebAssembly integration
- [ ] Multi-file project support
- [ ] Git integration
- [ ] BibTeX support
- [ ] Custom templates
- [ ] Export to various formats (Word, Markdown)
- [ ] Commenting and track changes
- [ ] AI-powered LaTeX assistance

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by [Overleaf](https://www.overleaf.com)
- Built with [SvelteKit](https://kit.svelte.dev)
- Powered by [YJS](https://yjs.dev) for CRDT-based collaboration
