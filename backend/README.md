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
│   ├── index.ts          # Main server file
│   └── plugins/
│       └── database.ts   # MongoDB connection plugin
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
└── README.md            # Documentation
```

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
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/audio-form-stock?retryWrites=true&w=majority
PORT=3001
NODE_ENV=development
```

## Next Steps

1. Set up MongoDB Atlas connection
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Test MongoDB connection: `GET /test-mongo`
