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

Server runs on port 3001.

## Project Structure

```text
backend/
├── src/
│   └── index.ts          # Main server file
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
└── README.md            # Documentation
```

## Tech Stack

- **Fastify v5.6.0** - Fast and low overhead web framework
- **TypeScript** - Type safety and better development experience
- **ESM Modules** - Modern JavaScript module system
- **ESLint** - Code quality and consistency

## Next Steps

1. Add MongoDB Atlas connection
2. Create user email routes
3. Add data validation
4. Integrate with frontend
