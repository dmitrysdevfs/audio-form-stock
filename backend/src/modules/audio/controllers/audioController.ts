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
    const { audioData, messageType } = request.body as {
      audioData: string;
      messageType: 'audio' | 'text';
    };

    if (!audioController.openaiService?.isReady()) {
      return reply.status(503).send({
        error: 'OpenAI service not available',
      });
    }

    if (messageType === 'audio' && audioData) {
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
