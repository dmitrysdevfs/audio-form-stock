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

  constructor(config: OpenAIRealtimeConfig, onResponse?: (response: any) => void) {
    this.config = {
      model: 'gpt-realtime',
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
          console.log('Connected to OpenAI Realtime API');
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
            console.error('Error parsing OpenAI message:', error);
          }
        });

        this.ws.on('error', (error) => {
          console.error('OpenAI WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('Disconnected from OpenAI Realtime API');
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
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          tools: [],
          tool_choice: 'auto',
          temperature: 0.8,
          max_response_output_tokens: 4096,
        },
      })
    );
  }

  private handleMessage(message: any): void {
    console.log('OpenAI Response:', message);

    // Handle different message types from OpenAI Realtime API
    switch (message.type) {
      case 'session.created':
        console.log('Session created successfully');
        break;
      case 'session.updated':
        console.log('Session updated successfully');
        break;
      case 'conversation.item.input_audio_buffer.committed':
        console.log('Audio input committed');
        break;
      case 'conversation.item.input_audio_buffer.speech_started':
        console.log('Speech started');
        break;
      case 'conversation.item.input_audio_buffer.speech_stopped':
        console.log('Speech stopped');
        break;
      case 'conversation.item.input_audio_buffer.transcript':
        console.log('Transcript:', message.transcript);
        // Send transcript to frontend
        this.onResponse?.({
          type: 'transcript',
          text: message.transcript,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.output_audio_buffer.committed':
        console.log('Audio output committed');
        this.onResponse?.({
          type: 'audio_committed',
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.output_audio_buffer.audio':
        console.log('Audio output received');
        this.onResponse?.({
          type: 'audio_delta',
          audio: message.audio,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.output_audio_buffer.done':
        console.log('Audio output completed');
        this.onResponse?.({
          type: 'audio_done',
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.content':
        console.log('Response content:', message.content);
        this.onResponse?.({
          type: 'text_delta',
          text: message.content,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.done':
        console.log('Response completed');
        this.onResponse?.({
          type: 'text_done',
          text: message.content,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'error':
        console.error('OpenAI Error:', message.error);
        break;
      default:
        console.log('Unknown message type:', message.type);
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
