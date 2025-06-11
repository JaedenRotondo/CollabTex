# Signaling Server Security Guide

This guide explains how to secure your CollabTex signaling server so it only accepts connections from your website.

## Security Features Implemented

### 1. Origin Validation (CORS)
- Server only accepts connections from whitelisted origins
- Prevents other websites from using your signaling server
- Returns 403 Forbidden for unauthorized origins

### 2. Rate Limiting
- Limits connections per IP address (default: 100/minute)
- Prevents DoS attacks and abuse
- Returns 429 Too Many Requests when exceeded

### 3. Connection Logging
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

### 2. Set Environment Variables on Render

Add these environment variables in Render dashboard:

```bash
# Your production domains (comma-separated)
ALLOWED_ORIGINS=https://collabtex.com,https://www.collabtex.com

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
```

### 4. Deploy CollabTex to Production

When deploying to Cloudflare Pages or your hosting provider, set the same environment variables.

## Security Best Practices

### 1. Monitor Usage

- Check Render logs regularly for suspicious activity
- Look for repeated connection rejections from unauthorized origins
- Monitor for unusual traffic patterns

### 2. Additional Security Measures

For extra security, you can also implement:

1. **IP Whitelisting**: Only allow connections from specific IP ranges
2. **JWT Tokens**: Use short-lived tokens for authentication
3. **TLS Client Certificates**: Require client certificates for connections
4. **Geo-blocking**: Block connections from specific countries

## Troubleshooting

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
// This should fail (unauthorized origin)
// Open browser dev tools from a different domain and try:
new WebSocket('wss://your-server.onrender.com');

// This should succeed (from allowed origin)
// From your CollabTex app:
new WebSocket('wss://your-server.onrender.com');
```

## Monitoring and Alerts

Consider setting up:

1. **Uptime monitoring**: Use Render's health checks or external services
2. **Log aggregation**: Stream logs to a service like Datadog or Loggly
3. **Alerts**: Set up notifications for origin validation failures or high traffic

By following this guide, your signaling server will only accept connections from your CollabTex website, preventing unauthorized usage while maintaining reliable service for your users.