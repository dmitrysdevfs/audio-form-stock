import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { restClient } from '@polygon.io/client-js';

/**
 * Test official Polygon.io client integration
 */
const testPolygonOfficialRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Test available methods in official client
  fastify.get('/test-available-methods', async (request, reply) => {
    try {
      const apiKey = process.env.POLYGON_API_KEY;
      if (!apiKey) {
        return reply.status(500).send({
          success: false,
          message: 'POLYGON_API_KEY not configured',
        });
      }

      const rest = restClient(apiKey, 'https://api.polygon.io');

      // Get all available methods
      const methods = Object.getOwnPropertyNames(rest).filter(
        (name) => typeof (rest as any)[name] === 'function'
      );

      return reply.send({
        success: true,
        message: 'Available methods in Polygon.io client',
        data: {
          methods,
          totalMethods: methods.length,
          sampleMethods: methods.slice(0, 10),
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: 'Error getting available methods',
        error: error.message || 'Unknown error',
      });
    }
  });

  // Test official client directly
  fastify.get('/test-official-client', async (request, reply) => {
    try {
      const apiKey = process.env.POLYGON_API_KEY;
      if (!apiKey) {
        return reply.status(500).send({
          success: false,
          message: 'POLYGON_API_KEY not configured',
        });
      }

      const rest = restClient(apiKey, 'https://api.polygon.io');

      // Test listTickers
      const tickersResponse = await rest.listTickers('stocks');

      // Test getTicker for AAPL
      const tickerDetailsResponse = await rest.getTicker('AAPL');

      // Test getStocksOpenClose for AAPL
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];

      const dailyResponse = await rest.getStocksOpenClose(
        'AAPL',
        dateString || ''
      );

      return reply.send({
        success: true,
        message: 'Official Polygon.io client test successful',
        data: {
          tickers: {
            count: tickersResponse.results?.length || 0,
            sample: tickersResponse.results?.slice(0, 3) || [],
          },
          tickerDetails: {
            symbol: tickerDetailsResponse.results?.ticker,
            name: tickerDetailsResponse.results?.name,
            market: tickerDetailsResponse.results?.market,
            locale: tickerDetailsResponse.results?.locale,
          },
          dailyData: {
            symbol: dailyResponse.symbol,
            open: dailyResponse.open,
            close: dailyResponse.close,
            high: dailyResponse.high,
            low: dailyResponse.low,
            volume: dailyResponse.volume,
            date: dateString,
          },
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: 'Official Polygon.io client test failed',
        error: error.message || 'Unknown error',
        status: error.status,
        availableMethods: error.message?.includes('not a function')
          ? 'Check /test-available-methods endpoint'
          : undefined,
      });
    }
  });

  // Test rate limiting
  fastify.get('/test-rate-limiting', async (request, reply) => {
    try {
      const apiKey = process.env.POLYGON_API_KEY;
      if (!apiKey) {
        return reply.status(500).send({
          success: false,
          message: 'POLYGON_API_KEY not configured',
        });
      }

      const rest = restClient(apiKey, 'https://api.polygon.io');
      const startTime = Date.now();
      const results = [];

      // Make 3 requests with delays
      for (let i = 0; i < 3; i++) {
        const requestStart = Date.now();
        const response = await rest.listTickers('stocks');
        const requestEnd = Date.now();

        results.push({
          request: i + 1,
          duration: requestEnd - requestStart,
          resultsCount: response.results?.length || 0,
        });

        // Wait 1 second between requests
        if (i < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      const totalTime = Date.now() - startTime;

      return reply.send({
        success: true,
        message: 'Rate limiting test completed',
        data: {
          totalTime,
          requests: results,
          averageTime:
            results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: 'Rate limiting test failed',
        error: error.message || 'Unknown error',
      });
    }
  });
};

export default testPolygonOfficialRoutes;
