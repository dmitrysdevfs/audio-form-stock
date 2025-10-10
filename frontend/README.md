# Audio Form Stock - Frontend

A modern NextJS application for audio-based stock market analysis with form handling and data visualization.

## Features

- **Next.js 15.5.4** - Latest stable version with App Router
- **NextUI v2.6.11** - Beautiful React components
- **Tailwind CSS v3.4.0** - Utility-first CSS framework
- **TypeScript** - Type safety out of the box
- **Framer Motion** - Smooth animations and transitions
- **Multi-step Forms** - Form handling with validation
- **Stock Market Data** - Stock data with filtering and pagination
- **Audio Processing** - Microphone access for voice analysis (planned)

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **UI Library:** NextUI v2.6.11 (last stable before HeroUI transition)
- **Styling:** Tailwind CSS v3.4.0
- **Language:** TypeScript
- **Animations:** Framer Motion
- **Code Quality:** ESLint + Prettier

## Quick Start

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd audio-form-stock/frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```text
├── app/
│   ├── api/
│   │   └── MOCK_STOCKS_DATA.ts    # Mock stock market data
│   ├── audio/
│   │   └── page.tsx               # Audio recording page (coming soon)
│   ├── components/
│   │   └── Navigation.tsx         # Navigation component
│   ├── form/
│   │   └── page.tsx               # Multi-step form with validation
│   ├── stock/
│   │   └── page.tsx               # Stock market data table with filtering
│   ├── utils/
│   │   ├── formatters.ts          # Data formatting utilities
│   │   └── index.ts               # Utility exports
│   ├── globals.css                # Global styles with Tailwind
│   ├── layout.tsx                 # Root layout with NextUIProvider
│   ├── page.tsx                   # Home page with navigation
│   └── providers.tsx              # App providers configuration
├── tailwind.config.js             # Tailwind + NextUI configuration
├── postcss.config.js              # PostCSS configuration
└── package.json                   # Dependencies and scripts
```

## Monorepo Context

This frontend is part of a fullstack monorepo [`audio-form-stock`](../README.md), which includes:

- `frontend/` — this Next.js application
- `backend/` — Fastify server with MongoDB integration (planned)

Each part is deployed independently: frontend on Vercel, backend on Render.

## Current Development Status

### Registration Form (`/form`)

- Multi-step form with email field using NextUI components
- Form validation and animated transitions
- **Note:** Data submission to server not yet implemented

### Stock Data (`/stock`)

- Table with filtering by country and stock symbol
- Displays company name, symbol, market cap, price, and daily changes
- **Note:** Currently uses mock data from `app/api/MOCK_STOCKS_DATA.ts`. Real API integration via backend is planned

### Audio Processing (`/audio`)

- Placeholder page for future audio recording functionality
- **Note:** Microphone access and voice processing not yet implemented

### Planned Backend Integration

- MongoDB integration for data storage
- API integration with stock data providers (Alpha Vantage, Polygon.io, Finnhub, Yahoo Finance)
- Data processing and validation

## Environment Variables

| Variable             | Description                          |
|----------------------|--------------------------------------|
| `NEXT_PUBLIC_API_URL` | URL to backend API (e.g. Render)     |

> Define in `.env.local` for local development.

## Available Routes

- **`/`** - Home dashboard with navigation
- **`/form`** - Multi-step form with validation
- **`/stock`** - Stock market data with filtering
- **`/audio`** - Audio recording (planned)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [NextUI Components](https://nextui.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

## Deployment

Deploy easily on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/audio-form-stock)

## License

This repository was created as part of a test assignment.  
Not intended for public reuse or redistribution.
