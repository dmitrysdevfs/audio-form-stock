# Stock Module

Module for working with stock data, includes API endpoints, services and validators.

## Structure

```stock/
├── controllers/
│   └── stockController.ts    # HTTP controllers
├── services/
│   └── stockService.ts       # Business logic
├── routes/
│   └── stockRoutes.ts        # Routes
├── validators/
│   └── stockSchema.ts        # Request validation
├── types/
│   └── index.ts              # TypeScript types
└── index.ts                  # Main module file
```

## API Endpoints

### GET /api/stocks

Get list of stocks with filtering and pagination

**Query parameters:**

- `country` - filter by country
- `indexes` - filter by indexes (NASDAQ, S&P500, DOW)
- `search` - search by symbol or name
- `sortBy` - sorting (symbol, name, marketCap, price, changes, lastUpdated)
- `sortOrder` - sort order (asc, desc)
- `page` - page number (default 1)
- `limit` - records per page (default 50, max 100, recommended 10 for frontend)

**Example:**

```GET /api/stocks?country=USA&indexes=NASDAQ&search=AAPL&sortBy=marketCap&sortOrder=desc&page=1&limit=20
```

### GET /api/stocks/:symbol

Get stock by symbol

**Example:**

```GET /api/stocks/AAPL
```

### GET /api/stocks/health

Check system status

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "lastUpdate": "2024-01-01T00:00:00.000Z",
  "totalStocks": 330
}
```

### GET /api/stocks/countries

Get list of unique countries

### GET /api/stocks/indexes

Get list of unique indexes

### POST /api/stocks/update

Update stock data (for GitHub Actions)

**Body:**

```json
{
  "batchNumber": 1,
  "totalBatches": 7,
  "forceUpdate": false
}
```

## Test Endpoints

### POST /test-stock

Add test stock data

### GET /test-stock

Get all stocks

### GET /test-stock/health

Check system status

## Data Model

```typescript
interface StockData {
  symbol: string;           // Stock symbol (AAPL)
  name: string;            // Company name
  country: string;         // Country
  marketCap: number;       // Market capitalization
  price: number;           // Current price
  changes: number;         // Daily change in absolute numbers
  changesPercentage: number; // Daily change in percentage
  monthlyChanges: number;  // Monthly change in absolute numbers
  monthlyChangesPercentage: number; // Monthly change in percentage
  indexes: string[];       // Indexes (NASDAQ, S&P500, DOW)
  lastUpdated: Date;       // Last update time
}
```

## Next Steps

1. **Polygon.io Integration** - connect to Polygon.io API
2. **Data Processing Pipeline** - batch data processing
3. **GitHub Actions Automation** - automatic updates
4. **Frontend Integration** - connect frontend
5. **Production Optimization** - production optimization

## Notes

- All endpoints support CORS
- Request validation through JSON Schema
- Error logging through Fastify logger
- Support for pagination and filtering
- Ready for Polygon.io API integration
