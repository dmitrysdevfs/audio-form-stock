'use client';

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@nextui-org/react';
import { useState } from 'react';
import { MOCK_STOCKS_DATA, type Stock } from '../api/MOCK_STOCKS_DATA';
import { formatMarketCap, formatPrice, formatChangePercentage } from '../utils';

const columns = [
  { key: 'index', label: '#' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'name', label: 'Name' },
  { key: 'marketCap', label: 'Capitalization' },
  { key: 'price', label: 'Price' },
  { key: 'changesPercentage', label: 'Price change per day' },
  { key: 'monthlyChangesPercentage', label: 'Price change per month' },
];

export default function StockPage() {
  const [stocks] = useState<Stock[]>(MOCK_STOCKS_DATA);

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

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-background p-4 mt-48">
      <div className="max-w-7xl mx-auto">
        <Table aria-label="Stock market data table" className="min-h-[400px]">
          <TableHeader>
            {columns.map(column => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="No stocks found">
            {stocks.map((stock, index) => (
              <TableRow key={stock.id}>
                {columnKey => (
                  <TableCell>{renderCell(stock, columnKey as string, index)}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
