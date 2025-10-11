import dotenv from 'dotenv';
import { buildServer } from './server';

// Load environment variables
dotenv.config();

/**
 * Start the server
 */
const start = async () => {
  const fastify = buildServer();
  const port = Number(process.env.PORT) || 3001;

  try {
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info({ port }, 'Server started');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
