# Arrow Backend API

Node.js + Express + PostgreSQL + TypeScript backend for the Arrow application.

## Project Structure

```
src/
├── config/              # Configuration files
│   ├── index.ts        # Environment configuration
│   └── database.ts     # PostgreSQL connection setup
├── controllers/        # Request handlers
│   └── healthController.ts
├── services/          # Business logic layer
│   └── baseService.ts
├── routes/            # API route definitions
│   ├── index.ts
│   └── health.ts
├── middleware/        # Express middleware
│   ├── errorHandler.ts      # Global error handling
│   ├── tenantMiddleware.ts  # Multi-tenant support
│   ├── requestLogger.ts     # Request logging
│   └── index.ts
├── utils/             # Utility functions and constants
│   ├── errors.ts      # Custom error classes
│   ├── constants.ts   # Application constants
│   └── index.ts
└── index.ts           # Application entry point
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arrow_db
DB_USER=postgres
DB_PASSWORD=postgres

# API
API_BASE_URL=http://localhost:5000
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### 3. Database Setup

Ensure PostgreSQL is running and create the database:

```sql
CREATE DATABASE arrow_db;
```

### 4. Start Development Server

```bash
npm run dev
```

Server will be available at `http://localhost:5000`

## Available Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run watch` - Watch mode for TypeScript compilation

## Key Features

### Error Handling

- Global error handling middleware
- Custom `AppError` class for consistent error responses
- 404 Not Found handling
- Detailed error logging

### Multi-Tenant Support

- Tenant middleware to extract tenant information
- Support for X-Tenant-ID header
- Extensible for subdomain-based tenancy

### Security

- Helmet.js for HTTP headers
- CORS configuration
- Environment-based configuration

### Logging

- Request logger middleware
- Execution time tracking
- Error logging

## API Endpoints

- `GET /` - Server health and info
- `GET /health` - Health check
- `GET /api/v1/health` - Versioned health check

## Architecture

### Middleware Layer

Processes all requests in order:

1. Security (Helmet)
2. CORS
3. Body parsing
4. Request logging
5. Tenant extraction
6. Route handling
7. Error handling

### Service Layer

- Handles all business logic
- Interacts with database
- Called by controllers
- Re-usable across endpoints

### Database Layer

- Connection pooling with `pg` library
- Singleton pattern for database instance
- Graceful connection closing

## Next Steps

1. Create database migrations
2. Add authentication middleware
3. Implement entity services and controllers
4. Add database schema and models
5. Configure production deployment
