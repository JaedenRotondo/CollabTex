import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils.js';
import crypto from 'crypto';

// Configuration
const PORT = process.env.PORT || 4444;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
const API_KEY = process.env.SIGNALING_API_KEY || crypto.randomBytes(32).toString('hex');
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // Max connections per IP per window

// Log the API key on startup (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('Signaling Server API Key:', API_KEY);
}

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
    
    // Extract API key from URL or headers
    const url = new URL(req.url, `http://${req.headers.host}`);
    const apiKey = url.searchParams.get('apiKey') || req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== API_KEY) {
      console.log(`Rejected connection with invalid API key from ${origin}`);
      cb(false, 401, 'Unauthorized');
      return;
    }
    
    // Connection allowed
    console.log(`Accepted connection from ${origin} (IP: ${ip})`);
    cb(true);
  }
});

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`WebSocket connected from IP: ${ip}`);
  
  // Set up YJS connection
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