import { FastifyRequest, FastifyReply } from 'fastify';
import { StockService } from '../services/stockService.js';
import { ScheduleService } from '../services/scheduleService.js';
import { StockFilters, StockUpdateRequest } from '../types/index.js';

/**
 * Stock controller for handling HTTP requests
 */
export class StockController {
  private stockService: StockService;
  private scheduleService: ScheduleService;

  constructor(fastify: any) {
    this.stockService = new StockService(fastify);
    this.scheduleService = new ScheduleService();
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
      console.log('Starting updateStocks...');
      const { batchNumber, totalBatches, forceUpdate } =
        request.body as StockUpdateRequest;

      console.log(`Processing batch ${batchNumber} of ${totalBatches}`);

      const result = await this.stockService.updateStocks(
        batchNumber,
        totalBatches,
        forceUpdate
      );

      console.log('Update completed:', result);
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

  /**
   * GET /api/stocks/test-polygon - Test Polygon.io integration
   */
  async testPolygonIntegration(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.stockService.testPolygonIntegration();

      return reply.send({
        success: true,
        message: 'Polygon.io integration test completed',
        data: result,
      });
    } catch (error) {
      console.error('Error in testPolygonIntegration:', error);
      return reply.status(500).send({
        success: false,
        message: 'Polygon.io integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/stocks/schedule - Get update schedule information
   */
  async getSchedule(request: FastifyRequest, reply: FastifyReply) {
    try {
      const schedule = this.scheduleService.getUpdateSchedule();

      return reply.send({
        success: true,
        data: schedule,
      });
    } catch (error) {
      console.error('Error in getSchedule:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get schedule information',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/stocks/schedule/detailed - Get detailed schedule and timezone information
   */
  async getDetailedSchedule(request: FastifyRequest, reply: FastifyReply) {
    try {
      const detailedInfo = this.scheduleService.getDetailedInfo();

      return reply.send({
        success: true,
        data: detailedInfo,
      });
    } catch (error) {
      console.error('Error in getDetailedSchedule:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get detailed schedule information',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/stocks/schedule/batch - Get batch processing schedule
   */
  async getBatchSchedule(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { totalBatches } = request.query as { totalBatches?: string };
      const batches = totalBatches ? parseInt(totalBatches) : 10;

      const batchSchedule = this.scheduleService.getBatchSchedule(batches);

      return reply.send({
        success: true,
        data: batchSchedule,
      });
    } catch (error) {
      console.error('Error in getBatchSchedule:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get batch schedule',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/stocks/schedule/check - Check if update should be performed
   */
  async checkUpdateStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { forceUpdate } = request.query as { forceUpdate?: string };
      const force = forceUpdate === 'true';

      const updateStatus = this.scheduleService.shouldUpdateNow(force);

      return reply.send({
        success: true,
        data: updateStatus,
      });
    } catch (error) {
      console.error('Error in checkUpdateStatus:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to check update status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/stocks/schedule/log - Log comprehensive schedule information
   */
  async logScheduleInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.scheduleService.logScheduleInfo();

      return reply.send({
        success: true,
        message: 'Schedule information logged to console',
      });
    } catch (error) {
      console.error('Error in logScheduleInfo:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to log schedule information',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
