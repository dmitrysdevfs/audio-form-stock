# Audio Form Stock

A full-stack application with three main pages: Audio (real-time AI conversation), Form (user registration), and Stock (financial data visualization).

## Project Overview

This application consists of three core features:

- **Audio Page** - Real-time AI conversation with microphone input
- **Form Page** - User registration with email validation
- **Stock Page** - Financial data table with filtering capabilities

## Current Status

### Completed Features

- **Form Page** - Registration form with NextUI components
- **Stock Page** - Mock data table with country/symbol filters
- **Backend Setup** - Fastify server with MongoDB connection

### In Development

- **Audio Page** - Microphone integration and AI conversation
- **Backend APIs** - User data storage and stock data integration

## Architecture

This is a monorepo containing:

- **Frontend** - Next.js application with NextUI components
- **Backend** - Fastify server with MongoDB integration

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (for backend)

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
├── frontend/          # Next.js application
│   ├── app/          # App Router pages
│   │   ├── audio/    # Audio page (planned)
│   │   ├── form/     # Registration form
│   │   └── stock/    # Stock data table
│   ├── components/   # React components
│   └── package.json  # Frontend dependencies
├── backend/          # Fastify server
│   ├── src/         # Server source code
│   ├── plugins/     # Fastify plugins
│   └── package.json # Backend dependencies
└── package.json     # Root workspace config
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
- **MongoDB** - Database with @fastify/mongodb
- **Pino-pretty** - Beautiful logging
- **TypeScript** - Type safety

## API Endpoints

- `GET /` - Hello world
- `GET /health` - Health check
- `GET /test-mongo` - MongoDB connection test

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

- **Audio Processing** - Real-time AI conversation (planned)
- **Form Management** - User registration and data collection
- **Stock Tracking** - Financial data visualization with filters
- **Real-time Updates** - Live data synchronization (planned)
- **Responsive Design** - Mobile-first approach

## Documentation

- [Frontend README](./frontend/README.md) - Next.js application details
- [Backend README](./backend/README.md) - Fastify server documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This repository was created as part of a test assignment.
Not intended for public reuse or redistribution.
