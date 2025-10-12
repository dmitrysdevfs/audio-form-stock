import { FastifyInstance } from 'fastify';
import audioRoutes from './routes/audioRoutes.js';

/**
 * Audio module registration
 * Handles real-time audio conversation functionality
 */
export default async function audioModule(fastify: FastifyInstance) {
  // Register audio routes
  await fastify.register(audioRoutes, { prefix: '/audio' });
}
