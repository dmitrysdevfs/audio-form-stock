/**
 * Stock API service for frontend
 */

export interface Stock {
  symbol: string;
  name: string;
  country: string;
  marketCap: number;
  price: number;
  changes: number;
  changesPercentage: number;
  monthlyChanges: number;
  monthlyChangesPercentage: number;
  indexes: string[];
  lastUpdated: string;
}

export interface StockFilters {
  country?: string;
  indexes?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface StockResponse {
  data: Stock[];
  total: number;
  page: number;
  limit: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
  lastUpdate?: string;
  totalStocks: number;
}

class StockApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or fallback to localhost for development
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Get all stocks with filtering and pagination
   */
  async getStocks(filters: StockFilters = {}): Promise<StockResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.country) params.append('country', filters.country);
      if (filters.indexes?.length) params.append('indexes', filters.indexes.join(','));
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseUrl}/api/stocks?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }
  }

  /**
   * Get stock by symbol
   */
  async getStockBySymbol(symbol: string): Promise<Stock | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stocks/${symbol}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stock by symbol:', error);
      throw error;
    }
  }

  /**
   * Get unique countries
   */
  async getCountries(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stocks/countries`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  /**
   * Get unique indexes
   */
  async getIndexes(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stocks/indexes`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching indexes:', error);
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stocks/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching health status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stockApi = new StockApiService();
