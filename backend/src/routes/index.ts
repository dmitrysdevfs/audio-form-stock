import { FastifyPluginAsync } from 'fastify';
import healthRoutes from './health.js';
import testMongoRoutes from './testMongo.js';
import testStockRoutes from './testStock.js';
import testPolygonRoutes from './testPolygon.js';
import testPolygonOfficialRoutes from './testPolygonOfficial.js';
import { formRoutes } from '../modules/form/index.js';
import { stockRoutes } from '../modules/stock/index.js';
import audioModule from '../modules/audio/index.js';
// import { debugRoutes } from '../modules/stock/experiments/debugRoutes.js';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return { hello: 'world' };
  });
  fastify.register(healthRoutes);
  fastify.register(testMongoRoutes);
  fastify.register(testStockRoutes);
  fastify.register(testPolygonRoutes, { prefix: '/test-polygon' });
  fastify.register(testPolygonOfficialRoutes, {
    prefix: '/test-polygon-official',
  });
  fastify.register(formRoutes, { prefix: '/api/form' });
  fastify.register(stockRoutes);
  fastify.register(audioModule, { prefix: '/api' });
  // fastify.register(debugRoutes, { prefix: '/debug' });
};

export default routes;
