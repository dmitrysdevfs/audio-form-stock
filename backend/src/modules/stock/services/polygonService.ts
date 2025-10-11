import { restClient } from '@polygon.io/client-js';
import {
  PolygonTicker,
  PolygonTickerDetails,
  PolygonDailyData,
  StockData,
} from '../types/index.js';

/**
 * Polygon.io API service for fetching stock data using official client
 */
export class PolygonService {
  private rest: any;
  private rateLimitDelay: number;

  constructor() {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY environment variable is required');
    }
    this.rest = restClient(apiKey, 'https://api.polygon.io');
    this.rateLimitDelay = 22000; // 22 seconds for safety (3 calls/minute)
  }

  /**
   * Get all tickers from Polygon.io using official client
   */
  async getTickers(): Promise<PolygonTicker[]> {
    try {
      const response = await this.rest.listTickers('stocks');

      return response.results || [];
    } catch (error) {
      console.error('Error fetching tickers from Polygon:', error);
      throw error;
    }
  }

  /**
   * Get ticker details from Polygon.io using official client
   */
  async getTickerDetails(symbol: string): Promise<PolygonTickerDetails | null> {
    try {
      const response = await this.rest.getTicker(symbol);
      return response.results || null;
    } catch (error: any) {
      console.error(`Error fetching ticker details for ${symbol}:`, error);
      // Return null for 404 errors, throw for others
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get daily data for a ticker using official client
   */
  async getDailyData(
    symbol: string,
    date: string
  ): Promise<PolygonDailyData | null> {
    try {
      const response = await this.rest.getStocksOpenClose(symbol, date);

      return response;
    } catch (error: any) {
      console.error(`Error fetching daily data for ${symbol}:`, error);
      // Return null for 404 errors, throw for others
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get batch of tickers with rate limiting
   */
  async getTickersBatch(symbols: string[]): Promise<PolygonTickerDetails[]> {
    const results: PolygonTickerDetails[] = [];

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];

      if (!symbol) {
        console.error('Empty symbol found in batch');
        continue;
      }

      try {
        const details = await this.getTickerDetails(symbol);
        if (details) {
          results.push(details);
        }

        // Rate limiting: wait between requests (5 calls/minute = 12 seconds)
        if (i < symbols.length - 1) {
          await this.delay(this.rateLimitDelay);
        }
      } catch (error) {
        console.error(`Error processing symbol ${symbol}:`, error);
        // Continue with next symbol
      }
    }

    return results;
  }

  /**
   * Convert Polygon ticker to our StockData format
   */
  convertToStockData(
    ticker: PolygonTickerDetails,
    dailyData?: PolygonDailyData
  ): StockData {
    const price = dailyData?.close || 0;
    const previousClose = dailyData?.open || 0;
    const changes = price - previousClose;
    const changesPercentage =
      previousClose > 0 ? (changes / previousClose) * 100 : 0;

    return {
      symbol: ticker.ticker,
      name: ticker.name,
      country: this.determineCountry(ticker),
      marketCap: ticker.market_cap || 0,
      price,
      changes,
      changesPercentage,
      monthlyChanges: 0, // Will be calculated separately
      monthlyChangesPercentage: 0, // Will be calculated separately
      indexes: this.determineIndexes(ticker),
      lastUpdated: new Date(),
    };
  }

  /**
   * Determine country based on ticker information
   */
  private determineCountry(ticker: PolygonTickerDetails): string {
    // Простий мапінг locale → країна
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

  /**
   * Determine which indexes a stock belongs to
   */
  private determineIndexes(ticker: PolygonTickerDetails): string[] {
    const indexes: string[] = [];

    // This is a simplified mapping - in production, you'd want a more comprehensive mapping
    if (ticker.market_cap && ticker.market_cap > 10000000000) {
      // > $10B
      indexes.push('Large Cap');
    } else if (ticker.market_cap && ticker.market_cap > 2000000000) {
      // > $2B
      indexes.push('Mid Cap');
    } else {
      indexes.push('Small Cap');
    }

    return indexes;
  }

  /**
   * Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get yesterday's date in YYYY-MM-DD format
   */
  getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0] || '';
  }

  /**
   * Get date N days ago in YYYY-MM-DD format
   */
  getDateNDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0] || '';
  }
}
