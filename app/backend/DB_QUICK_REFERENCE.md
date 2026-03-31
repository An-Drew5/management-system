# Database Layer Quick Reference

## Files Created

```
src/config/
├── database.ts              # Main database class with connection pooling
├── db-helpers.ts            # Query builder utilities
├── tenant-transaction.ts    # Multi-tenant transaction management
├── db.ts                    # Central export barrel file
└── db-usage-examples.ts     # Usage examples and best practices

DATABASE_LAYER.md            # Complete documentation
```

## Quick Start

### 1. Import Database

```typescript
import { database } from "@config/db";
// or
import database from "@config/database";
```

### 2. Simple Query

```typescript
const result = await database.query("SELECT * FROM users WHERE id = $1", [
  userId,
]);
console.log(result.rows);
```

### 3. Transaction (Multiple Operations)

```typescript
await database.withTransaction(async (client) => {
  // Auto-commits on success, auto-rollbacks on error
  await client.query("INSERT INTO users ...", [data]);
  await client.query("INSERT INTO profiles ...", [data]);
}, tenantId);
```

### 4. Multi-Tenant Query

```typescript
import { buildSelectQuery } from "@config/db";

const { text, params } = buildSelectQuery(
  "users",
  ["id", "name"],
  undefined,
  tenantId, // Automatically filters by tenant
);

const result = await database.query(text, params);
```

### 5. Batch Operations

```typescript
await database.batch(
  [
    { text: "INSERT INTO users ...", params: [data1] },
    { text: "INSERT INTO orders ...", params: [data2] },
  ],
  tenantId,
);
```

## Connection Pool

- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds
- **Auto-reuses connections**: Yes
- **Auto-closes idle connections**: Yes

## Query Builders

All automatically include tenant_id filtering when provided:

```typescript
import {
  buildSelectQuery, // SELECT * FROM table WHERE ...
  buildInsertQuery, // INSERT INTO table ...
  buildUpdateQuery, // UPDATE table SET ... WHERE ...
  buildDeleteQuery, // DELETE FROM table WHERE ... (requires conditions)
  buildPaginatedQuery, // SELECT with LIMIT/OFFSET
  buildCountQuery, // COUNT(*)
  buildWhereClause, // Build WHERE clause only
} from "@config/db";
```

## Multi-Tenant Transactions

```typescript
import { transactionManager } from "@config/db";

const tx = await transactionManager.beginTransaction(client, tenantId);
try {
  await tx.query("INSERT INTO users ...");
  await transactionManager.commitTransaction(tx);
} catch (error) {
  await transactionManager.rollbackTransaction(tx);
}
```

## Savepoints (Nested Transactions)

```typescript
import { createSavepoint, rollbackToSavepoint } from "@config/db";

await database.withTransaction(async (client) => {
  await client.query("INSERT INTO users ...");

  await createSavepoint(client, "sp1");
  try {
    await client.query("INSERT INTO profiles ..."); // May fail
  } catch {
    await rollbackToSavepoint(client, "sp1"); // Only rollback to savepoint
  }
}, tenantId);
```

## Tenant Context

Set PostgreSQL session variable for Row Level Security:

```typescript
// Automatically happens in withTransaction
await client.query("SET app.current_tenant_id TO $1", [tenantId]);

// Use in RLS policies:
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

## Error Handling

All database operations include automatic error logging:

```typescript
try {
  await database.query(text, params);
} catch (error) {
  // Error already logged with context
  // Handle or re-throw
}
```

Transactions automatically rollback on error:

```typescript
try {
  await database.withTransaction(async (client) => {
    // ... operations
    throw new Error("Oops!");
    // Automatic rollback happens here
  });
} catch (error) {
  console.error("Transaction failed and was rolled back");
}
```

## Monitoring

```typescript
if (database.isConnected()) {
  const { total, idle, waiting } = database.getPoolStats();
  console.log(`Connections: ${idle}/${total} idle, ${waiting} waiting`);
}
```

## Safe Patterns

✅ Parameterized queries with $1, $2:

```typescript
database.query("SELECT * FROM users WHERE id = $1", [userId]);
```

✅ Always include tenant_id:

```typescript
buildSelectQuery("users", undefined, undefined, tenantId);
```

✅ Use transactions for related operations:

```typescript
database.withTransaction(async (client) => { ... })
```

❌ String concatenation:

```typescript
// DON'T: SQL injection risk
database.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

❌ Forget tenant_id:

```typescript
// DON'T: Data leakage to other tenants
database.query("SELECT * FROM users");
```

## Usage Examples

See `src/config/db-usage-examples.ts` for 10 complete examples:

1. Simple queries
2. Tenant-aware queries
3. Insert with tenant
4. Update with tenant
5. Delete with tenant (safe)
6. Pagination
7. Transactions with multiple operations
8. Transactions with savepoints
9. Batch operations
10. Connection monitoring

## Feature Summary

| Feature            | Supported | Notes                      |
| ------------------ | --------- | -------------------------- |
| Connection pooling | ✅        | 20 connections max         |
| Transactions       | ✅        | Auto commit/rollback       |
| Savepoints         | ✅        | Nested transactions        |
| Multi-tenant       | ✅        | Automatic tenant filtering |
| Query builders     | ✅        | For common operations      |
| Batch operations   | ✅        | In single transaction      |
| Pagination         | ✅        | With count support         |
| Error handling     | ✅        | Auto logging               |
| Is monitoring      | ✅        | Pool statistics            |
| Graceful shutdown  | ✅        | Close connections          |

## Next Steps

1. **Set up PostgreSQL**:

   ```bash
   # Install PostgreSQL and create database
   CREATE DATABASE arrow_db;
   ```

2. **Create tables** with tenant_id:

   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     tenant_id UUID NOT NULL,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     FOREIGN KEY (tenant_id) REFERENCES tenants(id)
   );
   ```

3. **Create indexes**:

   ```sql
   CREATE INDEX idx_users_tenant_id ON users(tenant_id);
   CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
   ```

4. **Enable Row Level Security** (optional but recommended):

   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON users
     USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
   ```

5. **Start using in services/controllers**:

   ```typescript
   import { buildSelectQuery, database } from "@config/db";

   export class UserService {
     async getUsersByTenant(tenantId: string) {
       const { text, params } = buildSelectQuery(
         "users",
         ["id", "name", "email"],
         undefined,
         tenantId,
       );
       const result = await database.query(text, params);
       return result.rows;
     }
   }
   ```

## Documentation

- **[DATABASE_LAYER.md](./DATABASE_LAYER.md)** - Complete technical documentation
- **[db-usage-examples.ts](./src/config/db-usage-examples.ts)** - 10 usage examples
