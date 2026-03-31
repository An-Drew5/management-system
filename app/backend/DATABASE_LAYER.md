# PostgreSQL Connection Layer Documentation

## Overview

The database layer provides a production-ready PostgreSQL connection manager with transaction support, connection pooling, and multi-tenant capabilities.

## Architecture

```
database.ts                 # Main database class with connection pool
├── Connection pooling      # pg library Pool management
├── Transaction support     # automatic COMMIT/ROLLBACK
├── Tenant context          # SET app.current_tenant_id
└── Batch operations        # Multiple queries in single transaction

db-helpers.ts              # Query builder utilities
├── buildSelectQuery()      # Parameterized SELECT queries
├── buildInsertQuery()      # Parameterized INSERT with tenant
├── buildUpdateQuery()      # Parameterized UPDATE with tenant
├── buildDeleteQuery()      # Parameterized DELETE (safe - requires conditions)
├── buildPaginatedQuery()   # SELECT with LIMIT/OFFSET
├── buildCountQuery()       # COUNT queries
├── buildWhereClause()      # WHERE clause builder
└── Savepoint utilities     # Nested transaction support

tenant-transaction.ts      # Multi-tenant transaction management
├── TenantContext           # Tenant information holder
├── TenantTransaction       # Transaction wrapper with tenant
└── MultiTenantTransactionManager  # Manage transactions with context

db.ts                      # Central export/barrel file
```

## Connection Pool Configuration

```typescript
{
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 2000  // Timeout for new connections
}
```

## Core Features

### 1. Simple Query Execution

```typescript
import { database } from "@config/db";

const result = await database.query("SELECT * FROM users WHERE id = $1", [
  userId,
]);

const users = result.rows;
```

### 2. Transaction Support

```typescript
const result = await database.withTransaction(async (client) => {
  // Multiple operations
  await client.query("INSERT INTO users ...", [data]);
  await client.query("INSERT INTO profiles ...", [data]);

  // Automatic rollback on error
  return { success: true };
}, tenantId);
```

### 3. Multi-Tenant Query Building

```typescript
import { buildSelectQuery } from "@config/db-helpers";

const { text, params } = buildSelectQuery(
  "users",
  ["id", "name", "email"],
  { status: "active" },
  tenantId, // Automatically adds tenant_id filter
);

const result = await database.query(text, params);
```

### 4. Batch Operations

```typescript
const results = await database.batch(
  [
    { text: "INSERT INTO users ...", params: [data1] },
    { text: "INSERT INTO orders ...", params: [data2] },
    { text: "INSERT INTO items ...", params: [data3] },
  ],
  tenantId, // All in one transaction with tenant context
);
```

### 5. Pagination

```typescript
import { buildPaginatedQuery, buildCountQuery } from "@config/db-helpers";

// Get total count
const { text: countText, params: countParams } = buildCountQuery(
  "users",
  undefined,
  tenantId,
);
const countResult = await database.query(countText, countParams);
const total = parseInt(countResult.rows[0].count);

// Get paginated results
const { text, params } = buildPaginatedQuery(
  "users",
  ["id", "name"],
  page,
  pageSize,
  tenantId,
  "created_at DESC",
);
const result = await database.query(text, params);
```

### 6. Savepoints (Nested Transactions)

```typescript
import { createSavepoint, rollbackToSavepoint } from "@config/db-helpers";

await database.withTransaction(async (client) => {
  await client.query("INSERT INTO users ...");

  // Create savepoint
  await createSavepoint(client, "sp_profile");

  try {
    await client.query("INSERT INTO profiles ...");
  } catch (error) {
    // Rollback only to savepoint, not entire transaction
    await rollbackToSavepoint(client, "sp_profile");
  }
}, tenantId);
```

## Query Building Examples

### SELECT

```typescript
import { buildSelectQuery } from "@config/db-helpers";

const { text, params } = buildSelectQuery(
  "users",
  ["id", "name", "email"],
  { status: "active" },
  tenantId,
);

// Generated SQL:
// SELECT id, name, email FROM users
// WHERE tenant_id = $1 AND status = $2
```

### INSERT

```typescript
import { buildInsertQuery } from "@config/db-helpers";

const { text, params } = buildInsertQuery(
  "users",
  { name: "John", email: "john@example.com" },
  tenantId,
);

// Generated SQL:
// INSERT INTO users (tenant_id, name, email)
// VALUES ($1, $2, $3)
// RETURNING *
```

### UPDATE

```typescript
import { buildUpdateQuery } from "@config/db-helpers";

const { text, params } = buildUpdateQuery(
  "users",
  { name: "Jane" },
  { id: userId },
  tenantId,
);

// Generated SQL:
// UPDATE users SET name = $1
// WHERE tenant_id = $2 AND id = $3
// RETURNING *
```

### DELETE

```typescript
import { buildDeleteQuery } from "@config/db-helpers";

const { text, params } = buildDeleteQuery(
  "users",
  { id: userId }, // Conditions are REQUIRED for safety
  tenantId,
);

// Generated SQL:
// DELETE FROM users
// WHERE tenant_id = $1 AND id = $2
// RETURNING *
```

## Multi-Tenant Implementation

### Database Setup

```sql
-- Add tenant_id to all tables
ALTER TABLE users ADD COLUMN tenant_id UUID NOT NULL;

-- Create indexes for tenant queries
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- Create RLS policy (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Usage Pattern

```typescript
// Every query includes tenant_id automatically
const { text, params } = buildSelectQuery(
  "users",
  undefined,
  undefined,
  tenantId, // Always include!
);

// This generates:
// SELECT * FROM users WHERE tenant_id = $1
// Prevents data leakage to other tenants
```

## Transaction with Multi-Tenant Context

```typescript
const result = await database.withTransaction(
  async (client) => {
    // This client has tenant context set
    // app.current_tenant_id is set to the provided tenantId

    const userResult = await client.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      ["John", "john@example.com"],
    );

    return { userId: userResult.rows[0].id };
  },
  "tenant_123", // Tenant ID - automatically managed
);
```

## Monitoring

### Check Connection Status

```typescript
import { database } from "@config/db";

if (database.isConnected()) {
  const stats = database.getPoolStats();
  console.log("Pool stats:", {
    total: stats.total, // Total connections
    idle: stats.idle, // Available connections
    waiting: stats.waiting, // Waiting for connection
  });
}
```

## Error Handling

All database operations are wrapped with error logging:

```typescript
try {
  const result = await database.query(text, params);
} catch (error) {
  // Error logged automatically with context
  // Re-throw for higher-level handling
  throw error;
}
```

Transaction errors automatically trigger rollback:

```typescript
try {
  await database.withTransaction(async (client) => {
    await client.query("...");
    throw new Error("Something failed");
    // Automatic rollback happens here
  });
} catch (error) {
  // Transaction was rolled back
  console.error("Transaction failed:", error);
}
```

## Best Practices

### ✅ DO

- Use parameterized queries ($1, $2, etc.)
- Always include tenant_id in multi-tenant queries
- Use transactions for related operations
- Use savepoints for nested error handling
- Handle connection errors gracefully
- Monitor pool statistics periodically
- Use the query builders for common operations

### ❌ DON'T

- String concatenation in SQL queries (SQL injection risk)
- Skip tenant_id filters (data leakage)
- Keep database clients indefinitely
- Ignore transaction rollback errors
- Create new connection pools per request
- Trust that all operations succeed without error handling

## Performance Considerations

### Connection Pooling

The connection pool manages connections efficiently:

- Reuses connections across requests
- Closes idle connections after 30 seconds
- Limits total connections to 20
- Times out new connections after 2 seconds

### Query Optimization

- Use column selection instead of `SELECT *`
- Add indexes on frequently queried columns (tenant_id, IDs)
- Use pagination for large result sets
- Batch related operations in transactions

### Tenant Filtering

Always include tenant_id in WHERE clauses:

- Prevents accidental data access to other tenants
- Utilizes composite indexes (tenant_id, other_id)
- Improves query performance with proper indexing

## Migration from Old Connection Pattern

```typescript
// OLD - Don't use
const client = await db.getClient();
await client.query("...");
client.release();

// NEW - Use transactions instead
await database.withTransaction(async (client) => {
  await client.query("...");
  // Auto-commit on success, auto-rollback on error
});
```

## API Reference

See `src/config/db-usage-examples.ts` for complete usage examples of all functions.
