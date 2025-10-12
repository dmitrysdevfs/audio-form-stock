# OpenAI Realtime API Integration

## Overview

This module provides integration with OpenAI's Realtime API for audio processing and AI conversation capabilities.

## Features

- Real-time audio processing
- WebSocket communication with OpenAI
- Audio-to-text conversion
- AI response generation
- Error handling and connection management

## Setup

### 1. Environment Variables

**Backend** - Create a `.env` file in the backend directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

**Frontend** - Create a `.env.local` file in the frontend directory:

```bash
# For production deployment (HTTPS requires WSS)
NEXT_PUBLIC_BACKEND_URL=wss://your-backend-url.onrender.com

# For local development (optional)
# NEXT_PUBLIC_BACKEND_URL=ws://localhost:3001
```

### 2. Install Dependencies

```bash
npm install ws @types/ws
```

### 3. Configure Environment Variables

**For Production Deployment:**

1. **Vercel (Frontend)**: Add environment variable in Vercel dashboard:

   ```   NEXT_PUBLIC_BACKEND_URL=wss://your-backend-url.onrender.com
   ```

2. **Render (Backend)**: Add environment variable in Render dashboard:

   ```   OPENAI_API_KEY=your_openai_api_key_here
   ```

### 4. Start the Server

```bash
npm run dev
```

## API Endpoints

### WebSocket Endpoints

- `ws://localhost:3001/api/audio/conversation` - Real-time conversation WebSocket

### REST Endpoints

- `POST /api/audio/audio/message` - Send audio data for processing
- `GET /api/audio/audio/status` - Check OpenAI service status

## Usage

### Frontend Integration

```typescript
// Connect to WebSocket (uses environment variable)
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:3001';
const ws = new WebSocket(`${backendUrl}/api/audio/conversation`);

// Send audio data
ws.send(JSON.stringify({
  type: 'audio',
  data: audioBase64Data,
  messageType: 'audio'
}));

// Send text message
ws.send(JSON.stringify({
  type: 'text',
  data: 'Hello, how are you?',
  messageType: 'text'
}));
```

### Audio Processing Flow

1. Frontend captures audio from microphone
2. Audio is converted to base64 and sent via WebSocket
3. Backend forwards audio to OpenAI Realtime API
4. OpenAI processes audio and returns response
5. Response is sent back to frontend

## Architecture

```Frontend (Audio Capture)
    ↓ WebSocket
Backend (Audio Controller)
    ↓ WebSocket
OpenAI Realtime API
    ↓ Response
Backend (Response Handler)
    ↓ WebSocket
Frontend (Display Response)
```

## Error Handling

- Connection failures are logged and handled gracefully
- Invalid audio formats are rejected with error messages
- OpenAI API errors are forwarded to the client

## Development Notes

- Ensure OpenAI API key is valid and has Realtime API access
- Monitor WebSocket connections for proper cleanup
- Test audio format compatibility with OpenAI requirements
