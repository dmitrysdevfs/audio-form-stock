import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import OpenAIRealtimeService from '../services/openaiService';

interface AudioController {
  openaiService: OpenAIRealtimeService | null;
}

const audioController: AudioController = {
  openaiService: null,
};

export const initializeAudioController = async (fastify: FastifyInstance) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    fastify.log.warn('OPENAI_API_KEY not found in environment variables');
    return;
  }

  try {
    audioController.openaiService = new OpenAIRealtimeService({
      apiKey,
      model: 'gpt-realtime',
    }, (response) => {
      // Handle OpenAI responses and forward to connected clients
      fastify.log.info('OpenAI Response:', response);
      // Here we could broadcast to all connected WebSocket clients
      // For now, just log the response
    });

    await audioController.openaiService.connect();
    fastify.log.info('OpenAI Realtime Service initialized successfully');
  } catch (error) {
    fastify.log.error('Failed to initialize OpenAI Realtime Service:', error);
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
    fastify.log.error('Error handling audio message:', error);
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
  });
};

export default audioController;
