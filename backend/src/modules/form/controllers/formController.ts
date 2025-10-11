import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { FormSchema } from '../validators/formSchema';
import { UserService } from '../services/userService';
import { ApiResponse } from '../types';

export class FormController {
  constructor(private userService: UserService) {}

  async getUsersHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const users = await this.userService.findUsers();
      return reply.send({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      request.log.error(error as Error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch users',
      });
    }
  }

  async createUserHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const body = FormSchema.parse(request.body);

      // Validate password confirmation
      if (body.confirmPassword && body.password !== body.confirmPassword) {
        return reply.status(400).send({
          success: false,
          error: 'Passwords do not match',
        });
      }

      // Check if user already exists
      const existingUser = await this.userService.findUserByEmail(body.email);
      if (existingUser) {
        return reply.status(400).send({
          success: false,
          error: 'User already exists with this email',
        });
      }

      // Create new user
      const user = await this.userService.insertUser(body.email, body.password);

      return reply.send({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid form data',
          details: error.issues,
        });
      }

      request.log.error(error as Error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
