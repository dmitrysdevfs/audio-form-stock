import WebSocket from 'ws';

interface OpenAIRealtimeConfig {
  apiKey: string;
  model?: string;
}

interface AudioMessage {
  type: 'audio' | 'response' | 'error';
  data?: any;
  message?: string;
}

export class OpenAIRealtimeService {
  private ws: WebSocket | null = null;
  private config: OpenAIRealtimeConfig;
  private isConnected = false;
  private onResponse?: (response: any) => void;

  constructor(
    config: OpenAIRealtimeConfig,
    onResponse?: (response: any) => void
  ) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-10-01',
      ...config,
    };
    if (onResponse) {
      this.onResponse = onResponse;
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;

        this.ws = new WebSocket(url, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        });

        this.ws.on('open', () => {
          this.isConnected = true;

          // Initialize session with instructions
          this.initializeSession();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            // Handle JSON parsing errors
          }
        });

        this.ws.on('error', (error) => {
          this.isConnected = false;
          reject(error);
        });

        this.ws.on('close', () => {
          this.isConnected = false;
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private initializeSession(): void {
    if (!this.ws) return;

    // Send session update event
    this.ws.send(
      JSON.stringify({
        type: 'session.update',
        session: {
          type: 'realtime',
          instructions:
            'You are a helpful AI assistant. Respond naturally to audio input and provide helpful responses.',
          tools: [],
          tool_choice: 'auto',
        },
      })
    );
  }

  private handleMessage(message: any): void {
    // Handle different message types from OpenAI Realtime API
    switch (message.type) {
      case 'session.created':
        // Session created successfully
        break;
      case 'session.updated':
        // Session updated successfully
        break;
      case 'conversation.item.input_audio_buffer.committed':
        // Audio input committed
        break;
      case 'conversation.item.input_audio_buffer.speech_started':
        // Speech started
        break;
      case 'conversation.item.input_audio_buffer.speech_stopped':
        // Speech stopped
        break;
      case 'conversation.item.input_audio_buffer.transcript':
        // Send transcript to frontend
        this.onResponse?.({
          type: 'transcript',
          text: message.transcript,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.output_audio_buffer.committed':
        this.onResponse?.({
          type: 'audio_committed',
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.output_audio_buffer.audio':
        this.onResponse?.({
          type: 'audio_delta',
          audio: message.audio,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.output_audio_buffer.done':
        this.onResponse?.({
          type: 'audio_done',
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.content':
        this.onResponse?.({
          type: 'text_delta',
          text: message.content,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.done':
        this.onResponse?.({
          type: 'text_done',
          text: message.content,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'error':
        // Handle OpenAI errors
        break;
      default:
      // Unknown message type
    }
  }

  sendAudio(audioData: Buffer): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to OpenAI Realtime API');
    }

    // Send audio input event
    const message = {
      type: 'conversation.item.input_audio_buffer.append',
      item: {
        type: 'input_audio_buffer',
        audio: audioData.toString('base64'),
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  sendText(text: string): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to OpenAI Realtime API');
    }

    // Send text input event
    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  startConversation(): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to OpenAI Realtime API');
    }

    // Start a new conversation
    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'conversation',
        title: 'New conversation',
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  stopConversation(): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to OpenAI Realtime API');
    }

    // Stop the current conversation
    const message = {
      type: 'conversation.item.input_audio_buffer.commit',
    };

    this.ws.send(JSON.stringify(message));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

export default OpenAIRealtimeService;
