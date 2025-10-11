import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { StockService } from '../modules/stock/services/stockService.js';

/**
 * Test routes for stock functionality
 */
const testStockRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  const stockService = new StockService(fastify);

  // Test endpoint to add sample stock data
  fastify.post('/test-stock', async (request, reply) => {
    try {
      const sampleStock = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        country: 'USA',
        marketCap: 3000000000000,
        price: 150.0,
        changes: 2.5,
        changesPercentage: 1.69,
        monthlyChanges: 15.5,
        monthlyChangesPercentage: 11.5,
        indexes: ['NASDAQ', 'S&P500'],
        lastUpdated: new Date(),
      };

      await stockService.upsertStock(sampleStock);

      return reply.send({
        success: true,
        message: 'Sample stock data added successfully',
        data: sampleStock,
      });
    } catch (error) {
      console.error('Error adding sample stock:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error adding sample stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Test endpoint to get all stocks
  fastify.get('/test-stock', async (request, reply) => {
    try {
      const result = await stockService.getStocks();

      return reply.send({
        success: true,
        message: 'Stocks retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error getting stocks:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error getting stocks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Test endpoint to get health status
  fastify.get('/test-stock/health', async (request, reply) => {
    try {
      const health = await stockService.getHealth();

      return reply.send({
        success: true,
        message: 'Health status retrieved successfully',
        data: health,
      });
    } catch (error) {
      console.error('Error getting health status:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error getting health status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export default testStockRoutes;
