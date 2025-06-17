# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
pnpm dev              # Start development server
pnpm dev -- --open    # Start dev server and open browser

# Code quality
pnpm lint             # Run Prettier and ESLint checks
pnpm format           # Auto-format code with Prettier
pnpm check            # Type-check with svelte-check
pnpm check:watch      # Type-check in watch mode

# Build
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm start            # Start production server (Node.js)

# Database
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Drizzle Studio for database UI
```

## Architecture Overview

This is a SvelteKit application designed for collaborative LaTeX editing (CollabTex) with server-side authentication and edge deployment capabilities.

### Key Architectural Decisions

1. **Real-time Collaboration System**:
   - YJS (v13.6.27) for CRDT-based conflict resolution
   - WebRTC provider for peer-to-peer connections
   - WebSocket fallback for reliability (signaling server: `wss://signalling-server-dz5m.onrender.com`)
   - IndexedDB persistence for offline support
   - File synchronization logic in `src/lib/collaboration/`

2. **LaTeX Editor Architecture**:
   - CodeMirror 6 with custom LaTeX language support (`src/lib/editor/`)
   - Client-side LaTeX compilation using Web Workers
   - PDF generation with jsPDF (basic) and PDF.js for viewing
   - Multiple compilation engine support in `src/lib/latex/compilation-engines.ts`

3. **Authentication System**: Custom session-based auth implementation (not using Lucia despite demo route name)
   - Sessions stored in database with 30-day expiration
   - SHA-256 hashed session tokens in cookies
   - Argon2 password hashing
   - All auth logic in `src/lib/server/auth.ts`
   - Session validation on every request via `hooks.server.ts`

4. **Database Architecture**:
   - Drizzle ORM with SQLite/Turso (edge-compatible)
   - Schema defined in `src/lib/server/db/schema.ts` (users, sessions, projects, files, project shares)
   - Connection uses `DATABASE_URL` environment variable
   - Database client initialized in `src/lib/server/db/index.ts`

5. **Server-Side Form Actions**: Login/register/logout use SvelteKit form actions in `+page.server.ts` files for progressive enhancement

6. **Deployment**: Currently uses Node.js adapter (`@sveltejs/adapter-node`) despite Cloudflare adapter being installed

### Project Structure

- `/src/lib/server/` - Server-only code (auth, database) that cannot be imported client-side
- `/src/lib/collaboration/` - YJS setup and real-time collaboration logic
- `/src/lib/components/` - UI components (Editor, PDFViewer, FileExplorer, etc.)
- `/src/lib/editor/` - CodeMirror LaTeX language definition and extensions
- `/src/lib/latex/` - LaTeX compilation engines and configuration
- `/src/lib/workers/` - Web Workers for LaTeX compilation
- `/src/routes/` - File-based routing with `+page.svelte` for UI and `+page.server.ts` for server logic
- `/src/routes/editor/[roomId]/` - Main collaborative editor interface
- `/src/routes/dashboard/` - User dashboard for project management
- Authentication flow example in `/src/routes/demo/lucia/` (note: uses custom auth, not Lucia)

### Environment Variables

Required:
- `DATABASE_URL` - Connection string for Turso/LibSQL database
- `DATABASE_AUTH_TOKEN` - Turso authentication token (if using remote database)

Optional:
- `VITE_SIGNALING_URL` - Custom WebRTC signaling server URL
- `VITE_SIGNALING_API_KEY` - API key for signaling server
- `LATEX_SERVER_URL` - URL for server-side LaTeX compilation service

### Development Notes

- No test framework configured yet
- Uses pnpm as package manager (version 10.10.0)
- Tailwind CSS 4.0 with Vite plugin for styling
- MDsveX enabled for Markdown support in Svelte components
- UI components use shadcn-svelte with Bits UI
- Development server runs on port 5173
- Worker format configured for ES modules in Vite
