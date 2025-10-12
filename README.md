# Audio Form Stock

A full-stack NextJS application with three main features: Audio (AI conversation), Form (user registration), and Stock (financial data visualization).

## Project Overview

This application consists of three core features:

- **Audio Page** - Real-time AI conversation with microphone input and audio visualization
- **Form Page** - User registration with email validation and MongoDB storage
- **Stock Page** - End-of-day financial data from 330+ US companies with advanced filtering

## Current Status

### Completed Features

- **Form Page** - Registration form with NextUI components and MongoDB storage
- **Stock Page** - Complete data pipeline with filtering and pagination
- **Backend API** - Fastify server with MongoDB Atlas connection
- **Stock Data Pipeline** - Polygon.io (End-of-day) → MongoDB → Frontend integration
- **Data Automation** - GitHub Actions for daily stock updates
- **Advanced Filtering** - Symbol and company name search (US companies only)
- **Pagination** - 20 records per page with navigation
- **Default Sorting** - Market capitalization (descending)

### In Development

- **Audio Page** - Real-time AI conversation with microphone integration

### Recent Updates

- **UI Optimization** - Removed health status and refresh buttons
- **Performance** - Disabled auto-refresh (End-of-day data updates once daily)
- **Sorting Fix** - Proper market cap sorting maintained across pages
- **Code Cleanup** - Removed unused components and improved structure

## Architecture

This is a monorepo with the following structure:

- **Frontend** - NextJS 15.5.4 with NextUI v2.6.11 components
- **Backend** - Fastify v5.6.0 server with MongoDB Atlas integration
- **Data Pipeline** - Polygon.io API (End-of-day) → MongoDB → Frontend
- **Automation** - GitHub Actions for daily data updates

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Polygon.io API key (free tier: 5 calls/minute, End-of-day data only)

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Next.js on port 3000
npm run dev:backend   # Fastify on port 3001
```

### Production

```bash
# Build everything
npm run build

# Start backend server
npm start
```

## Project Structure

```text
audio-form-stock/
├── frontend/                    # NextJS application
│   ├── app/                    # App Router pages
│   │   ├── audio/             # Audio AI conversation (planned)
│   │   ├── form/              # User registration
│   │   ├── stock/             # Stock data visualization
│   │   ├── hooks/             # Custom React hooks
│   │   ├── api/               # API service layer
│   │   └── utils/              # Utility functions
│   └── package.json           # Frontend dependencies
├── backend/                    # Fastify server
│   ├── src/                   # Server source code
│   │   ├── modules/stock/     # Stock data module
│   │   ├── modules/form/      # Form data module
│   │   ├── modules/audio/      # Audio processing module (planned)
│   │   ├── plugins/           # Fastify plugins
│   │   └── routes/            # API routes
│   └── package.json           # Backend dependencies
├── .github/workflows/         # GitHub Actions
│   └── update-stocks-optimized-4calls.yml
└── package.json               # Root workspace config
```

## Tech Stack

### Frontend

- **Next.js 15.5.4** - React framework with App Router
- **NextUI v2.6.11** - Modern UI component library
- **Tailwind CSS v3.4.0** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **TypeScript** - Type safety

### Backend

- **Fastify v5.6.0** - Fast web framework
- **MongoDB Atlas** - Cloud database with @fastify/mongodb
- **Polygon.io API** - Stock market data source (End-of-day data only on free tier)
- **OpenAI API** - AI conversation processing (planned for Audio page)
- **WebSocket/WebRTC** - Real-time communication (planned for Audio page)
- **Pino-pretty** - Beautiful logging
- **TypeScript** - Type safety

## API Endpoints

### General

- `GET /` - Hello world
- `GET /health` - Health check
- `GET /test-mongo` - MongoDB connection test

### Form API

- `POST /api/form/register` - User registration endpoint
- `GET /api/form/users` - Get registered users (admin)

### Stock API

- `GET /api/stocks` - Get all stocks with filtering
- `GET /api/stocks/health` - Stock service health check
- `GET /api/stocks/countries` - Get unique countries
- `GET /api/stocks/indexes` - Get unique indexes
- `GET /api/stocks/:symbol` - Get stock by symbol
- `POST /api/stocks/update` - Update stocks (GitHub Actions)

### Audio API (Planned)

- `WebSocket /api/audio/stream` - Real-time audio streaming
- `POST /api/audio/process` - Audio processing with OpenAI

## API Limitations

### Polygon.io Free Tier

- **Rate Limit**: 5 calls per minute
- **Data Type**: End-of-day data only (not real-time)
- **Geographic Coverage**: US companies only
- **Update Frequency**: Once daily via GitHub Actions
- **Data Freshness**: Previous trading day's closing data

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:frontend` | Start only frontend |
| `npm run dev:backend` | Start only backend |
| `npm run build` | Build both applications |
| `npm run install:all` | Install all dependencies |
| `npm start` | Start backend server |

## Environment Setup

### Backend (.env)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/audio-form-stock?retryWrites=true&w=majority
PORT=3001
NODE_ENV=development
```

## Features

### Audio Page (Planned)

- **Real-time AI Conversation** - Microphone input with OpenAI integration
- **Audio Visualization** - Real-time audio waveform display
- **Lottie Animations** - Animated microphone button
- **WebSocket/WebRTC** - Real-time audio streaming

### Form Page

- **User Registration** - Email validation and MongoDB storage
- **Form Validation** - Client and server-side validation
- **Data Persistence** - MongoDB integration for user data

### Stock Page

- **Stock Data Visualization** - 330+ US companies with End-of-day data
- **Advanced Filtering** - Search by symbol and company name (US companies only)
- **Automated Updates** - Daily data refresh via GitHub Actions
- **Responsive Design** - Mobile-first approach with NextUI
- **Performance Optimized** - Efficient data loading and caching
- **Error Handling** - Comprehensive error states and user feedback

## Documentation

- [Frontend README](./frontend/README.md) - NextJS application details
- [Backend README](./backend/README.md) - Fastify server documentation
- [GitHub Actions Workflow](./.github/workflows/update-stocks-optimized-4calls.yml) - Automated data updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This repository was created as part of a test assignment.
Not intended for public reuse or redistribution.
