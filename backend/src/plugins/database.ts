import fastifyPlugin from 'fastify-plugin';
import fastifyMongo from '@fastify/mongodb';
import { FastifyInstance } from 'fastify';

/**
 * MongoDB connection plugin
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function dbConnector(
  fastify: FastifyInstance,
  options: Record<string, any>
) {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  fastify.register(fastifyMongo, {
    url: mongoUri,
    forceClose: true,
  });

  // Log successful MongoDB connection
  fastify.addHook('onReady', async () => {
    try {
      await fastify.mongo.client.db().command({ ping: 1 });
      fastify.log.info('MongoDB connected successfully');
    } catch (error) {
      fastify.log.warn('MongoDB connection not established');
    }
  });
}

export default fastifyPlugin(dbConnector);
