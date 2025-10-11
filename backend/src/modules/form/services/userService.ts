import { FastifyInstance } from 'fastify';
import { User, UserResponse } from '../types';

export class UserService {
  constructor(private fastify: FastifyInstance) {}

  private getCollection() {
    const collection = this.fastify.mongo.db?.collection('users');
    if (!collection) {
      throw new Error('Database not available');
    }
    return collection;
  }

  async findUsers(): Promise<User[]> {
    const collection = this.getCollection();
    const users = await collection
      .find({}, { projection: { password: 0 } })
      .toArray();
    return users as unknown as User[];
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const collection = this.getCollection();
    const user = await collection.findOne({ email });
    return user as unknown as User | null;
  }

  async insertUser(email: string, password: string): Promise<UserResponse> {
    const collection = this.getCollection();
    const createdAt = new Date();
    const userData = { email, password, createdAt };

    const result = await collection.insertOne(userData);

    return {
      id: result.insertedId.toString(),
      email,
      createdAt,
    };
  }
}
