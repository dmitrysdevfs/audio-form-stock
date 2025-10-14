# Audio Form Stock - Frontend

A modern NextJS application for audio-based stock market analysis with form handling and data visualization.

## Features

- **Next.js 15.5.4** - Latest stable version with App Router
- **NextUI v2.6.11** - Beautiful React components
- **Tailwind CSS v3.4.0** - Utility-first CSS framework
- **TypeScript** - Type safety out of the box
- **Framer Motion** - Smooth animations and transitions
- **Multi-step Forms** - Form handling with validation and backend integration
- **Stock Market Data** - Real-time stock data with filtering and pagination
- **Audio Processing** - Real-time AI conversation with OpenAI Realtime API

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
│   │   └── page.tsx               # Real-time AI conversation page
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
- `backend/` — Fastify server with MongoDB integration

Each part is deployed independently: frontend on Vercel, backend on Render.

## Current Development Status

### Registration Form (`/form`)

- Multi-step form with email and password fields using NextUI components
- Form validation and animated transitions with Framer Motion
- **Backend Integration:** Real-time data submission to Fastify server with MongoDB storage
- **Features:** Email validation, password confirmation, error handling

### Stock Data (`/stock`)

- Table with filtering by country and stock symbol
- Displays company name, symbol, market cap, price, and daily changes
- **Backend Integration:** Real API integration with fallback to mock data
- **Features:** Pagination, sorting, real-time data updates, responsive design

### Audio Processing (`/audio`)

- **Real-time AI Conversation:** OpenAI Realtime API integration with WebSocket communication
- **Audio Processing:** PCM16 mono 24kHz conversion for OpenAI compatibility
- **Features:** Microphone access, real-time text responses, auto-scrolling conversation display
- **UI Components:** NextUI Textarea with smooth auto-scroll for AI responses

### Backend Integration Status

- **MongoDB Integration:** Active data storage for forms and stock data
- **API Integration:** Polygon.io for stock data, OpenAI for audio processing
- **WebSocket Communication:** Real-time audio and text streaming
- **Data Processing:** Automated daily stock updates via GitHub Actions

## Environment Variables

| Variable                    | Description                          |
|-----------------------------|--------------------------------------|
| `NEXT_PUBLIC_API_URL`       | URL to backend API (e.g. Render)     |
| `NEXT_PUBLIC_BACKEND_URL`   | WebSocket URL for audio conversations |

### Local Development Setup

Create a `.env.local` file in the frontend directory:

```bash
# For local development
NEXT_PUBLIC_BACKEND_URL=ws://localhost:3001
```

### Production Deployment

For production deployment on Vercel, set the environment variable:

```bash
NEXT_PUBLIC_BACKEND_URL=wss://your-backend-url.onrender.com
```

## Available Routes

- **`/`** - Home dashboard with navigation
- **`/form`** - Multi-step form with validation
- **`/stock`** - Stock market data with filtering
- **`/audio`** - Real-time AI conversation with OpenAI Realtime API

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
