/**
 * DATABASE LAYER USAGE EXAMPLES
 *
 * This file demonstrates how to use the PostgreSQL connection layer
 * with transaction support and multi-tenant capabilities.
 *
 * DO NOT USE THIS FILE IN PRODUCTION - It's for reference only.
 */

import database from "./database";
import {
  buildSelectQuery,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  buildPaginatedQuery,
  buildCountQuery,
  hasRows,
} from "./db-helpers";
import { transactionManager } from "./tenant-transaction";

// ============================================================================
// EXAMPLE 1: Simple Query
// ============================================================================
export async function exampleSimpleQuery() {
  try {
    const result = await database.query("SELECT * FROM users LIMIT 5");
    console.log("Users:", result.rows);
  } catch (error) {
    console.error("Query failed:", error);
  }
}

// ============================================================================
// EXAMPLE 2: Query with Tenant Context
// ============================================================================
export async function exampleTenantQuery(tenantId: string) {
  try {
    // Safe query builder that includes tenant_id filter
    const { text, params } = buildSelectQuery(
      "users",
      ["id", "name", "email"],
      undefined, // conditions
      tenantId,
    );

    const result = await database.query(text, params);
    console.log("Tenant users:", result.rows);
  } catch (error) {
    console.error("Tenant query failed:", error);
  }
}

// ============================================================================
// EXAMPLE 3: Insert with Tenant
// ============================================================================
export async function exampleInsertWithTenant(
  tenantId: string,
  userData: { name: string; email: string },
) {
  try {
    const { text, params } = buildInsertQuery("users", userData, tenantId);

    const result = await database.query(text, params);
    console.log("Created user:", result.rows[0]);
  } catch (error) {
    console.error("Insert failed:", error);
  }
}

// ============================================================================
// EXAMPLE 4: Update with Tenant
// ============================================================================
export async function exampleUpdateWithTenant(
  tenantId: string,
  userId: string,
  updates: { name?: string; email?: string },
) {
  try {
    const { text, params } = buildUpdateQuery(
      "users",
      updates,
      { id: userId }, // conditions
      tenantId,
    );

    const result = await database.query(text, params);
    console.log("Updated user:", result.rows[0]);
  } catch (error) {
    console.error("Update failed:", error);
  }
}

// ============================================================================
// EXAMPLE 5: Delete with Tenant (Safe - requires explicit conditions)
// ============================================================================
export async function exampleDeleteWithTenant(
  tenantId: string,
  userId: string,
) {
  try {
    const { text, params } = buildDeleteQuery(
      "users",
      { id: userId }, // conditions are required for safety
      tenantId,
    );

    const result = await database.query(text, params);
    console.log("Deleted user:", result.rows[0]);
  } catch (error) {
    console.error("Delete failed:", error);
  }
}

// ============================================================================
// EXAMPLE 6: Pagination
// ============================================================================
export async function examplePagination(tenantId: string, page: number = 1) {
  try {
    // Get count
    const { text: countText, params: countParams } = buildCountQuery(
      "users",
      undefined,
      tenantId,
    );
    const countResult = await database.query(countText, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const { text: queryText, params: queryParams } = buildPaginatedQuery(
      "users",
      ["id", "name", "email", "created_at"],
      page,
      10, // limit per page
      tenantId,
      "created_at DESC", // order by
    );
    const result = await database.query(queryText, queryParams);

    console.log("Pagination:", {
      page,
      limit: 10,
      total,
      results: result.rows,
    });
  } catch (error) {
    console.error("Pagination failed:", error);
  }
}

// ============================================================================
// EXAMPLE 7: Transaction - Multiple operations
// ============================================================================
export async function exampleTransactionMultipleOps(tenantId: string) {
  try {
    const result = await database.withTransaction(async (client) => {
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (tenant_id, name, email) 
         VALUES ($1, $2, $3) RETURNING id`,
        [tenantId, "John Doe", "john@example.com"],
      );
      const userId = userResult.rows[0].id;

      // Create profile
      await client.query(
        `INSERT INTO profiles (tenant_id, user_id, bio) 
         VALUES ($1, $2, $3)`,
        [tenantId, userId, "Software Engineer"],
      );

      // Create settings
      await client.query(
        `INSERT INTO user_settings (tenant_id, user_id, notifications_enabled) 
         VALUES ($1, $2, $3)`,
        [tenantId, userId, true],
      );

      return { userId };
    }, tenantId);

    console.log("Transaction completed:", result);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

// ============================================================================
// EXAMPLE 8: Transaction with Savepoints (Nested)
// ============================================================================
export async function exampleTransactionWithSavepoints(tenantId: string) {
  try {
    const result = await database.withTransaction(async (client) => {
      // Main operation
      const userResult = await client.query(
        `INSERT INTO users (tenant_id, name, email) 
         VALUES ($1, $2, $3) RETURNING id`,
        [tenantId, "Jane Doe", "jane@example.com"],
      );
      const userId = userResult.rows[0].id;

      // Create savepoint
      await client.query("SAVEPOINT sp1");

      try {
        // Try to create profile
        await client.query(
          `INSERT INTO profiles (tenant_id, user_id, bio) 
           VALUES ($1, $2, $3)`,
          [tenantId, userId, "Designer"],
        );
      } catch (error) {
        // Rollback to savepoint if profile creation fails
        await client.query("ROLLBACK TO SAVEPOINT sp1");
        console.log("Profile creation failed, rolled back to savepoint");
      }

      return { userId };
    }, tenantId);

    console.log("Transaction with savepoints completed:", result);
  } catch (error) {
    console.error("Transaction with savepoints failed:", error);
  }
}

// ============================================================================
// EXAMPLE 9: Batch Operations
// ============================================================================
export async function exampleBatchOperations(tenantId: string) {
  try {
    const results = await database.batch(
      [
        {
          text: `INSERT INTO users (tenant_id, name, email) 
                 VALUES ($1, $2, $3) RETURNING id`,
          params: [tenantId, "User 1", "user1@example.com"],
        },
        {
          text: `INSERT INTO users (tenant_id, name, email) 
                 VALUES ($1, $2, $3) RETURNING id`,
          params: [tenantId, "User 2", "user2@example.com"],
        },
        {
          text: `INSERT INTO users (tenant_id, name, email) 
                 VALUES ($1, $2, $3) RETURNING id`,
          params: [tenantId, "User 3", "user3@example.com"],
        },
      ],
      tenantId,
    );

    console.log(
      "Batch operations completed:",
      results.map((r) => r.rows[0]),
    );
  } catch (error) {
    console.error("Batch operations failed:", error);
  }
}

// ============================================================================
// EXAMPLE 10: Check Database Connection
// ============================================================================
export async function exampleCheckConnection() {
  const isConnected = database.isConnected();
  console.log("Database connected:", isConnected);

  if (isConnected) {
    const stats = database.getPoolStats();
    console.log("Pool statistics:", stats);
  }
}

// ============================================================================
// BEST PRACTICES
// ============================================================================
/*
1. ALWAYS use parameterized queries ($1, $2, etc.)
   ✅ GOOD: database.query("SELECT * FROM users WHERE id = $1", [userId])
   ❌ BAD:  database.query(`SELECT * FROM users WHERE id = '${userId}'`)

2. ALWAYS include tenant_id filter for multi-tenant queries
   ✅ GOOD: buildSelectQuery("users", {}, undefined, tenantId)
   ❌ BAD:  buildSelectQuery("users") // Might expose other tenant's data

3. USE transactions for multiple related operations
   ✅ GOOD: database.withTransaction(async (client) => { ... })
   ❌ BAD:  await db.query(...); await db.query(...); // Not atomic

4. USE savepoints for nested error handling
   ✅ GOOD: Create savepoint → Try → Rollback to savepoint on error
   ❌ BAD:  Trust that all operations succeed

5. HANDLE connection errors gracefully
   ✅ GOOD: Try-catch around database operations
   ❌ BAD:  Let errors bubble up without context

6. MONITOR pool statistics
   ✅ GOOD: Periodically check database.getPoolStats()
   ❌ BAD:  Assume pool is always healthy

7. CLOSE connections properly
   ✅ GOOD: Database.getClient() within transaction/callback
   ❌ BAD:  Keep clients open indefinitely
*/
