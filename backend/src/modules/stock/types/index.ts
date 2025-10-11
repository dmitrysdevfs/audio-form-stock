/**
 * Stock API types and interfaces
 */

export interface StockData {
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
  lastUpdated: Date;
}

export interface StockResponse {
  success: boolean;
  data: StockData[];
  total: number;
  page: number;
  limit: number;
}

export interface StockFilters {
  country?: string;
  indexes?: string[];
  search?: string;
  sortBy?:
    | 'symbol'
    | 'name'
    | 'marketCap'
    | 'price'
    | 'changes'
    | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface StockUpdateRequest {
  batchNumber: number;
  totalBatches: number;
  forceUpdate?: boolean;
}

export interface StockUpdateResponse {
  success: boolean;
  message: string;
  processed: number;
  nextBatch?: number;
  totalBatches: number;
  errors?: string[];
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  database: 'connected' | 'disconnected';
  lastUpdate?: Date;
  totalStocks: number;
}

export interface PolygonTicker {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  last_updated_utc: string;
}

export interface PolygonTickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  last_updated_utc: string;
  description?: string;
  homepage_url?: string;
  total_employees?: number;
  list_date?: string;
  branding?: {
    logo_url?: string;
    icon_url?: string;
  };
  share_class_shares_outstanding?: number;
  weighted_shares_outstanding?: number;
  market_cap?: number;
}

export interface PolygonDailyData {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<{
    v: number;
    vw: number;
    o: number;
    c: number;
    h: number;
    l: number;
    t: number;
    n: number;
  }>;
  status: string;
  request_id: string;
  count: number;
}

export interface BatchUpdateInfo {
  batchNumber: number;
  totalBatches: number;
  startIndex: number;
  endIndex: number;
  symbols: string[];
}
