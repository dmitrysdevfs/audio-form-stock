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
  private audioBufferSize = 0; // Track current buffer size

  constructor(
    config: OpenAIRealtimeConfig,
    onResponse?: (response: any) => void
  ) {
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

    // Send session update event according to official documentation
    this.ws.send(
      JSON.stringify({
        type: 'session.update',
        session: {
          type: 'realtime',
          model: 'gpt-realtime',
          instructions:
            'You are a helpful AI assistant. Respond naturally to audio input and provide helpful responses.',
          output_modalities: ['text'],
          audio: {
            input: {
              format: {
                type: 'audio/pcm',
                rate: 24000,
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
              },
            },
            output: {
              format: {
                type: 'audio/pcm',
                rate: 24000,
              },
              voice: 'alloy',
            },
          },
          tools: [],
          tool_choice: 'auto',
        },
      })
    );
  }

  private handleMessage(message: any): void {
    console.log('OpenAI Realtime API message received:', message.type);
    console.log('Full message:', JSON.stringify(message, null, 2));

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
        console.log('Speech transcript received:', message.transcript);
        // Send transcript to frontend
        this.onResponse?.({
          type: 'openai_response',
          data: {
            type: 'conversation.item.input_audio_buffer.transcript',
            transcript: message.transcript,
          },
        });
        break;
      case 'input_audio_buffer.committed':
        console.log('Audio buffer committed successfully');
        // Reset buffer size after successful commit
        this.audioBufferSize = 0;
        this.onResponse?.({
          type: 'audio_committed',
          timestamp: new Date().toISOString(),
        });
        break;
      case 'conversation.item.response.output_audio_buffer.committed':
        this.onResponse?.({
          type: 'audio_committed',
          timestamp: new Date().toISOString(),
        });
        break;
      case 'response.output_text.delta':
        console.log('Text delta received:', message.delta);
        this.onResponse?.({
          type: 'openai_response',
          data: {
            type: 'response.output_text.delta',
            delta: message.delta,
          },
        });
        break;
      case 'response.output_text.done':
        console.log('Text response completed:', message.text);
        this.onResponse?.({
          type: 'openai_response',
          data: {
            type: 'response.output_text.done',
            text: message.text,
          },
        });
        break;
      case 'conversation.item.response.output_audio.delta':
        this.onResponse?.({
          type: 'openai_response',
          data: {
            type: 'conversation.item.response.output_audio.delta',
            audio: message.delta,
          },
        });
        break;
      case 'conversation.item.response.output_audio.done':
        this.onResponse?.({
          type: 'openai_response',
          data: {
            type: 'conversation.item.response.output_audio.done',
          },
        });
        break;
      case 'conversation.item.response.output_text.delta':
        // Handled by response.output_text.delta
        break;
      case 'conversation.item.response.output_text.done':
        // Handled by response.output_text.done
        break;
      case 'error':
        console.error('OpenAI Error:', message);
        this.onResponse?.({
          type: 'error',
          message:
            message.error?.message || message.message || 'Unknown OpenAI error',
          timestamp: new Date().toISOString(),
        });
        break;
      case 'response.done':
        if (message.response?.status === 'failed') {
          console.error(
            'OpenAI Response Failed:',
            message.response.status_details
          );
          this.onResponse?.({
            type: 'error',
            message:
              message.response.status_details?.error?.message ||
              'Response failed',
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log('OpenAI Response completed successfully');
        }
        break;
      default:
      // Unknown message type
    }
  }

  sendAudio(audioData: Buffer): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to OpenAI Realtime API');
    }

    console.log('Sending audio to OpenAI Realtime API:', {
      audioSize: audioData.length,
      wsReadyState: this.ws.readyState,
      isConnected: this.isConnected,
    });

    // Send audio input event with base64 encoded audio
    const message = {
      type: 'input_audio_buffer.append',
      audio: audioData.toString('base64'), // Convert to base64
    };

    this.ws.send(JSON.stringify(message));
    console.log('Audio message sent to OpenAI');
  }

  sendRawAudio(audioData: Buffer): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to OpenAI Realtime API');
    }

    // Check minimum audio length (100ms = 4800 bytes for PCM16 mono 24kHz)
    const minAudioLength = 4800; // 100ms * 24kHz * 2 bytes
    if (audioData.length < minAudioLength) {
      console.warn(
        `Audio too short: ${audioData.length} bytes (minimum ${minAudioLength} bytes for 100ms)`
      );
      return;
    }

    console.log('Sending raw audio to OpenAI Realtime API:', {
      audioSize: audioData.length,
      currentBufferSize: this.audioBufferSize,
      minRequired: minAudioLength,
      duration: `${((audioData.length / 48000) * 1000).toFixed(1)}ms`,
      wsReadyState: this.ws.readyState,
      isConnected: this.isConnected,
    });

    // OpenAI Realtime API expects base64 encoded audio
    const message = {
      type: 'input_audio_buffer.append',
      audio: audioData.toString('base64'), // Convert to base64
    };

    this.ws.send(JSON.stringify(message));
    console.log('Raw audio message sent to OpenAI');

    // Update buffer size tracking
    this.audioBufferSize += audioData.length;

    // Validate buffer size before commit
    if (this.audioBufferSize < minAudioLength) {
      console.warn(
        `Buffer too small for commit: ${this.audioBufferSize} bytes (minimum ${minAudioLength} bytes)`
      );
      return;
    }

    // Commit the audio buffer to trigger processing
    const commitMessage = {
      type: 'input_audio_buffer.commit',
    };

    this.ws.send(JSON.stringify(commitMessage));
    console.log('Audio buffer committed to OpenAI');

    // Wait a bit to see if we get a response
    setTimeout(() => {
      console.log('Checking for OpenAI response after 2 seconds...');
    }, 2000);
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

    // No need to create conversation - session is already created
    // Just start sending audio directly
    console.log('Conversation ready - can start sending audio');
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
