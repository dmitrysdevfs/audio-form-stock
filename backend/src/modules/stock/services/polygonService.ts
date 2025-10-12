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
    this.rateLimitDelay = 18000; // 18 seconds for optimal balance (4 calls/minute = 15s + 3s buffer)
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
}
