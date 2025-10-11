import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { stockRoutes } from './routes/stockRoutes';

/**
 * Stock module registration
 */
const stockModule: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register stock routes with /api/stocks prefix
  fastify.register(stockRoutes, { prefix: '/api/stocks' });
};

export { stockModule as stockRoutes };
