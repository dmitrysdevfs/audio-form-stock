import { FastifyInstance } from 'fastify';
import { FormController } from '../controllers/formController.js';
import { UserService } from '../services/userService.js';

export async function formRoutes(fastify: FastifyInstance) {
  // Initialize services and controllers
  const userService = new UserService(fastify);
  const formController = new FormController(userService);

  // Register routes
  fastify.get('/', formController.getUsersHandler.bind(formController));
  fastify.post('/', formController.createUserHandler.bind(formController));
}
