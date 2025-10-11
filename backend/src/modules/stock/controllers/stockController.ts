import { FastifyRequest, FastifyReply } from 'fastify';
import { StockService } from '../services/stockService';
import { StockFilters, StockUpdateRequest } from '../types';

/**
 * Stock controller for handling HTTP requests
 */
export class StockController {
  private stockService: StockService;

  constructor(fastify: any) {
    this.stockService = new StockService(fastify);
  }

  /**
   * GET /api/stocks - Get all stocks with filtering
   */
  async getStocks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const filters: StockFilters = {
        country: query.country as string,
        indexes: query.indexes as string[],
        search: query.search as string,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any,
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 50,
      };

      const result = await this.stockService.getStocks(filters);

      return reply.send({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      console.error('Error in getStocks:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/stocks/:symbol - Get stock by symbol
   */
  async getStockBySymbol(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { symbol } = request.params as { symbol: string };

      const stock = await this.stockService.getStockBySymbol(symbol);

      if (!stock) {
        return reply.status(404).send({
          success: false,
          message: 'Stock not found',
        });
      }

      return reply.send({
        success: true,
        data: stock,
      });
    } catch (error) {
      console.error('Error in getStockBySymbol:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/stocks/health - Get health status
   */
  async getHealth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const health = await this.stockService.getHealth();
      return reply.send(health);
    } catch (error) {
      console.error('Error in getHealth:', error);
      return reply.status(500).send({
        status: 'unhealthy',
        timestamp: new Date(),
        database: 'disconnected',
        totalStocks: 0,
      });
    }
  }

  /**
   * POST /api/stocks/update - Update stocks (for GitHub Actions)
   */
  async updateStocks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { batchNumber, totalBatches, forceUpdate } =
        request.body as StockUpdateRequest;

      const result = await this.stockService.updateStocks(
        batchNumber,
        totalBatches,
        forceUpdate
      );

      return reply.send(result);
    } catch (error) {
      console.error('Error in updateStocks:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: 0,
        totalBatches: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * GET /api/stocks/countries - Get unique countries
   */
  async getCountries(request: FastifyRequest, reply: FastifyReply) {
    try {
      const countries = await this.stockService.getCountries();

      return reply.send({
        success: true,
        data: countries,
      });
    } catch (error) {
      console.error('Error in getCountries:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/stocks/indexes - Get unique indexes
   */
  async getIndexes(request: FastifyRequest, reply: FastifyReply) {
    try {
      const indexes = await this.stockService.getIndexes();

      return reply.send({
        success: true,
        data: indexes,
      });
    } catch (error) {
      console.error('Error in getIndexes:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
