import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import websocket from '@fastify/websocket';
import {
  handleAudioMessage,
  getAudioStatus,
  initializeAudioController,
} from '../controllers/audioController.js';

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
            fastify.log.info('Processing audio data with OpenAI...');

            // Send audio to OpenAI Realtime API
            try {
              const audioBuffer = Buffer.from(data.data, 'base64');
              // Here we would send to OpenAI, but for now just acknowledge
              fastify.log.info(
                `Audio buffer size: ${audioBuffer.length} bytes`
              );

              connection.send(
                JSON.stringify({
                  type: 'response',
                  message: 'Audio received and processing...',
                  timestamp: new Date().toISOString(),
                })
              );
            } catch (error) {
              fastify.log.error({ error }, 'Error processing audio');
              connection.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to process audio',
                })
              );
            }
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
