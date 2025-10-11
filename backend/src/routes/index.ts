import { FastifyPluginAsync } from 'fastify';
import healthRoutes from './health';
import testMongoRoutes from './testMongo';
import { formRoutes } from '../modules/form';

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
  fastify.register(formRoutes, { prefix: '/api/form' });
};

export default routes;
