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
pnpm build            # Build for production (Cloudflare)
pnpm preview          # Preview production build

# Database
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Drizzle Studio for database UI
```

## Architecture Overview

This is a SvelteKit application designed for collaborative LaTeX editing (CollabTex) with server-side authentication and edge deployment capabilities.

### Key Architectural Decisions

1. **Authentication System**: Custom session-based auth implementation (not using Lucia despite demo route name)

   - Sessions stored in database with 30-day expiration
   - SHA-256 hashed session tokens in cookies
   - Argon2 password hashing
   - All auth logic in `src/lib/server/auth.ts`
   - Session validation on every request via `hooks.server.ts`

2. **Database Architecture**:

   - Drizzle ORM with SQLite/Turso (edge-compatible)
   - Schema defined in `src/lib/server/db/schema.ts`
   - Connection uses `DATABASE_URL` environment variable
   - Database client initialized in `src/lib/server/db/index.ts`

3. **Server-Side Form Actions**: Login/register/logout use SvelteKit form actions in `+page.server.ts` files for progressive enhancement

4. **Edge Deployment**: Configured for Cloudflare Workers with appropriate adapter and edge-compatible database

### Project Structure

- `/src/lib/server/` - Server-only code (auth, database) that cannot be imported client-side
- `/src/routes/` - File-based routing with `+page.svelte` for UI and `+page.server.ts` for server logic
- Authentication flow example in `/src/routes/demo/lucia/` (note: uses custom auth, not Lucia)

### Environment Variables

Required:

- `DATABASE_URL` - Connection string for Turso/LibSQL database

### Development Notes

- No test framework configured yet
- Uses pnpm as package manager (version 10.10.0)
- Tailwind CSS 4.0 with Vite plugin for styling
- MDsveX enabled for Markdown support in Svelte components
