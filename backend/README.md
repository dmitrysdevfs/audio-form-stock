# Audio Form Stock Backend

Basic Fastify server for Audio Form Stock application.

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

- `GET /` - Basic hello world response
- `GET /health` - Server health check
- `GET /test-mongo` - Test MongoDB connection

Server runs on port 3001.

## Project Structure

```text
backend/
├── src/
│   ├── index.ts          # Server startup
│   ├── server.ts         # Fastify server configuration
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
- **MongoDB** - Database with @fastify/mongodb plugin
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

# CORS Configuration (optional)
# FRONTEND_URL=https://your-vercel-app.vercel.app
# CORS_ORIGINS=http://localhost:3000,https://preview.vercel.app
```

### CORS Configuration

The server supports flexible CORS configuration through environment variables:

- **`FRONTEND_URL`** - Single production frontend URL
- **`CORS_ORIGINS`** - Multiple origins (comma-separated)
- **Default origins** - `http://localhost:3000`, `http://127.0.0.1:3000` (always included)

## Next Steps

1. Install dependencies: `npm install`
2. Create `.env` file with MongoDB connection
3. Start development server: `npm run dev`
4. Test endpoints: `GET /health`, `GET /test-mongo`
