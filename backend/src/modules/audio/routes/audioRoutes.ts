import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import websocket from '@fastify/websocket';

export default async function audioRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  await fastify.register(websocket);
  fastify.register(async function (fastify) {
    fastify.get('/conversation', { websocket: true }, (connection, req) => {
      fastify.log.info('New audio conversation WebSocket connection');

      connection.socket.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          fastify.log.info({ data }, 'Received audio message');

          connection.socket.send(
            JSON.stringify({
              type: 'response',
              message: 'Audio processing not yet implemented',
              timestamp: new Date().toISOString(),
            })
          );
        } catch (error) {
          fastify.log.error({ error }, 'Error processing audio message');
          connection.socket.send(
            JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
            })
          );
        }
      });

      connection.socket.on('close', () => {
        fastify.log.info('Audio conversation WebSocket connection closed');
      });
    });
  });
}
