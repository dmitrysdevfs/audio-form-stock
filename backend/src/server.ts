import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbConnector from './plugins/database';
import routes from './routes/index';
import { getAllowedOrigins, logAllowedOrigins } from './utils/cors';

/**
 * Build and configure Fastify server instance
 * @returns {import('fastify').FastifyInstance} Configured Fastify instance
 */
export const buildServer = () => {
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

  const allowedOrigins = getAllowedOrigins();
  logAllowedOrigins(allowedOrigins);
  fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });

  fastify.register(dbConnector);
  fastify.register(routes);

  return fastify;
};
