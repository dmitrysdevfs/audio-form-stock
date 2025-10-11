import { FastifyPluginAsync } from 'fastify';
import healthRoutes from './health';
import testMongoRoutes from './testMongo';

/**
 * Main routes registration
 * @param {import('fastify').FastifyInstance} fastify Fastify instance
 */
const routes: FastifyPluginAsync = async (fastify) => {
  // Basic route
  fastify.get('/', async () => {
    return { hello: 'world' };
  });

  // Register sub-routes
  fastify.register(healthRoutes);
  fastify.register(testMongoRoutes);
};

export default routes;
