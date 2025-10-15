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
  private processingBatches: Set<number> = new Set();

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.polygonService = new PolygonService(fastify);
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
   * Update stocks using Polygon.io API with enhanced logging and optimization
   */
  async updateStocks(
    batchNumber: number,
    totalBatches: number,
    forceUpdate = false
  ): Promise<StockUpdateResponse> {
    // Check if batch is already processing (idempotency)
    if (this.processingBatches.has(batchNumber)) {
      console.log(`Batch ${batchNumber} is already processing, skipping...`);
      return {
        success: true,
        message: `Batch ${batchNumber} is already processing`,
        processed: 0,
        totalBatches,
        errors: [],
      };
    }

    // Mark batch as processing
    this.processingBatches.add(batchNumber);

    const startTime = Date.now();
    const batchInfo = this.calculateBatchInfo(batchNumber, totalBatches);
    const errors: string[] = [];
    let processed = 0;
    let rateLimitHits = 0;
    let apiErrors = 0;

    try {
      // Log timezone information
      this.polygonService.logTimezoneInfo();

      // Always proceed with update for free plan data collection
      // Market status is logged for information but doesn't block updates
      const updateCheck = this.polygonService.shouldUpdateData();
      console.log(`Market status info: ${updateCheck.reason}`);

      // Force update for free plan data collection
      if (!forceUpdate) {
        console.log('Proceeding with update for free plan data collection');
      }

      console.log(`Starting updateStocks...`);
      console.log(`Processing batch ${batchNumber} of ${totalBatches}`);
      console.log(`Update reason: ${updateCheck.reason}`);

      // Get target symbols for this batch
      const targetSymbols = await this.getTargetSymbols();
      const batchSymbols = targetSymbols.slice(
        batchInfo.startIndex,
        batchInfo.endIndex
      );

      if (batchSymbols.length === 0) {
        console.log('No symbols to process in this batch');
        return {
          success: true,
          message: 'No symbols to process in this batch',
          processed: 0,
          totalBatches,
          errors: [],
        };
      }

      console.log(
        `Processing ${batchSymbols.length} symbols in batch ${batchNumber}`
      );

      // Process batch with Polygon.io API
      const polygonTickers = await this.polygonService.getTickersBatch(
        batchSymbols
      );

      for (let i = 0; i < polygonTickers.length; i++) {
        const ticker = polygonTickers[i];
        const symbolStartTime = Date.now();

        if (!ticker || !ticker.ticker) {
          console.log(`Skipping undefined ticker at index ${i}`);
          continue;
        }

        try {
          console.log(
            `Processing ${ticker.ticker} (${i + 1}/${polygonTickers.length})`
          );

          // Get current and monthly data using optimal dates based on market status
          const currentDate =
            await this.polygonService.getMostRecentTradingDay();
          const monthlyDate =
            await this.polygonService.getMonthlyComparisonDate();

          console.log(
            `Fetching data for ${ticker.ticker}: current=${currentDate} (dynamic: 2 days ago, last completed trading day), monthly=${monthlyDate} (dynamic: 30 days ago, weekday)`
          );

          // Use individual API calls (free plan compatible)
          const currentData = await this.polygonService.getDailyData(
            ticker.ticker,
            currentDate
          );

          // Wait 30 seconds between requests (free plan rate limit)
          await this.delay(30000);

          const monthlyData = await this.polygonService.getDailyData(
            ticker.ticker,
            monthlyDate
          );

          // Process data with validation
          const currentTickerData = currentData
            ? {
                open: currentData.open || 0,
                close: currentData.close || 0,
                high: currentData.high || 0,
                low: currentData.low || 0,
                volume: currentData.volume || 0,
              }
            : { open: 0, close: 0, high: 0, low: 0, volume: 0 };

          const monthlyClosePrice = monthlyData?.close || 0;

          // Validate data before processing
          if (currentTickerData.close <= 0) {
            console.log(
              `WARNING: ${ticker.ticker} - No valid current data (close: ${currentTickerData.close})`
            );
            continue; // Skip this ticker
          }

          const stockData = this.polygonService.convertToStockData(
            ticker,
            currentTickerData as any, // Contains open and close for daily changes
            { close: monthlyClosePrice } as any // Monthly close price
          );

          await this.upsertStock(stockData);
          processed++;

          const symbolTime = Date.now() - symbolStartTime;
          console.log(`Processed ${ticker.ticker} in ${symbolTime}ms`);

          const delayTime = this.calculateAdaptiveDelay(
            batchNumber,
            i,
            polygonTickers.length
          );
          if (delayTime > 0) {
            console.log(`Waiting ${delayTime}ms before next request...`);
            await this.delay(delayTime);
          }
        } catch (error) {
          const symbolTime = Date.now() - symbolStartTime;
          apiErrors++;

          const tickerSymbol = ticker?.ticker || 'UNKNOWN';

          if (error instanceof Error) {
            if (
              error.message.includes('403') ||
              error.message.includes('NOT_AUTHORIZED')
            ) {
              console.log(
                `WARNING: ${tickerSymbol}: Free plan limitation - current day data not available, skipping ticker`
              );
              // Skip this ticker and continue with next one
              continue;
            } else if (
              error.message.includes('429') ||
              error.message.includes('Too Many Requests')
            ) {
              rateLimitHits++;
              console.log(
                `RATE LIMIT: ${tickerSymbol}: Rate limit hit (429) - waiting 30 seconds`
              );
              await this.delay(30000);
              errors.push(`${tickerSymbol}: Rate limit exceeded`);
            } else if (error.message.includes('404')) {
              console.log(
                `WARNING: ${tickerSymbol}: No data available (weekend/holiday) - skipping ticker`
              );
              // Skip this ticker if no data available
              continue;
            } else {
              console.error(
                `ERROR: ${tickerSymbol}: ${error.message} (${symbolTime}ms)`
              );
              errors.push(`${tickerSymbol}: ${error.message}`);
            }
          } else {
            console.error(
              `ERROR: ${tickerSymbol}: Unknown error (${symbolTime}ms)`
            );
            errors.push(`${tickerSymbol}: Unknown error`);
          }
        }
      }

      const totalTime = Date.now() - startTime;
      const successRate = ((processed / polygonTickers.length) * 100).toFixed(
        1
      );

      console.log(`\nBatch ${batchNumber} Summary:`);
      console.log(`   Total symbols: ${polygonTickers.length}`);
      console.log(`   Processed: ${processed}`);
      console.log(`   Errors: ${errors.length}`);
      console.log(`   Rate limit hits: ${rateLimitHits}`);
      console.log(`   Success rate: ${successRate}%`);
      console.log(`   Total time: ${(totalTime / 1000).toFixed(1)}s`);

      // Save update history for enhanced logic
      console.log(
        `DEBUG: processed=${processed}, checking if we should save history...`
      );
      if (processed > 0) {
        console.log(
          'DEBUG: processed > 0, attempting to save update history...'
        );
        try {
          // Get the actual dates that were used in this update
          const usedCurrentDate =
            await this.polygonService.getMostRecentTradingDay();
          const usedMonthlyDate =
            await this.polygonService.getMonthlyComparisonDate();
          console.log(
            `DEBUG: About to save: current=${usedCurrentDate}, monthly=${usedMonthlyDate}`
          );
          await this.polygonService.saveUpdateInfo(
            usedCurrentDate,
            usedMonthlyDate
          );
          console.log(
            `SUCCESS: Saved update history: current=${usedCurrentDate}, monthly=${usedMonthlyDate}`
          );
        } catch (error) {
          console.error('ERROR: Failed to save update history:', error);
        }
      } else {
        console.log('DEBUG: processed <= 0, skipping history save');
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
      const totalTime = Date.now() - startTime;
      console.error(
        `FAILED: Batch ${batchNumber} failed after ${(totalTime / 1000).toFixed(
          1
        )}s:`,
        error
      );
      throw error;
    } finally {
      // Always remove batch from processing set
      this.processingBatches.delete(batchNumber);
    }
  }

  /**
   * Calculate adaptive delay based on batch progress and time
   * Optimized for free plan (2 calls/minute for safety)
   */
  private calculateAdaptiveDelay(
    batchNumber: number,
    currentIndex: number,
    totalInBatch: number
  ): number {
    // Base delay: 30 seconds (free plan rate limit)
    let baseDelay = 30000;

    // Increase delay for later batches to avoid rate limiting
    if (batchNumber > 10) {
      baseDelay += 15000; // 45 seconds for later batches
    } else if (batchNumber > 5) {
      baseDelay += 10000; // 40 seconds for middle batches
    }

    // Increase delay as we progress through batch
    const progressInBatch = currentIndex / totalInBatch;
    if (progressInBatch > 0.8) {
      baseDelay += 10000; // Extra delay near end of batch
    } else if (progressInBatch > 0.5) {
      baseDelay += 5000; // Moderate delay in middle of batch
    }

    // Add random jitter to avoid synchronized requests
    const jitter = Math.random() * 5000 + 2000; // 2-7 seconds jitter

    return Math.floor(baseDelay + jitter);
  }

  /**
   * Create or update a single stock with data validation
   */
  async upsertStock(stockData: StockData): Promise<void> {
    try {
      // Check if we're trying to overwrite with zero values
      const existingStock = await this.fastify.mongo
        .db!.collection('stocks')
        .findOne({ symbol: stockData.symbol });

      // Prevent overwriting valid data with zero values
      if (existingStock && existingStock.price > 0 && stockData.price <= 0) {
        console.log(
          `SKIPPING UPDATE: ${stockData.symbol} - would overwrite valid data (${existingStock.price}) with zero value`
        );
        return;
      }

      // Only update if we have valid data
      if (stockData.price <= 0) {
        console.log(
          `SKIPPING UPDATE: ${stockData.symbol} - no valid price data (${stockData.price})`
        );
        return;
      }

      const now = new Date();
      await this.fastify.mongo.db!.collection('stocks').updateOne(
        { symbol: stockData.symbol },
        {
          $set: {
            ...stockData,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );

      console.log(`UPDATED: ${stockData.symbol} - price: ${stockData.price}`);
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

  private async getTargetSymbols(): Promise<string[]> {
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
    const BATCH_SIZE = 8;
    const startIndex = (batchNumber - 1) * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, 330);

    return {
      batchNumber,
      totalBatches,
      startIndex,
      endIndex,
      symbols: [],
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private findTickerPrice(groupedData: any, ticker: string): number {
    if (!groupedData?.results) return 0;

    const tickerData = groupedData.results.find(
      (item: any) => item.T === ticker
    );
    return tickerData?.c || 0; // 'c' is close price
  }

  private findTickerData(groupedData: any, ticker: string): any {
    if (!groupedData?.results) return { open: 0, close: 0 };

    const tickerData = groupedData.results.find(
      (item: any) => item.T === ticker
    );
    return {
      open: tickerData?.o || 0, // 'o' is open price
      close: tickerData?.c || 0, // 'c' is close price
    };
  }

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
