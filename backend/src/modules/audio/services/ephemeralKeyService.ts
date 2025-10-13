import fetch from 'node-fetch';

interface EphemeralKeyResponse {
  value: string;
}

export class EphemeralKeyService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateEphemeralKey(): Promise<string> {
    const sessionConfig = JSON.stringify({
      session: {
        type: 'realtime',
        model: 'gpt-4o-realtime-preview-2024-10-01',
        audio: {
          output: { voice: 'alloy' },
        },
      },
    });

    try {
      const response = await fetch(
        'https://api.openai.com/v1/realtime/client_secrets',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: sessionConfig,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to generate ephemeral key: ${response.statusText}`
        );
      }

      const data = (await response.json()) as EphemeralKeyResponse;
      console.log('Ephemeral key generated successfully');
      return data.value;
    } catch (error) {
      console.error('Error generating ephemeral key:', error);
      throw error;
    }
  }
}
