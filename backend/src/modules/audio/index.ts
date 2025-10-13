import { FastifyInstance } from 'fastify';
import audioRoutes from './routes/audioRoutes.js';

/**
 * Audio module registration
 * Handles real-time audio conversation functionality
 */
export default async function audioModule(fastify: FastifyInstance) {
  // Register audio routes without prefix (already has /api prefix)
  await fastify.register(audioRoutes);
}
