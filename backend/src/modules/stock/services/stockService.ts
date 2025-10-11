import { FastifyInstance } from 'fastify';
import {
  StockData,
  StockFilters,
  StockUpdateResponse,
  HealthResponse,
} from '../types';

/**
 * Stock service for database operations
 */
export class StockService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Get all stocks with filtering and pagination
   */
  async getStocks(filters: StockFilters = {}): Promise<{
    data: StockData[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        country,
        indexes,
        search,
        sortBy = 'symbol',
        sortOrder = 'asc',
        page = 1,
        limit = 50,
      } = filters;

      // Build query
      const query: any = {};

      if (country) {
        query.country = country;
      }

      if (indexes && indexes.length > 0) {
        query.indexes = { $in: indexes };
      }

      if (search) {
        query.$or = [
          { symbol: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [data, total] = await Promise.all([
        this.fastify.mongo
          .db!.collection('stocks')
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.fastify.mongo.db!.collection('stocks').countDocuments(query),
      ]);

      return {
        data: data.map(this.mapToStockData),
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error getting stocks:', error);
      throw error;
    }
  }

  /**
   * Get stock by symbol
   */
  async getStockBySymbol(symbol: string): Promise<StockData | null> {
    try {
      const stock = await this.fastify.mongo
        .db!.collection('stocks')
        .findOne({ symbol: symbol.toUpperCase() });

      return stock ? this.mapToStockData(stock) : null;
    } catch (error) {
      console.error('Error getting stock by symbol:', error);
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<HealthResponse> {
    try {
      // Check database connection
      await this.fastify.mongo.client.db().command({ ping: 1 });

      // Get total stocks count
      const totalStocks = await this.fastify.mongo
        .db!.collection('stocks')
        .countDocuments();

      // Get last update time
      const lastStock = await this.fastify.mongo
        .db!.collection('stocks')
        .findOne({}, { sort: { lastUpdated: -1 } });

      return {
        status: 'healthy',
        timestamp: new Date(),
        database: 'connected',
        lastUpdate: lastStock?.lastUpdated,
        totalStocks,
      };
    } catch (error) {
      console.error('Error getting health status:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        database: 'disconnected',
        totalStocks: 0,
      };
    }
  }

  /**
   * Update stocks (placeholder for future implementation)
   */
  async updateStocks(
    batchNumber: number,
    totalBatches: number,
    forceUpdate = false
  ): Promise<StockUpdateResponse> {
    try {
      // This will be implemented in the next phase
      // For now, return a placeholder response
      return {
        success: true,
        message: 'Stock update endpoint ready for implementation',
        processed: 0,
        totalBatches,
        errors: [],
      };
    } catch (error) {
      console.error('Error updating stocks:', error);
      throw error;
    }
  }

  /**
   * Create or update a single stock
   */
  async upsertStock(stockData: StockData): Promise<void> {
    try {
      await this.fastify.mongo.db!.collection('stocks').replaceOne(
        { symbol: stockData.symbol },
        {
          ...stockData,
          updatedAt: new Date(),
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error upserting stock:', error);
      throw error;
    }
  }

  /**
   * Get stocks by symbols
   */
  async getStocksBySymbols(symbols: string[]): Promise<StockData[]> {
    try {
      const stocks = await this.fastify.mongo
        .db!.collection('stocks')
        .find({ symbol: { $in: symbols.map((s) => s.toUpperCase()) } })
        .toArray();

      return stocks.map(this.mapToStockData);
    } catch (error) {
      console.error('Error getting stocks by symbols:', error);
      throw error;
    }
  }

  /**
   * Get unique countries
   */
  async getCountries(): Promise<string[]> {
    try {
      const countries = await this.fastify.mongo
        .db!.collection('stocks')
        .distinct('country');

      return countries.sort();
    } catch (error) {
      console.error('Error getting countries:', error);
      throw error;
    }
  }

  /**
   * Get unique indexes
   */
  async getIndexes(): Promise<string[]> {
    try {
      const indexes = await this.fastify.mongo
        .db!.collection('stocks')
        .distinct('indexes');

      return indexes.sort();
    } catch (error) {
      console.error('Error getting indexes:', error);
      throw error;
    }
  }

  /**
   * Map database document to StockData interface
   */
  private mapToStockData(doc: any): StockData {
    return {
      symbol: doc.symbol,
      name: doc.name,
      country: doc.country,
      marketCap: doc.marketCap,
      price: doc.price,
      changes: doc.changes,
      changesPercentage: doc.changesPercentage,
      monthlyChanges: doc.monthlyChanges || 0,
      monthlyChangesPercentage: doc.monthlyChangesPercentage || 0,
      indexes: doc.indexes,
      lastUpdated: doc.lastUpdated,
    };
  }
}
