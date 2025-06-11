# CollabTex Signaling Server

Secure WebRTC signaling server for CollabTex collaborative LaTeX editor.

## Features

- **API Key Authentication**: Requires valid API key for connections
- **Origin Validation**: Only accepts connections from whitelisted origins
- **Rate Limiting**: Prevents abuse by limiting connections per IP
- **YJS Integration**: Built on y-websocket for Yjs collaboration

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

4. Add environment variables:
   - `ALLOWED_ORIGINS`: Your production domain(s), comma-separated
   - `SIGNALING_API_KEY`: Generate a secure random string
   - `NODE_ENV`: Set to `production`

## Local Development

```bash
npm install
npm run dev
```

## Security Configuration

### Environment Variables

- `PORT`: Server port (default: 4444)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `SIGNALING_API_KEY`: API key for authentication
- `NODE_ENV`: Set to `production` to hide API key in logs

### Rate Limiting

- Default: 100 connections per IP per minute
- Automatically cleans up old entries

## Client Configuration

The client must include the API key when connecting:

```javascript
const signalingUrl = `wss://your-server.onrender.com?apiKey=${API_KEY}`;
```