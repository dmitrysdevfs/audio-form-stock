import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import OpenAIRealtimeService from '../services/openaiService.js';
// import TranscriptionService from '../services/transcriptionService.js'; // Removed - not compatible with Realtime API
import { EphemeralKeyService } from '../services/ephemeralKeyService.js';

interface AudioController {
  openaiService: OpenAIRealtimeService | null;
  transcriptionService: null; // Removed - not compatible with Realtime API
  activeConnections: Set<any>;
}

const audioController: AudioController = {
  openaiService: null,
  transcriptionService: null, // Removed - not compatible with Realtime API
  activeConnections: new Set(),
};

export const initializeAudioController = async (fastify: FastifyInstance) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    fastify.log.warn('OPENAI_API_KEY not found in environment variables');
    return;
  }

  fastify.log.info('OpenAI API Key found, initializing service...');

  try {
    audioController.openaiService = new OpenAIRealtimeService(
      {
        apiKey,
        model: 'gpt-realtime',
      },
      (response) => {
        // Handle OpenAI responses and forward to connected clients
        fastify.log.info({ response }, 'OpenAI Response received');
        fastify.log.info(
          `Active connections: ${audioController.activeConnections.size}`
        );

        // Broadcast response to all active WebSocket connections
        audioController.activeConnections.forEach((connection) => {
          try {
            fastify.log.info('Sending response to client');
            connection.send(
              JSON.stringify({
                type: 'openai_response',
                data: response,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            fastify.log.error({ error }, 'Error sending response to client');
            // Remove broken connection
            audioController.activeConnections.delete(connection);
          }
        });
      }
    );

    await audioController.openaiService.connect();
    fastify.log.info('OpenAI Realtime Service initialized successfully');
    fastify.log.info(
      `OpenAI service ready: ${audioController.openaiService.isReady()}`
    );

    // Note: TranscriptionService removed - Whisper API doesn't work with Realtime WebSocket
    // For transcription, use OpenAI Realtime API with text output modality
  } catch (error) {
    fastify.log.error(
      { error },
      'Failed to initialize OpenAI Realtime Service'
    );
  }
};

export const handleAudioMessage = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { audioData, messageType, action } = request.body as {
      audioData?: string;
      messageType?: 'audio' | 'text';
      action?: 'start' | 'stop';
    };

    if (!audioController.openaiService?.isReady()) {
      return reply.status(503).send({
        error: 'OpenAI service not available',
      });
    }

    if (action === 'start') {
      audioController.openaiService.startConversation();
    } else if (action === 'stop') {
      audioController.openaiService.stopConversation();
    } else if (messageType === 'audio' && audioData) {
      // Convert base64 audio to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      audioController.openaiService.sendAudio(audioBuffer);
    } else if (messageType === 'text' && audioData) {
      audioController.openaiService.sendText(audioData);
    }

    reply.send({ success: true });
  } catch (error) {
    request.log.error({ error }, 'Error handling audio message');
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const getAudioStatus = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const isReady = audioController.openaiService?.isReady() || false;

  reply.send({
    connected: isReady,
    service: 'OpenAI Realtime API',
    activeConnections: audioController.activeConnections.size,
  });
};

export const addConnection = (connection: any) => {
  audioController.activeConnections.add(connection);
};

export const removeConnection = (connection: any) => {
  audioController.activeConnections.delete(connection);
};

export default audioController;
