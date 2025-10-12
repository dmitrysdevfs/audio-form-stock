import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import websocket from '@fastify/websocket';
import { 
  handleAudioMessage, 
  getAudioStatus, 
  initializeAudioController 
} from '../controllers/audioController';

export default async function audioRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Initialize OpenAI service
  await initializeAudioController(fastify);

  await fastify.register(websocket);
  
  // REST endpoints
  fastify.post('/audio/message', handleAudioMessage);
  fastify.get('/audio/status', getAudioStatus);

  // WebSocket endpoint for real-time conversation
  fastify.register(async function (fastify) {
    fastify.get('/conversation', { websocket: true }, (connection, req) => {
      fastify.log.info('New audio conversation WebSocket connection');

      connection.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          fastify.log.info({ data }, 'Received audio message');

          // Process audio data through OpenAI
          if (data.type === 'audio' && data.data) {
            // Handle audio processing
            connection.send(
              JSON.stringify({
                type: 'response',
                message: 'Audio received and processing...',
                timestamp: new Date().toISOString(),
              })
            );
          } else {
            connection.send(
              JSON.stringify({
                type: 'response',
                message: 'Audio processing with OpenAI Realtime API',
                timestamp: new Date().toISOString(),
              })
            );
          }
        } catch (error) {
          fastify.log.error({ error }, 'Error processing audio message');
          connection.send(
            JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
            })
          );
        }
      });

      connection.on('close', () => {
        fastify.log.info('Audio conversation WebSocket connection closed');
      });
    });
  });
}
