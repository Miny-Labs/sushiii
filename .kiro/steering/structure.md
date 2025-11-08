---
inclusion: always
---

# Project Structure & Organization

## Monorepo Layout

The project follows a pnpm workspace structure with clear separation of concerns:

```
sushiii/
├── api/                    # Main TypeScript API server
├── app/                    # Next.js frontend application
├── metagraph/              # Scala blockchain metagraph
├── sdk/                    # Client SDKs
│   ├── browser/           # Browser SDK
│   └── node/              # Node.js SDK
├── verifier/              # Proof verification utilities
├── lib/                   # Shared utilities
├── docs/                  # Documentation
├── scripts/               # Deployment and utility scripts
└── infrastructure/        # Docker and deployment configs
```

## API Structure (`api/`)

### Source Organization
```
api/src/
├── auth/                  # Authentication & authorization
│   ├── middleware/        # Auth middleware (authenticate, authorize)
│   └── authentication.service.ts
├── services/              # Business logic layer
│   ├── consents/         # Consent management
│   ├── policies/         # Policy management
│   ├── tenants/          # Multi-tenancy
│   ├── proofs/           # Proof bundle generation
│   ├── rbac/             # Role-based access control
│   └── users/            # User management
├── repositories/          # Data access layer
├── routes/               # Express route handlers
├── middleware/           # Express middleware
├── db/                   # Database utilities
├── cache/                # Redis caching
├── types/                # TypeScript type definitions
└── __tests__/            # Test suites
```

### Key Conventions
- **Service Layer**: Business logic in `services/` with clear separation by domain
- **Repository Pattern**: Data access abstracted in `repositories/`
- **Middleware**: Reusable Express middleware in `middleware/`
- **Multi-tenancy**: All data operations include tenant isolation
- **Event Sourcing**: Events stored in `event_log` table for audit trail

## Metagraph Structure (`metagraph/`)

### Module Organization
```
metagraph/modules/
├── shared/               # Common data types and validations
│   └── src/main/scala/com/sushiii/shared_data/
│       ├── types/        # ConsentEvent, PolicyVersion
│       └── validations/  # Input validation logic
├── data_l1/             # Data Application Layer
│   └── src/main/scala/com/sushiii/data_l1/
│       └── DataApplicationL1Service.scala
└── l0/                  # Consensus Layer
    └── src/main/scala/com/sushiii/l0/
        └── Main.scala
```

### Key Conventions
- **Package Structure**: `com.sushiii.{module}` namespace
- **Shared Types**: Common data structures in `shared` module
- **Layer Separation**: L0 (consensus) and L1 (data application) layers
- **Validation**: Input validation at L1 before consensus

## Database Schema Organization

### Core Entity Groups
- **Tenancy**: `tenants`, `tenant_quotas`, `usage_metrics`
- **Policies**: `policies`, `policy_versions`, `policy_compliance`
- **Consents**: `consents`, `consent_purposes`, `consent_conditions`
- **Proofs**: `proof_bundles`, `aggregated_proofs`, `zk_proofs`
- **Users & RBAC**: `users`, `roles`, `permissions`, `user_roles`
- **Audit**: `audit_logs`, `event_log`, `snapshots`

### Naming Conventions
- **Tables**: Snake_case plural nouns (e.g., `policy_versions`)
- **Columns**: Snake_case with descriptive names
- **Foreign Keys**: `{entity}_id` pattern (e.g., `tenant_id`)
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`
- **UUIDs**: Primary keys use `gen_random_uuid()` function

## Testing Structure

### Test Organization
```
api/src/
├── __tests__/            # Integration and E2E tests
│   ├── integration/      # Database integration tests
│   └── e2e/             # End-to-end API tests
├── services/
│   └── {service}/__tests__/  # Unit tests co-located with services
└── test/
    ├── helpers/          # Test utilities and factories
    └── setup.ts         # Global test configuration
```

### Test Conventions
- **Co-location**: Unit tests in `__tests__/` folders next to source
- **Test Helpers**: Shared utilities in `test/helpers/`
- **Factories**: Data factories for consistent test data
- **Mocking**: Mock external dependencies (Redis, blockchain)

## Configuration Management

### Environment Files
- `.env.example` - Template with all required variables
- `.env.blockchain` - Blockchain-specific configuration
- `.env.test` - Test environment overrides

### Configuration Patterns
- **Environment Variables**: All configuration via env vars
- **Validation**: Zod schemas for config validation
- **Secrets**: Never commit secrets, use examples only
- **Multi-environment**: Different configs for dev/staging/prod

## File Naming Conventions

### TypeScript Files
- **Services**: `{domain}.service.ts` (e.g., `consent.service.ts`)
- **Repositories**: `{entity}.repository.ts`
- **Middleware**: `{purpose}.middleware.ts`
- **Types**: `index.ts` for type exports
- **Tests**: `{filename}.test.ts` or `{filename}.spec.ts`

### Scala Files
- **PascalCase**: All Scala files use PascalCase
- **Services**: `{Domain}Service.scala`
- **Types**: `{EntityName}.scala`
- **Validators**: `{Entity}Validator.scala`

## Import/Export Patterns

### TypeScript Conventions
- **Barrel Exports**: Use `index.ts` files for clean imports
- **Relative Imports**: Use `@/` alias for src root imports
- **Type Imports**: Use `import type` for type-only imports

### Dependency Management
- **Shared Dependencies**: Common deps in root `package.json`
- **Package-specific**: Unique deps in package `package.json`
- **Version Alignment**: Keep versions consistent across packages

## Documentation Structure

### Documentation Organization
```
docs/
├── architecture.md       # System architecture overview
├── constellation-integration.md  # Blockchain integration
├── hgtp-guide.md        # HGTP protocol guide
├── local-development.md # Development setup
├── snapshot-queries.md  # Database query patterns
└── verification.md      # Proof verification
```

### README Conventions
- **Package READMEs**: Each package has its own README
- **API Documentation**: OpenAPI/Swagger specs
- **Deployment Guides**: Separate deployment documentation
- **Testing Guides**: Test strategy and execution docs