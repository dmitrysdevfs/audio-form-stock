'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Input,
  Spinner,
  Card,
  CardBody,
} from '@nextui-org/react';
import { useState, useEffect } from 'react';
import { useStocks } from '../hooks/useStocks';
import { formatMarketCap, formatPrice, formatChangePercentage } from '../utils';
import type { Stock } from '../api/stocks';

const columns = [
  { key: 'index', label: '#' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'name', label: 'Name' },
  { key: 'marketCap', label: 'Capitalization ↓' },
  { key: 'price', label: 'Price' },
  { key: 'changesPercentage', label: 'Price change per day' },
  { key: 'monthlyChangesPercentage', label: 'Price change per month' },
];

const ITEMS_PER_PAGE = 15;

export default function StockPage() {
  const [countryFilter, setCountryFilter] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');

  const { stocks, loading, error, total, page, setFilters, setPage } = useStocks();

  // Update filters when local state changes
  useEffect(() => {
    const newFilters: Record<string, string> = {};

    if (countryFilter) {
      newFilters.country = countryFilter;
    }

    if (symbolFilter) {
      newFilters.search = symbolFilter;
    }

    // Only update if there are actual changes to avoid resetting sortBy/sortOrder
    if (Object.keys(newFilters).length > 0) {
      setFilters(newFilters);
    }
  }, [countryFilter, symbolFilter, setFilters]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [countryFilter, symbolFilter, setPage]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const renderCell = (stock: Stock, columnKey: string, index: number) => {
    switch (columnKey) {
      case 'index':
        return (
          <div className="flex flex-col">
            <p className="text-sm font-normal">{index + 1}</p>
          </div>
        );
      case 'symbol':
        return (
          <div className="flex flex-col">
            <p className="text-sm font-normal capitalize">{stock.symbol}</p>
          </div>
        );
      case 'name':
        return (
          <div className="flex flex-col">
            <p className="text-sm font-normal">{stock.name}</p>
          </div>
        );
      case 'marketCap':
        return (
          <div className="flex flex-col">
            <p className="text-sm font-normal">{formatMarketCap(stock.marketCap)}</p>
          </div>
        );
      case 'price':
        return (
          <div className="flex flex-col">
            <p className="text-sm font-normal">{formatPrice(stock.price)}</p>
          </div>
        );
      case 'changesPercentage':
        return (
          <div className="flex flex-col items-center">
            <p
              className={`text-sm font-normal ${
                stock.changesPercentage >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {formatChangePercentage(stock.changesPercentage)}
            </p>
          </div>
        );
      case 'monthlyChangesPercentage':
        return (
          <div className="flex flex-col items-center">
            <p
              className={`text-sm font-normal ${
                stock.monthlyChangesPercentage >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {formatChangePercentage(stock.monthlyChangesPercentage)}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // Show loading state
  if (loading && stocks.length === 0) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-background p-4 mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <Card>
              <CardBody className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-lg">Loading stock data...</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-background p-4 mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <Card>
              <CardBody className="flex flex-col items-center gap-4">
                <p className="text-lg text-danger">Error loading stock data</p>
                <p className="text-sm text-default-500">{error}</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-background p-4 mt-32">
      <div className="max-w-7xl mx-auto">
        <div
          className="flex flex-col items-center"
          style={{ marginTop: '2px', marginBottom: '60px', gap: '30px' }}
        >
          <Input
            placeholder="Enter your country"
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            variant="bordered"
            color="default"
            size="md"
            radius="lg"
            isDisabled
            classNames={{
              input: 'px-3',
              inputWrapper: 'w-[319px] h-[38px] mx-auto',
            }}
          />
          <Input
            placeholder="Enter symbol or name"
            value={symbolFilter}
            onChange={e => setSymbolFilter(e.target.value)}
            variant="bordered"
            color="default"
            size="md"
            radius="lg"
            classNames={{
              input: 'px-3',
              inputWrapper: 'w-[319px] h-[38px] mx-auto',
            }}
          />
        </div>

        <Table aria-label="Stock market data table" className="min-h-[400px]">
          <TableHeader>
            {columns.map(column => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            ))}
          </TableHeader>
          <TableBody
            emptyContent={loading ? 'Loading...' : 'No stocks found'}
            loadingContent={<Spinner />}
            isLoading={loading}
          >
            {stocks.map((stock, index) => (
              <TableRow key={stock.symbol}>
                {columnKey => (
                  <TableCell>
                    {renderCell(stock, columnKey as string, (page - 1) * ITEMS_PER_PAGE + index)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-center mt-6">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            showShadow
            color="primary"
          />
        </div>
      </div>
    </div>
  );
}
