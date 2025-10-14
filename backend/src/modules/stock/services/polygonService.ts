import { restClient } from '@polygon.io/client-js';
import {
  PolygonTicker,
  PolygonTickerDetails,
  PolygonDailyData,
  StockData,
} from '../types/index.js';
import { TimezoneUtils } from '../utils/timezoneUtils.js';

/**
 * Polygon.io API service for fetching stock data using official client
 */
export class PolygonService {
  private rest: any;
  private rateLimitDelay: number;
  private fastify: any;

  constructor(fastify?: any) {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY environment variable is required');
    }
    this.rest = restClient(apiKey, 'https://api.polygon.io');
    this.rateLimitDelay = 18000; // 18 seconds for optimal balance (4 calls/minute = 15s + 3s buffer)
    this.fastify = fastify;
  }

  async getTickers(): Promise<PolygonTicker[]> {
    try {
      const response = await this.rest.listTickers('stocks');

      return response.results || [];
    } catch (error) {
      console.error('Error fetching tickers from Polygon:', error);
      throw error;
    }
  }

  async getTickerDetails(symbol: string): Promise<PolygonTickerDetails | null> {
    try {
      const response = await this.rest.getTicker(symbol);
      return response.results || null;
    } catch (error: any) {
      console.error(`Error fetching ticker details for ${symbol}:`, error);
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getDailyData(
    symbol: string,
    date: string
  ): Promise<PolygonDailyData | null> {
    try {
      const response = await this.rest.getStocksOpenClose(symbol, date);

      return response;
    } catch (error: any) {
      console.error(`Error fetching daily data for ${symbol}:`, error);
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getGroupedStocksAggregates(date: string): Promise<any> {
    try {
      // Use direct HTTP request since getGroupedDaily doesn't exist in the client
      const apiKey = process.env.POLYGON_API_KEY;
      const url = `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apikey=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(
        `Error fetching grouped stocks aggregates for ${date}:`,
        error
      );
      throw error;
    }
  }

  async getTickersBatch(symbols: string[]): Promise<PolygonTickerDetails[]> {
    const results: PolygonTickerDetails[] = [];
    const startTime = Date.now();

    console.log(`Fetching details for ${symbols.length} symbols`);

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const symbolStartTime = Date.now();

      if (!symbol) {
        console.error('Empty symbol found in batch');
        continue;
      }

      try {
        const details = await this.getTickerDetails(symbol);
        if (details) {
          results.push(details);
          const symbolTime = Date.now() - symbolStartTime;
          console.log(`SUCCESS: ${symbol} details fetched in ${symbolTime}ms`);
        } else {
          console.log(`WARNING: ${symbol}: No details found`);
        }

        if (i < symbols.length - 1) {
          const adaptiveDelay = this.calculateAdaptiveDelay(i, symbols.length);
          if (adaptiveDelay > 0) {
            console.log(`Waiting ${adaptiveDelay}ms before next request...`);
            await this.delay(adaptiveDelay);
          }
        }
      } catch (error) {
        const symbolTime = Date.now() - symbolStartTime;
        console.error(`ERROR: ${symbol}: Error after ${symbolTime}ms -`, error);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `Batch details fetch completed: ${results.length}/${symbols.length} in ${(
        totalTime / 1000
      ).toFixed(1)}s`
    );

    return results;
  }

  private calculateAdaptiveDelay(
    currentIndex: number,
    totalSymbols: number
  ): number {
    let baseDelay = 18000;

    const progress = currentIndex / totalSymbols;
    if (progress > 0.8) {
      baseDelay += 3000;
    } else if (progress > 0.6) {
      baseDelay += 2000;
    }

    const jitter = Math.random() * 1500 + 500;

    return Math.floor(baseDelay + jitter);
  }

  convertToStockData(
    ticker: PolygonTickerDetails,
    dailyData?: PolygonDailyData,
    monthlyData?: PolygonDailyData
  ): StockData {
    const price = dailyData?.close || 0;
    const previousClose = dailyData?.open || 0;
    const changes = price - previousClose;
    const changesPercentage =
      previousClose > 0 ? (changes / previousClose) * 100 : 0;

    // Calculate monthly changes
    const monthlyPrice = monthlyData?.close || 0;
    const monthlyChanges = price - monthlyPrice;
    const monthlyChangesPercentage =
      monthlyPrice > 0 ? (monthlyChanges / monthlyPrice) * 100 : 0;

    return {
      symbol: ticker.ticker,
      name: ticker.name,
      country: this.determineCountry(ticker),
      marketCap: ticker.market_cap || 0,
      price,
      changes,
      changesPercentage,
      monthlyChanges,
      monthlyChangesPercentage,
      indexes: this.determineIndexes(ticker),
      lastUpdated: new Date(),
    };
  }

  private determineCountry(ticker: PolygonTickerDetails): string {
    switch (ticker.locale) {
      case 'us':
        return 'United States';
      case 'ca':
        return 'Canada';
      case 'uk':
        return 'United Kingdom';
      case 'eu':
        return 'Europe';
      case 'asia':
        return 'Asia';
      case 'au':
        return 'Australia';
      default:
        return 'Unknown';
    }
  }

  private determineIndexes(ticker: PolygonTickerDetails): string[] {
    const indexes: string[] = [];

    if (ticker.market_cap && ticker.market_cap > 10000000000) {
      indexes.push('Large Cap');
    } else if (ticker.market_cap && ticker.market_cap > 2000000000) {
      indexes.push('Mid Cap');
    } else {
      indexes.push('Small Cap');
    }

    return indexes;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0] || '';
  }

  getDateNDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0] || '';
  }

  /**
   * Get market status and optimal update timing
   */
  getMarketStatus() {
    return TimezoneUtils.getMarketStatus();
  }

  /**
   * Get optimal update schedule based on market hours and Kyiv time
   */
  getOptimalUpdateSchedule() {
    return TimezoneUtils.getOptimalUpdateSchedule();
  }

  /**
   * Get current time in different timezones for logging
   */
  getCurrentTimes() {
    return TimezoneUtils.getCurrentTimes();
  }

  /**
   * Check if data should be updated based on market status
   * For free plan: always allow updates to collect available data
   */
  shouldUpdateData(): {
    shouldUpdate: boolean;
    reason: string;
    nextUpdate?: Date;
  } {
    const schedule = this.getOptimalUpdateSchedule();
    const kyivTime = TimezoneUtils.toKyivTime(new Date());

    // For free plan: always allow updates to collect available data
    return {
      shouldUpdate: true, // Always allow updates for free plan
      reason: `Free plan data collection - ${schedule.reason}`,
      nextUpdate: schedule.nextUpdateTime,
    };
  }

  /**
   * Get the most recent trading day date
   * Enhanced logic: considers update history to avoid duplicates
   */
  async getMostRecentTradingDay(): Promise<string> {
    try {
      // Check if we have update history in database
      const lastUpdate = await this.getLastUpdateInfo();

      if (lastUpdate) {
        console.log(
          `Last update was: ${lastUpdate.lastUpdateDate} (${lastUpdate.lastUpdateTime})`
        );

        const lastUpdateDate = new Date(lastUpdate.lastUpdateDate);
        const today = new Date();

        if (
          this.isSameDay(lastUpdateDate, today) ||
          this.isSameDay(lastUpdateDate, this.getYesterday())
        ) {
          console.log(
            'Data already updated for recent dates, looking for next available date...'
          );
          return this.getNextAvailableTradingDay(lastUpdateDate);
        }
      }
    } catch (error) {
      console.log('No update history found, using original logic');
    }

    // Fallback to original logic if no history
    return this.getOriginalMostRecentTradingDay();
  }

  /**
   * Get next available trading day after a given date
   */
  private getNextAvailableTradingDay(afterDate: Date): string {
    let checkDate = new Date(afterDate);
    checkDate.setDate(checkDate.getDate() + 1); // Start from next day

    // Go forward until we find a weekday
    while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      checkDate.setDate(checkDate.getDate() + 1);
    }

    return checkDate.toISOString().split('T')[0] || '';
  }

  /**
   * Get last update information from database
   */
  private async getLastUpdateInfo(): Promise<any> {
    try {
      // Check if we have update history in database
      const updateHistory = await this.fastify.mongo
        .db!.collection('update_history')
        .findOne({}, { sort: { lastUpdateTime: -1 } });

      return updateHistory;
    } catch (error) {
      console.log('No update history found, using original logic');
      return null;
    }
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  /**
   * Get yesterday's date
   */
  private getYesterday(): Date {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  /**
   * Original logic for most recent trading day
   */
  private getOriginalMostRecentTradingDay(): string {
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 2);

    while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return checkDate.toISOString().split('T')[0] || '';
  }

  /**
   * Get date for monthly comparison (30 days ago, skip weekends)
   * Enhanced logic: considers update history to avoid duplicates
   */
  async getMonthlyComparisonDate(): Promise<string> {
    try {
      // Check if we have update history in database
      const lastUpdate = await this.getLastUpdateInfo();

      if (lastUpdate) {
        console.log(`Last monthly update was: ${lastUpdate.lastMonthlyDate}`);

        const lastMonthlyDate = new Date(lastUpdate.lastMonthlyDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (lastMonthlyDate >= thirtyDaysAgo) {
          console.log(
            'Monthly data already updated recently, looking for next available date...'
          );
          return this.getNextAvailableTradingDay(lastMonthlyDate);
        }
      }
    } catch (error) {
      console.log('No update history found, using original logic');
    }

    // Fallback to original logic
    return this.getOriginalMonthlyComparisonDate();
  }

  /**
   * Original logic for monthly comparison date
   */
  private getOriginalMonthlyComparisonDate(): string {
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 30);

    while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return checkDate.toISOString().split('T')[0] || '';
  }

  /**
   * Save update information to database
   */
  async saveUpdateInfo(
    currentDate: string,
    monthlyDate: string
  ): Promise<void> {
    console.log(
      `DEBUG: saveUpdateInfo called with current=${currentDate}, monthly=${monthlyDate}`
    );
    try {
      const updateInfo = {
        lastUpdateDate: currentDate,
        lastMonthlyDate: monthlyDate,
        lastUpdateTime: new Date(),
        totalUpdates: 1,
      };

      console.log(`DEBUG: About to insert updateInfo:`, updateInfo);

      if (!this.fastify) {
        console.error('ERROR: fastify not available');
        return;
      }

      if (!this.fastify.mongo) {
        console.error(
          'ERROR: MongoDB not available - check MONGODB_URI environment variable'
        );
        return;
      }

      if (!this.fastify.mongo.db) {
        console.error('ERROR: MongoDB database not connected');
        return;
      }

      // Ensure collection exists and create index
      const collection = this.fastify.mongo.db!.collection('update_history');
      await collection.createIndex({ lastUpdateTime: -1 });

      await collection.insertOne(updateInfo);

      console.log(
        `SUCCESS: Saved update info: current=${currentDate}, monthly=${monthlyDate}`
      );
    } catch (error) {
      console.error('ERROR: Failed to save update info:', error);
    }
  }

  /**
   * Log current timezone information for debugging
   */
  logTimezoneInfo(): void {
    const times = this.getCurrentTimes();
    const marketStatus = this.getMarketStatus();
    const schedule = this.getOptimalUpdateSchedule();

    console.log('=== TIMEZONE INFORMATION ===');
    console.log(`UTC Time: ${times.utc.toISOString()}`);
    console.log(
      `Eastern Time: ${TimezoneUtils.formatEasternTime(times.eastern)}`
    );
    console.log(`Kyiv Time: ${TimezoneUtils.formatKyivTime(times.kyiv)}`);
    console.log(`Market Status: ${marketStatus.currentSession}`);
    console.log(`Market Open: ${marketStatus.isMarketOpen}`);
    console.log(`Pre-Market: ${marketStatus.isPreMarket}`);
    console.log(`After Hours: ${marketStatus.isAfterHours}`);
    console.log(
      `Next Market Open: ${TimezoneUtils.formatKyivTime(
        marketStatus.nextMarketOpen
      )}`
    );
    console.log(
      `Next Market Close: ${TimezoneUtils.formatKyivTime(
        marketStatus.nextMarketClose
      )}`
    );
    console.log(`Update Schedule: ${schedule.reason}`);
    console.log(
      `Next Update: ${
        schedule.nextUpdateTime
          ? TimezoneUtils.formatKyivTime(schedule.nextUpdateTime)
          : 'N/A'
      }`
    );
    console.log('============================');
  }
}
