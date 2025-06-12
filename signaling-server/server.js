import { WebSocketServer } from 'ws';
import { createRequire } from 'module';

// Create require function for CommonJS modules
const require = createRequire(import.meta.url);
const { setupWSConnection } = require('y-websocket/bin/utils');

// Configuration
const PORT = process.env.PORT || 4444;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // Max connections per IP per window

// Rate limiting store
const rateLimitStore = new Map();

// Clean up rate limit store periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, data] of rateLimitStore.entries()) {
		if (now - data.windowStart > RATE_LIMIT_WINDOW) {
			rateLimitStore.delete(key);
		}
	}
}, RATE_LIMIT_WINDOW);

// Create WebSocket server
const wss = new WebSocketServer({
	port: PORT,
	verifyClient: (info, cb) => {
		const { origin, req } = info;
		const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

		// Check rate limiting
		const now = Date.now();
		const rateLimitKey = ip;
		const rateLimitData = rateLimitStore.get(rateLimitKey) || { windowStart: now, count: 0 };

		if (now - rateLimitData.windowStart > RATE_LIMIT_WINDOW) {
			rateLimitData.windowStart = now;
			rateLimitData.count = 0;
		}

		rateLimitData.count++;
		rateLimitStore.set(rateLimitKey, rateLimitData);

		if (rateLimitData.count > RATE_LIMIT_MAX) {
			console.log(`Rate limit exceeded for IP: ${ip}`);
			cb(false, 429, 'Too Many Requests');
			return;
		}

		// Check origin
		if (!ALLOWED_ORIGINS.includes(origin) && !ALLOWED_ORIGINS.includes('*')) {
			console.log(`Rejected connection from unauthorized origin: ${origin}`);
			cb(false, 403, 'Forbidden');
			return;
		}

		// API key check removed - origin validation is sufficient

		// Connection allowed
		console.log(`Accepted connection from ${origin} (IP: ${ip})`);
		cb(true);
	}
});

wss.on('connection', (ws, req) => {
	const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	console.log(`WebSocket connected from IP: ${ip}`);

	// Set up YJS connection using y-websocket
	setupWSConnection(ws, req);

	ws.on('close', () => {
		console.log(`WebSocket disconnected from IP: ${ip}`);
	});

	ws.on('error', (error) => {
		console.error(`WebSocket error from IP ${ip}:`, error);
	});
});

console.log(`Signaling server running on port ${PORT}`);
console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
