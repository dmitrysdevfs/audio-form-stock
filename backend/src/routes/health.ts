import { FastifyPluginAsync } from 'fastify';

/**
 * Health check routes
 * @param {import('fastify').FastifyInstance} fastify Fastify instance
 */
const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check route
  fastify.get('/health', async () => {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  });
};

export default healthRoutes;
