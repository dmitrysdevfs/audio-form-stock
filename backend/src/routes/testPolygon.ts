import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { restClient } from '@polygon.io/client-js';
import { PolygonService } from '../modules/stock/services/polygonService.js';

/**
 * Test Polygon.io integration
 */
const testPolygonRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  const polygonService = new PolygonService();

  // Test basic connectivity using official client
  fastify.get('/test-connection', async (request, reply) => {
    try {
      const apiKey = process.env.POLYGON_API_KEY;
      const rest = restClient(apiKey || '', 'https://api.polygon.io');

      const response = await rest.listTickers('stocks');

      return reply.send({
        success: true,
        message: 'Polygon.io API connection successful',
        data: {
          resultsCount: response.results?.length || 0,
          apiKeyConfigured: !!apiKey,
          status: 'connected',
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Polygon.io API connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Test ticker details using official client
  fastify.get('/test-ticker/:symbol', async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string };
      if (!symbol) {
        return reply.status(400).send({
          success: false,
          message: 'Symbol parameter is required',
        });
      }
      const apiKey = process.env.POLYGON_API_KEY;

      if (!apiKey) {
        return reply.status(500).send({
          success: false,
          message: 'POLYGON_API_KEY not configured',
        });
      }

      const rest = restClient(apiKey || '', 'https://api.polygon.io');

      // Use correct method name for ticker details
      const tickerDetails = await rest.getTicker(symbol);

      if (!tickerDetails.results) {
        return reply.status(404).send({
          success: false,
          message: `Ticker ${symbol} not found`,
        });
      }

      return reply.send({
        success: true,
        message: `Ticker ${symbol} details retrieved`,
        data: {
          symbol: tickerDetails.results.ticker,
          name: tickerDetails.results.name,
          market: tickerDetails.results.market,
          locale: tickerDetails.results.locale,
          primary_exchange: tickerDetails.results.primary_exchange,
          type: tickerDetails.results.type,
          active: tickerDetails.results.active,
          currency_name: tickerDetails.results.currency_name,
          market_cap: tickerDetails.results.market_cap,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: `Error fetching ticker ${
          (request.params as any)?.symbol || 'unknown'
        }`,
        error: error.message || 'Unknown error',
        status: error.status,
      });
    }
  });

  // Test daily data using official client
  fastify.get('/test-daily/:symbol', async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string };
      if (!symbol) {
        return reply.status(400).send({
          success: false,
          message: 'Symbol parameter is required',
        });
      }
      const apiKey = process.env.POLYGON_API_KEY;

      if (!apiKey) {
        return reply.status(500).send({
          success: false,
          message: 'POLYGON_API_KEY not configured',
        });
      }

      const rest = restClient(apiKey || '', 'https://api.polygon.io');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];

      const dailyData = await rest.getStocksOpenClose(symbol, dateString || '');

      if (!dailyData) {
        return reply.status(404).send({
          success: false,
          message: `Daily data for ${symbol} not found for ${dateString}`,
        });
      }

      return reply.send({
        success: true,
        message: `Daily data for ${symbol} retrieved`,
        data: {
          symbol: dailyData.symbol,
          date: dateString,
          open: dailyData.open,
          close: dailyData.close,
          high: dailyData.high,
          low: dailyData.low,
          volume: dailyData.volume,
          adjusted: (dailyData as any).adjusted || false,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: `Error fetching daily data for ${
          (request.params as any)?.symbol || 'unknown'
        }`,
        error: error.message || 'Unknown error',
        status: error.status,
      });
    }
  });

  // Test full conversion using official client
  fastify.get('/test-conversion/:symbol', async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string };
      if (!symbol) {
        return reply.status(400).send({
          success: false,
          message: 'Symbol parameter is required',
        });
      }
      const apiKey = process.env.POLYGON_API_KEY;

      if (!apiKey) {
        return reply.status(500).send({
          success: false,
          message: 'POLYGON_API_KEY not configured',
        });
      }

      const rest = restClient(apiKey || '', 'https://api.polygon.io');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];

      // Use correct method names
      const tickerDetails = await rest.getTicker(symbol);
      const dailyData = await rest.getStocksOpenClose(symbol, dateString || '');

      if (!tickerDetails.results) {
        return reply.status(404).send({
          success: false,
          message: `Ticker ${symbol} not found`,
        });
      }

      // Convert to our internal format
      const stockData = {
        symbol: tickerDetails.results.ticker,
        name: tickerDetails.results.name,
        country:
          tickerDetails.results.locale === 'us' ? 'United States' : 'Unknown',
        marketCap: tickerDetails.results.market_cap || 0,
        price: dailyData.close || 0,
        changes: (dailyData.close || 0) - (dailyData.open || 0),
        changesPercentage: dailyData.open
          ? (((dailyData.close || 0) - (dailyData.open || 0)) /
              (dailyData.open || 0)) *
            100
          : 0,
        monthlyChanges: 0,
        monthlyChangesPercentage: 0,
        indexes:
          (tickerDetails.results.market_cap || 0) > 10000000000
            ? ['Large Cap']
            : ['Small Cap'],
        lastUpdated: new Date(),
      };

      return reply.send({
        success: true,
        message: `Stock data conversion for ${symbol} completed`,
        data: {
          original: {
            ticker: tickerDetails.results.ticker,
            name: tickerDetails.results.name,
            market: tickerDetails.results.market,
            locale: tickerDetails.results.locale,
            marketCap: tickerDetails.results.market_cap,
          },
          daily: {
            symbol: dailyData.symbol,
            open: dailyData.open,
            close: dailyData.close,
            high: dailyData.high,
            low: dailyData.low,
            volume: dailyData.volume,
            date: dateString,
          },
          converted: stockData,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: `Error converting stock data for ${
          (request.params as any)?.symbol || 'unknown'
        }`,
        error: error.message || 'Unknown error',
        status: error.status,
      });
    }
  });
};

export default testPolygonRoutes;
