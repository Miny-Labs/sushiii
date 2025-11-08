---
inclusion: always
---

# Technology Stack

## Build System & Package Management

- **Package Manager**: pnpm (v8.15.0+) with workspace configuration
- **Node.js**: v18.0.0+ required
- **Monorepo Structure**: pnpm workspaces with multiple packages

## API Stack (TypeScript)

### Core Technologies
- **Runtime**: Node.js with ES2022 modules
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+ with ioredis client
- **Testing**: Vitest with 222+ comprehensive tests
- **Authentication**: JWT with bcrypt password hashing

### Key Libraries
- **Validation**: Zod schemas for input validation
- **Cryptography**: @noble/ed25519, @noble/curves for blockchain integration
- **Blockchain**: @stardust-collective/dag4 for Constellation Network
- **Security**: helmet, cors, express-rate-limit
- **Monitoring**: prom-client for Prometheus metrics
- **Logging**: winston for structured logging

## Metagraph Stack (Scala)

### Core Technologies
- **Language**: Scala 2.13.12
- **Build Tool**: sbt 1.9+
- **Framework**: Tessellation SDK (Constellation Network)
- **JVM**: Java 11+ required

### Key Dependencies
- **Constellation**: tessellation-sdk v3.5.6
- **Functional Programming**: cats-core, cats-effect
- **JSON**: circe for serialization
- **Testing**: scalatest

## Database Schema

### PostgreSQL Extensions
- **pgcrypto**: For UUID generation and cryptographic functions

### Key Design Patterns
- **Multi-tenancy**: Tenant isolation with tenant_id foreign keys
- **Event Sourcing**: Complete audit trail in event_log table
- **Soft Deletes**: deleted_at timestamps for data retention
- **Versioning**: Policy versions with effective date ranges

## Development Tools

### Code Quality
- **Linting**: ESLint with recommended rules
- **Formatting**: Prettier with consistent configuration
- **TypeScript**: Strict mode enabled with ES2022 target

### Testing Strategy
- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: Database and external service interactions
- **E2E Tests**: Full API workflow testing
- **Coverage**: 70%+ threshold for lines, functions, branches, statements

## Common Commands

### Development Setup
```bash
# Install dependencies
pnpm install

# Start all services in development
pnpm dev

# Start individual services
pnpm dev:api
pnpm dev:app
```

### API Development
```bash
cd api

# Development server with hot reload
npm run dev

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with test data

# Testing
npm test               # Run all tests
npm run test:unit      # Unit tests only
npm run test:coverage  # With coverage report
npm run test:watch     # Watch mode

# Build and deployment
npm run build          # TypeScript compilation
npm run start          # Production server
```

### Metagraph Development
```bash
cd metagraph

# Local development
./scripts/start-local.sh   # Start local metagraph
./scripts/stop-local.sh    # Stop local metagraph

# Build
sbt clean              # Clean build artifacts
sbt assembly           # Build JAR files
sbt test               # Run Scala tests

# Docker deployment
docker-compose -f docker-compose.integrationnet.yml up -d
```

### Blockchain Integration
```bash
cd api

# Generate DAG4 wallet for blockchain
npm run generate-wallet

# Setup blockchain environment
cp .env.example .env.blockchain
# Edit with wallet credentials and endpoints
```

### Code Quality
```bash
# Format all code
pnpm format

# Lint all packages
pnpm lint

# Type checking
pnpm typecheck
```

## Environment Configuration

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: Authentication secrets
- `PRIVATE_KEY`: DAG4 wallet private key (blockchain)
- `METAGRAPH_L0_URL`, `METAGRAPH_L1_URL`: Metagraph endpoints

### Development vs Production
- Use `.env` files for development
- Use secrets management (AWS Secrets Manager, etc.) for production
- Enable SSL/TLS and proper CORS configuration for production