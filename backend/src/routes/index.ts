import { FastifyPluginAsync } from 'fastify';
import healthRoutes from './health';
import testMongoRoutes from './testMongo';
import testStockRoutes from './testStock';
import { formRoutes } from '../modules/form';
import { stockRoutes } from '../modules/stock';

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
  fastify.register(testStockRoutes);
  fastify.register(formRoutes, { prefix: '/api/form' });
  fastify.register(stockRoutes);
};

export default routes;
