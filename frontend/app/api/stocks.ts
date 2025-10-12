/**
 * Stock API service for frontend
 */

import { MOCK_STOCKS_DATA } from './MOCK_STOCKS_DATA';

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
      console.error('Error fetching stocks from API, falling back to mock data:', error);

      // Fallback to mock data when API is unavailable
      return this.getMockStocks(filters);
    }
  }

  /**
   * Get mock stocks data with filtering and pagination
   */
  private getMockStocks(filters: StockFilters = {}): StockResponse {
    const {
      country,
      search,
      sortBy = 'marketCap',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = filters;

    let filteredData = [...MOCK_STOCKS_DATA];

    // Apply country filter
    if (country) {
      filteredData = filteredData.filter(stock =>
        stock.country.toLowerCase().includes(country.toLowerCase())
      );
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(
        stock =>
          stock.symbol.toLowerCase().includes(searchLower) ||
          stock.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filteredData.sort((a, b) => {
      const aValue = a[sortBy as keyof Stock] as number;
      const bValue = b[sortBy as keyof Stock] as number;

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total: filteredData.length,
      page,
      limit,
    };
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
      console.error('Error fetching stock by symbol from API, falling back to mock data:', error);

      // Fallback to mock data
      const mockStock = MOCK_STOCKS_DATA.find(
        stock => stock.symbol.toLowerCase() === symbol.toLowerCase()
      );

      return mockStock || null;
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
      console.error('Error fetching countries from API, falling back to mock data:', error);

      // Fallback to mock data
      const countries = [...new Set(MOCK_STOCKS_DATA.map(stock => stock.country))];
      return countries;
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
      console.error('Error fetching indexes from API, falling back to mock data:', error);

      // Fallback to mock data - return empty array since mock data doesn't have indexes
      return [];
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
      console.error('Error fetching health status from API, falling back to mock data:', error);

      // Fallback to mock data health status
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'mock',
        lastUpdate: new Date().toISOString(),
        totalStocks: MOCK_STOCKS_DATA.length,
      };
    }
  }
}

// Export singleton instance
export const stockApi = new StockApiService();
