import WebSocket from 'ws';

interface TranscriptionConfig {
  apiKey: string;
  model?: string;
  language?: string;
}

interface TranscriptionResponse {
  type: 'transcription_delta' | 'transcription_completed' | 'error';
  text?: string;
  transcript?: string;
  itemId?: string;
  message?: string;
}

export class TranscriptionService {
  private ws: WebSocket | null = null;
  private config: TranscriptionConfig;
  private isConnected = false;
  private onResponse?: (response: TranscriptionResponse) => void;

  constructor(
    config: TranscriptionConfig,
    onResponse?: (response: TranscriptionResponse) => void
  ) {
    this.config = {
      model: 'gpt-4o-transcribe',
      language: 'en',
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
          this.initializeTranscriptionSession();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing transcription message:', error);
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

  private initializeTranscriptionSession(): void {
    if (!this.ws) return;

    // Create transcription session according to official documentation
    this.ws.send(
      JSON.stringify({
        type: 'session.update',
        session: {
          type: 'transcription',
          audio: {
            input: {
              format: {
                type: 'audio/pcm',
                rate: 24000,
              },
              noise_reduction: {
                type: 'near_field',
              },
              transcription: {
                model: this.config.model,
                language: this.config.language,
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
              },
            },
          },
          include: ['item.input_audio_transcription.logprobs'],
        },
      })
    );
  }

  private handleMessage(message: any): void {
    console.log('Transcription API message received:', message.type);

    switch (message.type) {
      case 'session.created':
        console.log('Transcription session created successfully');
        break;
      case 'session.updated':
        console.log('Transcription session updated successfully');
        break;
      case 'conversation.item.input_audio_transcription.delta':
        console.log('Transcription delta:', message.delta);
        this.onResponse?.({
          type: 'transcription_delta',
          text: message.delta,
          itemId: message.item_id,
        });
        break;
      case 'conversation.item.input_audio_transcription.completed':
        console.log('Transcription completed:', message.transcript);
        this.onResponse?.({
          type: 'transcription_completed',
          transcript: message.transcript,
          itemId: message.item_id,
        });
        break;
      case 'input_audio_buffer.committed':
        console.log('Audio buffer committed for transcription');
        break;
      case 'error':
        console.error('Transcription Error:', message);
        this.onResponse?.({
          type: 'error',
          message:
            message.error?.message ||
            message.message ||
            'Unknown transcription error',
        });
        break;
      default:
        // Unknown message type
        break;
    }
  }

  sendAudio(audioData: Buffer): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to OpenAI Transcription API');
    }

    console.log('Sending audio for transcription:', {
      audioSize: audioData.length,
      wsReadyState: this.ws.readyState,
      isConnected: this.isConnected,
    });

    // Send audio input event with base64 encoded audio
    const message = {
      type: 'input_audio_buffer.append',
      audio: audioData.toString('base64'),
    };

    this.ws.send(JSON.stringify(message));
    console.log('Audio sent for transcription');

    // Commit the audio buffer to trigger transcription
    const commitMessage = {
      type: 'input_audio_buffer.commit',
    };

    this.ws.send(JSON.stringify(commitMessage));
    console.log('Audio buffer committed for transcription');
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

export default TranscriptionService;
