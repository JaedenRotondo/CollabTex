# Signaling Server Security Guide

This guide explains how to secure your CollabTex signaling server so it only accepts connections from your website.

## Security Features Implemented

### 1. API Key Authentication
- Every client must provide a valid API key to connect
- API key is checked on WebSocket handshake
- Connections without valid keys are rejected with 401 Unauthorized

### 2. Origin Validation (CORS)
- Server only accepts connections from whitelisted origins
- Prevents other websites from using your signaling server
- Returns 403 Forbidden for unauthorized origins

### 3. Rate Limiting
- Limits connections per IP address (default: 100/minute)
- Prevents DoS attacks and abuse
- Returns 429 Too Many Requests when exceeded

### 4. Connection Logging
- All connection attempts are logged with IP and origin
- Helps monitor for suspicious activity

## Deployment Steps

### 1. Deploy Signaling Server on Render

1. Push the signaling server code to a GitHub repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure the service:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free tier is sufficient for small projects

### 2. Set Environment Variables on Render

Add these environment variables in Render dashboard:

```bash
# Your production domains (comma-separated)
ALLOWED_ORIGINS=https://collabtex.com,https://www.collabtex.com

# Generate a secure API key (use a password generator)
SIGNALING_API_KEY=your-very-secure-random-api-key-here

# Set to production
NODE_ENV=production

# Port (Render sets this automatically)
PORT=10000
```

### 3. Configure Your CollabTex App

Create a `.env` file in your CollabTex project:

```bash
# Your signaling server URL on Render
VITE_SIGNALING_URL=wss://your-signaling-server.onrender.com

# Same API key as on your signaling server
VITE_SIGNALING_API_KEY=your-very-secure-random-api-key-here
```

### 4. Deploy CollabTex to Production

When deploying to Cloudflare Pages or your hosting provider, set the same environment variables.

## Security Best Practices

### 1. Generate Strong API Keys

Use a cryptographically secure random string:

```bash
# Generate using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

### 2. Rotate API Keys Regularly

- Change API keys every 3-6 months
- Update both server and client configurations
- Keep old key active briefly during transition

### 3. Monitor Usage

- Check Render logs regularly for suspicious activity
- Look for repeated failed authentication attempts
- Monitor for unusual traffic patterns

### 4. Additional Security Measures

For extra security, you can also implement:

1. **IP Whitelisting**: Only allow connections from specific IP ranges
2. **JWT Tokens**: Use short-lived tokens instead of static API keys
3. **TLS Client Certificates**: Require client certificates for connections
4. **Geo-blocking**: Block connections from specific countries

## Troubleshooting

### Connection Rejected (401)
- Check that API key matches on client and server
- Ensure API key is properly encoded in URL

### Connection Rejected (403)
- Verify your domain is in ALLOWED_ORIGINS
- Check that you're using HTTPS in production

### Connection Rejected (429)
- You're hitting rate limits
- Reduce connection frequency or increase limits

### WebSocket Connection Fails
- Ensure signaling server is running
- Check that WSS (secure WebSocket) is used in production
- Verify firewall rules allow WebSocket connections

## Testing Security

Test your security configuration:

```javascript
// This should fail (no API key)
new WebSocket('wss://your-server.onrender.com');

// This should fail (wrong API key)
new WebSocket('wss://your-server.onrender.com?apiKey=wrong-key');

// This should succeed (correct API key from allowed origin)
new WebSocket('wss://your-server.onrender.com?apiKey=correct-key');
```

## Monitoring and Alerts

Consider setting up:

1. **Uptime monitoring**: Use Render's health checks or external services
2. **Log aggregation**: Stream logs to a service like Datadog or Loggly
3. **Alerts**: Set up notifications for authentication failures or high traffic

By following this guide, your signaling server will only accept connections from your CollabTex website, preventing unauthorized usage while maintaining reliable service for your users.