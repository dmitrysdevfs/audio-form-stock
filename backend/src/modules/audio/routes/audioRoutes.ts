import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import websocket from '@fastify/websocket';
import {
  handleAudioMessage,
  getAudioStatus,
  initializeAudioController,
  addConnection,
  removeConnection,
} from '../controllers/audioController.js';
import audioController from '../controllers/audioController.js';
import { EphemeralKeyService } from '../services/ephemeralKeyService.js';
// Removed AudioConverterService - sending audio directly to OpenAI

export default async function audioRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Initialize OpenAI service
  await initializeAudioController(fastify);

  await fastify.register(websocket);

  // REST endpoints
  fastify.post('/message', handleAudioMessage);
  fastify.get('/status', getAudioStatus);

  // Generate ephemeral key for client
  fastify.get('/ephemeral-key', async (request, reply) => {
    try {
      const ephemeralKeyService = new EphemeralKeyService(
        process.env.OPENAI_API_KEY!
      );
      const ephemeralKey = await ephemeralKeyService.generateEphemeralKey();

      reply.send({
        ephemeralKey,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to generate ephemeral key');
      reply.status(500).send({
        error: 'Failed to generate ephemeral key',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // WebSocket endpoint for real-time conversation
  fastify.register(async function (fastify) {
    fastify.get('/conversation', { websocket: true }, (connection, req) => {
      fastify.log.info('New audio conversation WebSocket connection');

      // Add connection to active connections
      addConnection(connection);
      fastify.log.info(
        `Connection added. Total connections: ${audioController.activeConnections.size}`
      );

      connection.on('message', async (message: Buffer) => {
        try {
          // Check if it's JSON (metadata) or binary (audio data)
          let data;
          try {
            data = JSON.parse(message.toString());
          fastify.log.info({ data }, 'Received audio message');
          } catch {
            // It's binary audio data
            fastify.log.info(
              { size: message.length },
              'Received binary audio data'
            );

            // Process binary audio data with OpenAI Realtime API for speech-to-speech
            if (audioController.openaiService?.isReady()) {
              // Check minimum audio length (100ms = 4800 bytes for PCM16 mono 24kHz)
              const minAudioLength = 4800;
              if (message.length < minAudioLength) {
                fastify.log.warn(
                  {
                    audioSize: message.length,
                    minRequired: minAudioLength,
                    duration: `${((message.length / 48000) * 1000).toFixed(
                      1
                    )}ms`,
                  },
                  'Audio too short, skipping send'
                );

                connection.send(
                  JSON.stringify({
                    type: 'error',
                    message: `Audio too short: ${message.length} bytes (minimum ${minAudioLength} bytes for 100ms)`,
                    timestamp: new Date().toISOString(),
                  })
                );
                return;
              }

              fastify.log.info(
                {
                  audioSize: message.length,
                  duration: `${((message.length / 48000) * 1000).toFixed(1)}ms`,
                  activeConnections: audioController.activeConnections.size,
                },
                'Sending audio to OpenAI Realtime API for speech-to-speech...'
              );

              try {
                // Send audio to OpenAI Realtime API for speech-to-speech conversation
                audioController.openaiService.sendRawAudio(message);

                fastify.log.info(
                  {
                    audioSize: message.length,
                    duration: `${((message.length / 48000) * 1000).toFixed(
                      1
                    )}ms`,
                  },
                  'Audio sent to OpenAI Realtime API'
                );

                connection.send(
                  JSON.stringify({
                    type: 'response',
                    message: 'Audio sent to OpenAI for speech-to-speech...',
                    timestamp: new Date().toISOString(),
                  })
                );
              } catch (error) {
                fastify.log.error({ error }, 'Failed to send audio to OpenAI');
                connection.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'Failed to send audio to OpenAI',
                  })
                );
              }
            } else {
              fastify.log.error('OpenAI service not ready');
              connection.send(
                JSON.stringify({
                  type: 'error',
                  message: 'OpenAI service not available',
                })
              );
            }
            return;
          }

          // Handle ping messages
          if (data.type === 'ping') {
            fastify.log.info('Received ping from client');
            connection.send(JSON.stringify({ type: 'pong' }));
            return;
          }

          // Handle conversation control commands
          if (data.type === 'conversation') {
            if (data.action === 'start') {
              fastify.log.info('Starting conversation');
              if (audioController.openaiService?.isReady()) {
                try {
                  audioController.openaiService.startConversation();
                  connection.send(
                    JSON.stringify({
                      type: 'response',
                      message: 'Conversation started',
                      timestamp: new Date().toISOString(),
                    })
                  );
                } catch (error) {
                  fastify.log.error({ error }, 'Error starting conversation');
                  connection.send(
                    JSON.stringify({
                      type: 'error',
                      message: 'Failed to start conversation',
                    })
                  );
                }
              } else {
                connection.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'OpenAI service not available',
                  })
                );
              }
            } else if (data.action === 'stop') {
              fastify.log.info('Stopping conversation');
              if (audioController.openaiService?.isReady()) {
                try {
                  audioController.openaiService.stopConversation();
                  connection.send(
                    JSON.stringify({
                      type: 'response',
                      message: 'Conversation stopped',
                      timestamp: new Date().toISOString(),
                    })
                  );
                } catch (error) {
                  fastify.log.error({ error }, 'Error stopping conversation');
                  connection.send(
                    JSON.stringify({
                      type: 'error',
                      message: 'Failed to stop conversation',
                    })
                  );
                }
              }
            }
          }
          // Process audio data through OpenAI
          else if (data.type === 'audio' && data.data) {
            // Handle audio processing
            fastify.log.info('Processing audio data with OpenAI...');

            try {
              const audioBuffer = Buffer.from(data.data, 'base64');
              fastify.log.info(
                `Audio buffer size: ${audioBuffer.length} bytes`
              );

              // Send audio to OpenAI Realtime API
              if (audioController.openaiService?.isReady()) {
                fastify.log.info(
                  {
                    audioSize: audioBuffer.length,
                    activeConnections: audioController.activeConnections.size,
                  },
                  'Sending audio to OpenAI...'
                );

                // Start conversation if not already started
                try {
                  audioController.openaiService.startConversation();
                  fastify.log.info('Conversation started');
                } catch (error) {
                  fastify.log.warn(
                    { error },
                    'Conversation already started or error'
                  );
                }

                fastify.log.info('About to call sendAudio method');
                audioController.openaiService.sendAudio(audioBuffer);
                fastify.log.info('sendAudio method called');

                connection.send(
                  JSON.stringify({
                    type: 'response',
                    message: 'Audio sent to OpenAI for processing...',
                    timestamp: new Date().toISOString(),
                  })
                );
              } else {
                fastify.log.error('OpenAI service not ready');
                connection.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'OpenAI service not available',
                  })
                );
              }
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

      connection.on('close', (code, reason) => {
        fastify.log.info(
          {
            code,
            reason: reason.toString(),
            remainingConnections: audioController.activeConnections.size,
          },
          'Audio conversation WebSocket connection closed'
        );
        // Remove connection from active connections
        removeConnection(connection);
      });
    });
  });
}
