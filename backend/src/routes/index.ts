import { FastifyPluginAsync } from 'fastify';
import healthRoutes from './health.js';
import testMongoRoutes from './testMongo.js';
import testStockRoutes from './testStock.js';
import testPolygonRoutes from './testPolygon.js';
import testPolygonOfficialRoutes from './testPolygonOfficial.js';
import { formRoutes } from '../modules/form/index.js';
import { stockRoutes } from '../modules/stock/index.js';

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
  fastify.register(testPolygonRoutes, { prefix: '/test-polygon' });
  fastify.register(testPolygonOfficialRoutes, {
    prefix: '/test-polygon-official',
  });
  fastify.register(formRoutes, { prefix: '/api/form' });
  fastify.register(stockRoutes);
};

export default routes;
