# CollabTeX Deployment Guide

## Prerequisites

1. Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`
3. Node.js 18+ and pnpm installed

## Deployment Steps

### 1. Build the Application

```bash
pnpm install
pnpm run build
```

### 2. Deploy to Cloudflare Pages

#### Option A: Using Wrangler CLI

```bash
# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages publish .svelte-kit/cloudflare --project-name=collabtex
```

#### Option B: Using Cloudflare Dashboard

1. Go to Cloudflare Dashboard > Pages
2. Create a new project
3. Connect your GitHub repository
4. Configure build settings:
   - Build command: `pnpm run build`
   - Build output directory: `.svelte-kit/cloudflare`
   - Environment variables: None required

### 3. Custom Domain (Optional)

1. In Cloudflare Pages dashboard, go to your project
2. Navigate to "Custom domains"
3. Add your domain
4. Update DNS records as instructed

## Environment Variables

No environment variables are required for basic functionality. The app uses:

- YJS with WebRTC for P2P collaboration (uses public signaling servers)
- Client-side LaTeX compilation
- IndexedDB for local persistence

## Production Considerations

### 1. WebRTC Signaling

The current implementation uses public YJS signaling servers. For production, consider:

1. Deploy your own signaling server:

```javascript
// signaling-server.js
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

const wss = new WebSocketServer({ port: 4444 });

wss.on('connection', (ws, req) => {
	setupWSConnection(ws, req);
});
```

2. Update the YJS configuration in `src/lib/collaboration/yjs-setup.ts`:

```typescript
const provider = new WebrtcProvider(roomId, ydoc, {
	signaling: ['wss://your-signaling-server.com']
	// ... other options
});
```

### 2. LaTeX Compilation

The current implementation uses a browser-based LaTeX compiler with jsPDF. For full LaTeX support:

1. **Option 1**: Use a WebAssembly LaTeX distribution

   - Host TeXLive WASM files on Cloudflare R2
   - Load them dynamically in the worker

2. **Option 2**: Use a server-side LaTeX API
   - Deploy a LaTeX compilation service
   - Call it from the worker via fetch

### 3. Performance Optimizations

1. Enable Cloudflare caching for static assets
2. Use Cloudflare Workers for API endpoints if needed
3. Enable Auto Minify in Cloudflare settings

### 4. Security

1. Implement rate limiting for compilation requests
2. Add CORS headers if needed
3. Consider authentication for private rooms

## Monitoring

1. Enable Cloudflare Analytics
2. Set up error tracking (e.g., Sentry)
3. Monitor WebRTC connection quality

## Troubleshooting

### Build Fails

- Ensure all dependencies are installed: `pnpm install`
- Check Node.js version: `node --version` (should be 18+)
- Clear cache: `rm -rf .svelte-kit node_modules`

### WebRTC Issues

- Check browser console for WebRTC errors
- Ensure HTTPS is enabled (required for WebRTC)
- Test with different browsers

### PDF Generation Issues

- Check browser console for worker errors
- Ensure PDF.js worker is loading correctly
- Verify LaTeX syntax in documents
