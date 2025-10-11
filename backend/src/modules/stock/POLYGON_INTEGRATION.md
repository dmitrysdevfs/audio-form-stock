# Polygon.io Integration

## Overview

This module provides integration with Polygon.io API for fetching real-time stock data using the official `@polygon.io/client-js` client. It supports the free tier with 5 calls per minute rate limiting.

## Features

- ✅ **Official Client**: Uses `@polygon.io/client-js` for better reliability
- ✅ Ticker details fetching
- ✅ Daily stock data retrieval
- ✅ Batch processing with rate limiting
- ✅ Country determination
- ✅ Index classification
- ✅ Data conversion to internal format
- ✅ Error handling and retry logic

## API Endpoints

### Stock API

- `GET /api/stocks` - Get all stocks with filtering
- `GET /api/stocks/health` - Health check
- `GET /api/stocks/countries` - Get unique countries
- `GET /api/stocks/indexes` - Get unique indexes
- `GET /api/stocks/:symbol` - Get stock by symbol
- `POST /api/stocks/update` - Update stocks (for GitHub Actions)
- `GET /api/stocks/test-polygon` - Test Polygon.io integration

### Test Endpoints

- `GET /test-polygon/test-connection` - Test API connectivity
- `GET /test-polygon/test-ticker/:symbol` - Test ticker details
- `GET /test-polygon/test-daily/:symbol` - Test daily data
- `GET /test-polygon/test-conversion/:symbol` - Test full conversion

### Official Client Integration

- `GET /test-polygon-official/test-official-client` - Test official client directly
- `GET /test-polygon-official/test-rate-limiting` - Test rate limiting behavior

## Environment Variables

```bash
POLYGON_API_KEY=your_polygon_api_key_here
```

## Rate Limiting

- Free tier: 5 calls per minute
- Built-in 12-second delay between requests
- Batch processing with automatic delays

## Data Flow

1. **Ticker Details** → Polygon.io `/v3/reference/tickers/{symbol}`
2. **Daily Data** → Polygon.io `/v1/open-close/{symbol}/{date}`
3. **Data Conversion** → Internal `StockData` format
4. **Database Storage** → MongoDB collection

## Supported Stock Lists

- NASDAQ 100 (100 companies)
- S&P 500 Top 200 (200 companies)
- Dow Jones 30 (30 companies)
- **Total: 330 companies** (deduplicated)

## Country Mapping

- `us` → United States
- `ca` → Canada
- `eu` → United Kingdom
- Default → Unknown

## Index Classification

- **Large Cap**: Market cap > $10B
- **Mid Cap**: Market cap > $2B
- **Small Cap**: Market cap ≤ $2B

## Usage Examples

### Test API Connection

```bash
curl http://localhost:3001/test-polygon/test-connection
```

### Test Ticker Details

```bash
curl http://localhost:3001/test-polygon/test-ticker/AAPL
```

### Test Daily Data

```bash
curl http://localhost:3001/test-polygon/test-daily/AAPL
```

### Test Full Conversion

```bash
curl http://localhost:3001/test-polygon/test-conversion/AAPL
```

### Test Official Client

```bash
curl http://localhost:3001/test-polygon-official/test-official-client
```

### Test Rate Limiting

```bash
curl http://localhost:3001/test-polygon-official/test-rate-limiting
```

### Update Stocks (Batch Processing)

```bash
curl -X POST http://localhost:3001/api/stocks/update \
  -H "Content-Type: application/json" \
  -d '{"batchNumber": 1, "totalBatches": 7, "forceUpdate": false}'
```

## Error Handling

- API rate limit exceeded
- Invalid ticker symbols
- Network connectivity issues
- Data parsing errors
- Database connection failures

## Monitoring

- Health check endpoint
- Error logging
- Batch processing status
- Rate limiting compliance

## Official Client Test Endpoints

### Available Methods Test

```bash
GET /test-polygon-official/test-available-methods
```

**Response:**

```json
{
  "success": true,
  "message": "Available methods in Polygon.io client",
  "data": {
    "methods": ["listTickers", "getTicker", "getStocksOpenClose", ...],
    "totalMethods": 150,
    "sampleMethods": ["listTickers", "getTicker", "getStocksOpenClose", ...]
  }
}
```

### Official Client Test

```bash
GET /test-polygon-official/test-official-client
```

**Response:**

```json
{
  "success": true,
  "message": "Official Polygon.io client test successful",
  "data": {
    "tickers": {
      "count": 0,
      "sample": []
    },
    "tickerDetails": {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "market": "stocks",
      "locale": "us"
    },
    "dailyData": {
      "symbol": "AAPL",
      "open": 254.94,
      "close": 245.27,
      "high": 256.38,
      "low": 244,
      "volume": 61999098,
      "date": "2025-10-10"
    }
  }
}
```

### Rate Limiting Test

```bash
GET /test-polygon-official/test-rate-limiting
```

**Response:**

```json
{
  "success": true,
  "message": "Rate limiting test completed",
  "data": {
    "results": [
      {
        "request": 1,
        "duration": 1200,
        "resultsCount": 0
      }
    ]
  }
}
```

## Next Steps

1. **GitHub Actions Integration** - Automated daily updates
2. **Caching Strategy** - Redis for performance
3. **Monitoring** - Alerts and metrics
4. **Data Validation** - Quality checks
5. **Backup Strategy** - Data redundancy
