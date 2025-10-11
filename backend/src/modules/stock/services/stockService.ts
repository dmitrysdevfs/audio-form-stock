import { FastifyInstance } from 'fastify';
import {
  StockData,
  StockFilters,
  StockUpdateResponse,
  HealthResponse,
  BatchUpdateInfo,
} from '../types';
import { PolygonService } from './polygonService.js';

/**
 * Stock service for database operations
 */
export class StockService {
  private fastify: FastifyInstance;
  private polygonService: PolygonService;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.polygonService = new PolygonService();
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
   * Update stocks using Polygon.io API
   */
  async updateStocks(
    batchNumber: number,
    totalBatches: number,
    forceUpdate = false
  ): Promise<StockUpdateResponse> {
    try {
      const batchInfo = this.calculateBatchInfo(batchNumber, totalBatches);
      const errors: string[] = [];
      let processed = 0;

      // Get target symbols for this batch
      const targetSymbols = await this.getTargetSymbols();
      const batchSymbols = targetSymbols.slice(
        batchInfo.startIndex,
        batchInfo.endIndex
      );

      if (batchSymbols.length === 0) {
        return {
          success: true,
          message: 'No symbols to process in this batch',
          processed: 0,
          totalBatches,
          errors: [],
        };
      }

      // Process batch with Polygon.io API
      const polygonTickers = await this.polygonService.getTickersBatch(
        batchSymbols
      );

      for (const ticker of polygonTickers) {
        try {
          // Get daily data for yesterday
          const yesterday = this.polygonService.getYesterdayDate();
          const dailyData = await this.polygonService.getDailyData(
            ticker.ticker,
            yesterday
          );

          // Convert to our format
          const stockData = this.polygonService.convertToStockData(
            ticker,
            dailyData || undefined
          );

          // Save to database
          await this.upsertStock(stockData);
          processed++;

          // Rate limiting delay (3 calls/minute = 22 seconds)
          await this.delay(22000);
        } catch (error) {
          const errorMsg = `Error processing ${ticker.ticker}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        success: true,
        message: `Processed batch ${batchNumber} of ${totalBatches}`,
        processed,
        nextBatch: batchNumber < totalBatches ? batchNumber + 1 : undefined,
        totalBatches,
        errors,
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
   * Test Polygon.io integration
   */
  async testPolygonIntegration(): Promise<any> {
    try {
      // Test 1: Get tickers
      const tickers = await this.polygonService.getTickers();

      // Test 2: Get details for a specific ticker (AAPL)
      const tickerDetails = await this.polygonService.getTickerDetails('AAPL');

      // Test 3: Get daily data for AAPL
      const yesterday = this.polygonService.getYesterdayDate();
      const dailyData = await this.polygonService.getDailyData(
        'AAPL',
        yesterday
      );

      // Test 4: Convert to our format
      const stockData = tickerDetails
        ? this.polygonService.convertToStockData(
            tickerDetails,
            dailyData || undefined
          )
        : null;

      return {
        tickersCount: tickers.length,
        tickerDetails: tickerDetails
          ? {
              symbol: tickerDetails.ticker,
              name: tickerDetails.name,
              market: tickerDetails.market,
              locale: tickerDetails.locale,
            }
          : null,
        dailyData: dailyData
          ? {
              symbol: dailyData.ticker,
              close: dailyData.close || 0,
              open: dailyData.open || 0,
              high: dailyData.high || 0,
              low: dailyData.low || 0,
              volume: dailyData.volume || 0,
            }
          : null,
        convertedStockData: stockData,
        testDate: yesterday,
      };
    } catch (error) {
      console.error('Error testing Polygon.io integration:', error);
      throw error;
    }
  }

  /**
   * Get target symbols for processing (330 companies)
   */
  private async getTargetSymbols(): Promise<string[]> {
    // This would typically come from a configuration or database
    // For now, we'll use a predefined list of major stocks
    const nasdaq100 = [
      'AAPL',
      'MSFT',
      'GOOGL',
      'AMZN',
      'TSLA',
      'META',
      'NVDA',
      'NFLX',
      'ADBE',
      'CRM',
      'PYPL',
      'INTC',
      'CMCSA',
      'PEP',
      'COST',
      'TMUS',
      'AVGO',
      'TXN',
      'QCOM',
      'CHTR',
      'SBUX',
      'INTU',
      'ISRG',
      'GILD',
      'MDLZ',
      'BKNG',
      'ADP',
      'VRTX',
      'REGN',
      'CSX',
      'AMAT',
      'AMD',
      'ATVI',
      'ADSK',
      'ILMN',
      'LRCX',
      'MU',
      'AMGN',
      'BIIB',
      'FISV',
      'CTAS',
      'KLAC',
      'SNPS',
      'MCHP',
      'CDNS',
      'CTSH',
      'WBA',
      'EXC',
      'AEP',
      'SO',
      'DUK',
      'D',
      'EXPE',
      'PAYX',
      'ORLY',
      'ROST',
      'DXCM',
      'IDXX',
      'SIRI',
      'CHKP',
      'VRSN',
      'NTES',
      'MRNA',
      'BIDU',
      'ALGN',
      'CPRT',
      'FAST',
      'VRSK',
      'ANSS',
      'CTXS',
      'WLTW',
      'XEL',
      'ILMN',
      'MELI',
      'TEAM',
      'ZM',
      'DOCU',
      'CRWD',
      'OKTA',
      'SNOW',
      'PLTR',
      'ROKU',
      'PTON',
      'ZOOM',
      'SQ',
      'SHOP',
      'TWLO',
      'SPOT',
      'UBER',
      'LYFT',
    ];

    const sp500Top200 = [
      'JNJ',
      'JPM',
      'V',
      'PG',
      'UNH',
      'HD',
      'MA',
      'DIS',
      'BAC',
      'XOM',
      'T',
      'PFE',
      'ABT',
      'VZ',
      'KO',
      'MRK',
      'TMO',
      'WMT',
      'ABBV',
      'ACN',
      'NKE',
      'CVX',
      'DHR',
      'TXN',
      'NEE',
      'LLY',
      'UNP',
      'PM',
      'HON',
      'IBM',
      'SPGI',
      'RTX',
      'LOW',
      'TGT',
      'ISRG',
      'GILD',
      'MDLZ',
      'BKNG',
      'ADP',
      'VRTX',
      'REGN',
      'CSX',
      'AMAT',
      'AMD',
      'ATVI',
      'ADSK',
      'ILMN',
      'LRCX',
      'MU',
      'BIIB',
      'FISV',
      'CTAS',
      'KLAC',
      'SNPS',
      'MCHP',
      'CDNS',
      'CTSH',
      'WBA',
      'EXC',
      'AEP',
      'SO',
      'DUK',
      'D',
      'EXPE',
      'PAYX',
      'ORLY',
      'ROST',
      'DXCM',
      'IDXX',
      'SIRI',
      'CHKP',
      'VRSN',
      'NTES',
      'MRNA',
      'BIDU',
      'ALGN',
      'CPRT',
      'FAST',
      'VRSK',
      'ANSS',
      'CTXS',
      'WLTW',
      'XEL',
      'MELI',
      'TEAM',
      'ZM',
      'DOCU',
      'CRWD',
      'OKTA',
      'SNOW',
      'PLTR',
      'ROKU',
      'PTON',
      'ZOOM',
      'SQ',
      'SHOP',
      'TWLO',
      'SPOT',
      'UBER',
      'LYFT',
    ];

    const dowJones30 = [
      'AAPL',
      'MSFT',
      'UNH',
      'JNJ',
      'V',
      'JPM',
      'PG',
      'HD',
      'MA',
      'DIS',
      'BAC',
      'XOM',
      'T',
      'PFE',
      'ABT',
      'VZ',
      'KO',
      'MRK',
      'TMO',
      'WMT',
      'ABBV',
      'ACN',
      'NKE',
      'CVX',
      'DHR',
      'ADBE',
    ];

    // Combine and deduplicate
    const allSymbols = [
      ...new Set([...nasdaq100, ...sp500Top200, ...dowJones30]),
    ];
    return allSymbols.slice(0, 330); // Limit to 330 companies
  }

  /**
   * Calculate batch information
   */
  private calculateBatchInfo(
    batchNumber: number,
    totalBatches: number
  ): BatchUpdateInfo {
    const BATCH_SIZE = 10; // Зменшено з 50 до 10
    const startIndex = (batchNumber - 1) * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, 330);

    return {
      batchNumber,
      totalBatches,
      startIndex,
      endIndex,
      symbols: [], // Will be populated by getTargetSymbols
    };
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
