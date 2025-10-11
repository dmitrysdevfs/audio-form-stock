import { FastifySchema } from 'fastify';

/**
 * Schema for GET /api/stocks endpoint
 */
export const getStocksSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      country: { type: 'string' },
      indexes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['NASDAQ', 'S&P500', 'DOW'],
        },
      },
      search: { type: 'string' },
      sortBy: {
        type: 'string',
        enum: [
          'symbol',
          'name',
          'marketCap',
          'price',
          'changes',
          'lastUpdated',
        ],
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
      },
      page: { type: 'number', minimum: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              name: { type: 'string' },
              country: { type: 'string' },
              marketCap: { type: 'number' },
              price: { type: 'number' },
              changes: { type: 'number' },
              changesPercentage: { type: 'number' },
              monthlyChanges: { type: 'number' },
              monthlyChangesPercentage: { type: 'number' },
              indexes: {
                type: 'array',
                items: { type: 'string' },
              },
              lastUpdated: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  },
};

/**
 * Schema for GET /api/stocks/health endpoint
 */
export const getHealthSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'unhealthy'],
        },
        timestamp: { type: 'string', format: 'date-time' },
        database: {
          type: 'string',
          enum: ['connected', 'disconnected'],
        },
        lastUpdate: { type: 'string', format: 'date-time' },
        totalStocks: { type: 'number' },
      },
    },
  },
};

/**
 * Schema for POST /api/stocks/update endpoint
 */
export const updateStocksSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      batchNumber: { type: 'number', minimum: 1 },
      totalBatches: { type: 'number', minimum: 1 },
      forceUpdate: { type: 'boolean' },
    },
    required: ['batchNumber', 'totalBatches'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        processed: { type: 'number' },
        nextBatch: { type: 'number' },
        totalBatches: { type: 'number' },
        errors: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
};

/**
 * Schema for GET /api/stocks/:symbol endpoint
 */
export const getStockBySymbolSchema: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        pattern: '^[A-Z0-9]+$',
        minLength: 1,
        maxLength: 10,
      },
    },
    required: ['symbol'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
            name: { type: 'string' },
            country: { type: 'string' },
            marketCap: { type: 'number' },
            price: { type: 'number' },
            changes: { type: 'number' },
            changesPercentage: { type: 'number' },
            monthlyChanges: { type: 'number' },
            monthlyChangesPercentage: { type: 'number' },
            indexes: {
              type: 'array',
              items: { type: 'string' },
            },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};
