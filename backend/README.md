# Audio Form Stock Backend

Fastify server with MongoDB integration, OpenAI Realtime API, and Polygon.io stock data processing for Audio Form Stock application.

## Installation

```bash
npm install
```

## Development

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Code Quality

```bash
npm run lint        # Check code quality
npm run lint:fix    # Auto-fix issues
```

## API Endpoints

### General

- `GET /` - Basic hello world response
- `GET /health` - Server health check
- `GET /test-mongo` - Test MongoDB connection

### Form API

- `GET /api/form` - Get registered users
- `POST /api/form` - User registration with MongoDB storage

### Stock API

- `GET /api/stocks` - Get all stocks with filtering and pagination
- `GET /api/stocks/health` - Stock service health check
- `GET /api/stocks/countries` - Get unique countries
- `GET /api/stocks/indexes` - Get unique indexes
- `GET /api/stocks/:symbol` - Get stock by symbol
- `POST /api/stocks/update` - Update stocks (GitHub Actions)
- `GET /api/stocks/test-polygon` - Test Polygon.io integration

### Audio API

- `WebSocket /api/audio/conversation` - Real-time AI conversation
- `POST /api/audio/message` - Send audio data for processing
- `GET /api/audio/status` - Check OpenAI service status
- `GET /api/audio/ephemeral-key` - Generate OpenAI ephemeral key

Server runs on port 3001.

## Project Structure

```text
backend/
├── src/
│   ├── index.ts          # Server startup
│   ├── server.ts         # Fastify server configuration
│   ├── modules/
│   │   ├── audio/        # OpenAI Realtime API integration
│   │   │   ├── controllers/audioController.ts
│   │   │   ├── services/openaiService.ts
│   │   │   ├── routes/audioRoutes.ts
│   │   │   └── types/index.ts
│   │   ├── form/         # User registration module
│   │   │   ├── controllers/formController.ts
│   │   │   ├── services/userService.ts
│   │   │   ├── routes/formRoutes.ts
│   │   │   └── validators/formSchema.ts
│   │   └── stock/        # Stock data processing
│   │       ├── controllers/stockController.ts
│   │       ├── services/polygonService.ts
│   │       ├── services/stockService.ts
│   │       ├── routes/stockRoutes.ts
│   │       └── validators/stockSchema.ts
│   ├── routes/
│   │   ├── index.ts      # Main routes registration
│   │   ├── health.ts     # Health check routes
│   │   └── testMongo.ts  # MongoDB test routes
│   ├── utils/
│   │   └── cors.ts       # CORS configuration utilities
│   └── plugins/
│       └── database.ts   # MongoDB connection plugin
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
└── README.md            # Documentation
```

## Architecture

This project follows **Single Responsibility Principle** with clean separation of concerns:

- **`index.ts`** - Only server startup logic
- **`server.ts`** - Fastify instance configuration and plugin registration
- **`routes/`** - Modular route handlers, each with single responsibility
- **`plugins/`** - Reusable Fastify plugins (database, etc.)

### Benefits

- **Testability** - Each module can be tested independently
- **Scalability** - Easy to add new routes and features
- **Maintainability** - Clear separation makes code easier to understand
- **Reusability** - Server builder can be used in tests

## Tech Stack

- **Fastify v5.6.0** - Fast and low overhead web framework
- **MongoDB Atlas** - Cloud database with @fastify/mongodb plugin
- **OpenAI Realtime API** - AI conversation processing with WebSocket
- **Polygon.io API** - Stock market data (End-of-day, free tier)
- **WebSocket** - Real-time communication for audio streaming
- **TypeScript** - Type safety and better development experience
- **ESM Modules** - Modern JavaScript module system
- **ESLint** - Code quality and consistency
- **Pino-pretty** - Beautiful logging in development

## Environment Setup

Create a `.env` file in the backend directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/audio-form-stock?retryWrites=true&w=majority

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI API (for Audio module)
OPENAI_API_KEY=your_openai_api_key_here

# Polygon.io API (for Stock module)
POLYGON_API_KEY=your_polygon_api_key_here

# CORS Configuration (optional)
# FRONTEND_URL=https://your-vercel-app.vercel.app
# CORS_ORIGINS=http://localhost:3000,https://preview.vercel.app
```

### CORS Configuration

The server supports flexible CORS configuration through environment variables:

- **`FRONTEND_URL`** - Single production frontend URL
- **`CORS_ORIGINS`** - Multiple origins (comma-separated)
- **Default origins** - `http://localhost:3000`, `http://127.0.0.1:3000` (always included)

## Features

### Audio Module

- Real-time AI conversation with OpenAI Realtime API
- WebSocket communication for audio streaming
- PCM16 audio processing for OpenAI compatibility
- Ephemeral key generation for secure connections

### Form Module

- User registration with email and password validation
- MongoDB storage for user data
- Multi-step form processing
- Error handling and validation

### Stock Module

- Polygon.io API integration for stock data
- End-of-day data processing (free tier compatible)
- Advanced filtering and pagination
- Automated daily updates via GitHub Actions
- Rate limiting and error handling

## Deployment

Deploy easily on Render.com:

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `POLYGON_API_KEY` - Your Polygon.io API key
   - `NODE_ENV=production`
3. Deploy automatically on git push

## Next Steps

1. Install dependencies: `npm install`
2. Create `.env` file with required API keys
3. Start development server: `npm run dev`
4. Test endpoints: `GET /health`, `GET /test-mongo`
5. Test modules: `GET /api/stocks/health`, `GET /api/audio/status`

## License

This repository was created as part of a test assignment.  
Not intended for public reuse or redistribution.
