import Fastify from 'fastify';
import dotenv from 'dotenv';
import dbConnector from './plugins/database.js';

// Load environment variables
dotenv.config();

/**
 * @type {import('fastify').FastifyInstance} Instance of Fastify
 */
const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register MongoDB plugin
fastify.register(dbConnector);

// Basic route
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

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

// Start server
const start = async () => {
  try {
    const port = 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info({ port }, 'Server started');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
