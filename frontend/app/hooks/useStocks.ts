'use client';

import { useState, useEffect, useCallback } from 'react';
import { stockApi, Stock, StockFilters, StockResponse, HealthResponse } from '../api/stocks';

export interface UseStocksReturn {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  health: HealthResponse | null;
  countries: string[];
  indexes: string[];
  refetch: () => Promise<void>;
  setFilters: (filters: StockFilters) => void;
  setPage: (page: number) => void;
}

export const useStocks = (initialFilters: StockFilters = {}) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'marketCap');
  const [sortOrder, setSortOrder] = useState(initialFilters.sortOrder || 'desc');
  const [filters, setFilters] = useState<StockFilters>({
    ...initialFilters,
    sortBy: initialFilters.sortBy || 'marketCap',
    sortOrder: initialFilters.sortOrder || 'desc',
  });

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [indexes, setIndexes] = useState<string[]>([]);

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const requestParams = {
        ...filters,
        sortBy,
        sortOrder,
        page,
        limit,
      };

      const response: StockResponse = await stockApi.getStocks(requestParams);

      setStocks(response.data);
      setTotal(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, page, limit]);

  const fetchHealth = useCallback(async () => {
    try {
      const healthData = await stockApi.getHealth();
      setHealth(healthData);
    } catch (err) {
      console.error('Error fetching health status:', err);
    }
  }, []);

  const fetchCountries = useCallback(async () => {
    try {
      const countriesData = await stockApi.getCountries();
      setCountries(countriesData);
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  }, []);

  const fetchIndexes = useCallback(async () => {
    try {
      const indexesData = await stockApi.getIndexes();
      setIndexes(indexesData);
    } catch (err) {
      console.error('Error fetching indexes:', err);
    }
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([fetchStocks(), fetchHealth(), fetchCountries(), fetchIndexes()]);
  }, [fetchStocks, fetchHealth, fetchCountries, fetchIndexes]);

  const handleSetFilters = useCallback((newFilters: StockFilters) => {
    setFilters(newFilters);
    if (newFilters.sortBy) setSortBy(newFilters.sortBy);
    if (newFilters.sortOrder) setSortOrder(newFilters.sortOrder);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Initial load - only fetch stocks after filters are set
  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Fetch other data (health, countries, indexes) on mount
  useEffect(() => {
    Promise.all([fetchHealth(), fetchCountries(), fetchIndexes()]);
  }, [fetchHealth, fetchCountries, fetchIndexes]);

  return {
    stocks,
    loading,
    error,
    total,
    page,
    limit,
    health,
    countries,
    indexes,
    refetch,
    setFilters: handleSetFilters,
    setPage: handleSetPage,
  };
};
