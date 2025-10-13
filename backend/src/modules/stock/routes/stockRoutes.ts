import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { StockController } from '../controllers/stockController.js';
import {
  getStocksSchema,
  getHealthSchema,
  updateStocksSchema,
  getStockBySymbolSchema,
} from '../validators/stockSchema.js';

/**
 * Stock routes registration
 */
const stockRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const stockController = new StockController(fastify);

  // GET /api/stocks - Get all stocks with filtering
  fastify.get('/', {
    schema: getStocksSchema,
    handler: stockController.getStocks.bind(stockController),
  });

  // GET /api/stocks/health - Health check
  fastify.get('/health', {
    schema: getHealthSchema,
    handler: stockController.getHealth.bind(stockController),
  });

  // GET /api/stocks/countries - Get unique countries
  fastify.get('/countries', {
    handler: stockController.getCountries.bind(stockController),
  });

  // GET /api/stocks/indexes - Get unique indexes
  fastify.get('/indexes', {
    handler: stockController.getIndexes.bind(stockController),
  });

  // GET /api/stocks/:symbol - Get stock by symbol
  fastify.get('/:symbol', {
    schema: getStockBySymbolSchema,
    handler: stockController.getStockBySymbol.bind(stockController),
  });

  // POST /api/stocks/update - Update stocks (for GitHub Actions)
  fastify.post('/update', {
    schema: updateStocksSchema,
    handler: stockController.updateStocks.bind(stockController),
  });

  // GET /api/stocks/test-polygon - Test Polygon.io integration
  fastify.get('/test-polygon', {
    handler: stockController.testPolygonIntegration.bind(stockController),
  });

  // Schedule-related routes
  // GET /api/stocks/schedule - Get update schedule information
  fastify.get('/schedule', {
    handler: stockController.getSchedule.bind(stockController),
  });

  // GET /api/stocks/schedule/detailed - Get detailed schedule and timezone information
  fastify.get('/schedule/detailed', {
    handler: stockController.getDetailedSchedule.bind(stockController),
  });

  // GET /api/stocks/schedule/batch - Get batch processing schedule
  fastify.get('/schedule/batch', {
    handler: stockController.getBatchSchedule.bind(stockController),
  });

  // GET /api/stocks/schedule/check - Check if update should be performed
  fastify.get('/schedule/check', {
    handler: stockController.checkUpdateStatus.bind(stockController),
  });

  // GET /api/stocks/schedule/log - Log comprehensive schedule information
  fastify.get('/schedule/log', {
    handler: stockController.logScheduleInfo.bind(stockController),
  });
};

export { stockRoutes };
