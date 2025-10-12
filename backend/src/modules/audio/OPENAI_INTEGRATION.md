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

Create a `.env` file in the backend directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Install Dependencies

```bash
npm install ws @types/ws
```

### 3. Start the Server

```bash
npm run dev
```

## API Endpoints

### WebSocket Endpoints

- `ws://localhost:3001/api/conversation` - Real-time conversation WebSocket

### REST Endpoints

- `POST /api/audio/message` - Send audio data for processing
- `GET /api/audio/status` - Check OpenAI service status

## Usage

### Frontend Integration

```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001/api/conversation');

// Start conversation
ws.send(JSON.stringify({
  action: 'start'
}));

// Send audio data
ws.send(JSON.stringify({
  messageType: 'audio',
  audioData: audioBase64Data
}));

// Send text message
ws.send(JSON.stringify({
  messageType: 'text',
  audioData: 'Hello, how are you?'
}));

// Stop conversation
ws.send(JSON.stringify({
  action: 'stop'
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
