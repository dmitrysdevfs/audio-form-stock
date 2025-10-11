import { FastifyPluginAsync } from 'fastify';

/**
 * MongoDB test routes
 * @param {import('fastify').FastifyInstance} fastify Fastify instance
 */
const testMongoRoutes: FastifyPluginAsync = async (fastify) => {
  // MongoDB test route
  fastify.get('/test-mongo', async (request, reply) => {
    try {
      if (!fastify.mongo?.db) {
        return reply.code(503).send({
          success: false,
          error: 'MongoDB not connected',
        });
      }

      const collection = (fastify.mongo as any).db.collection('test');
      const result = await collection.insertOne({
        message: 'MongoDB connection test',
        timestamp: new Date(),
      });

      return {
        success: true,
        message: 'MongoDB connection successful',
        insertedId: result.insertedId,
      };
    } catch (error) {
      fastify.log.error(error, 'MongoDB test error');
      return reply.code(500).send({
        success: false,
        error: 'MongoDB connection failed',
      });
    }
  });
};

export default testMongoRoutes;
