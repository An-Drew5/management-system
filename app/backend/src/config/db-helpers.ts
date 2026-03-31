import { PoolClient, QueryResult } from "pg";

/**
 * Query builder utilities for common database operations
 * Provides safe, reusable patterns for CRUD and tenant-aware queries
 */

/**
 * Build a SELECT query for a single tenant
 */
export function buildSelectQuery(
  table: string,
  columns: string[] = ["*"],
  conditions?: { [key: string]: any },
  tenantId?: string,
): { text: string; params: any[] } {
  let text = `SELECT ${columns.join(", ")} FROM ${table}`;
  const params: any[] = [];
  const whereClauses: string[] = [];

  // Add tenant filter if provided
  if (tenantId) {
    whereClauses.push(`tenant_id = $${params.length + 1}`);
    params.push(tenantId);
  }

  // Add additional conditions
  if (conditions) {
    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined) {
        whereClauses.push(`${key} = $${params.length + 1}`);
        params.push(value);
      }
    }
  }

  if (whereClauses.length > 0) {
    text += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  return { text, params };
}

/**
 * Build an INSERT query with automatic tenant_id
 */
export function buildInsertQuery(
  table: string,
  data: { [key: string]: any },
  tenantId?: string,
): { text: string; params: any[] } {
  const columns: string[] = [];
  const params: any[] = [];
  const placeholders: string[] = [];

  // Add tenant_id if provided
  if (tenantId) {
    columns.push("tenant_id");
    params.push(tenantId);
    placeholders.push(`$${params.length}`);
  }

  // Add data columns
  for (const [key, value] of Object.entries(data)) {
    columns.push(key);
    params.push(value);
    placeholders.push(`$${params.length}`);
  }

  const text = `
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING *
  `;

  return { text, params };
}

/**
 * Build an UPDATE query with automatic tenant_id filter
 */
export function buildUpdateQuery(
  table: string,
  data: { [key: string]: any },
  conditions: { [key: string]: any },
  tenantId?: string,
): { text: string; params: any[] } {
  const params: any[] = [];
  const setClauses: string[] = [];
  const whereClauses: string[] = [];

  // Build SET clause
  for (const [key, value] of Object.entries(data)) {
    setClauses.push(`${key} = $${params.length + 1}`);
    params.push(value);
  }

  // Add tenant filter if provided
  if (tenantId) {
    whereClauses.push(`tenant_id = $${params.length + 1}`);
    params.push(tenantId);
  }

  // Add additional conditions
  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined) {
      whereClauses.push(`${key} = $${params.length + 1}`);
      params.push(value);
    }
  }

  let text = `UPDATE ${table} SET ${setClauses.join(", ")}`;

  if (whereClauses.length > 0) {
    text += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  text += ` RETURNING *`;

  return { text, params };
}

/**
 * Build a DELETE query with automatic tenant_id filter
 */
export function buildDeleteQuery(
  table: string,
  conditions: { [key: string]: any },
  tenantId?: string,
): { text: string; params: any[] } {
  const params: any[] = [];
  const whereClauses: string[] = [];

  // Add tenant filter if provided
  if (tenantId) {
    whereClauses.push(`tenant_id = $${params.length + 1}`);
    params.push(tenantId);
  }

  // Add additional conditions
  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined) {
      whereClauses.push(`${key} = $${params.length + 1}`);
      params.push(value);
    }
  }

  if (whereClauses.length === 0) {
    throw new Error("DELETE query requires at least one condition for safety");
  }

  const text = `DELETE FROM ${table} WHERE ${whereClauses.join(" AND ")} RETURNING *`;

  return { text, params };
}

/**
 * Build a COUNT query for pagination
 */
export function buildCountQuery(
  table: string,
  conditions?: { [key: string]: any },
  tenantId?: string,
): { text: string; params: any[] } {
  let text = `SELECT COUNT(*) as count FROM ${table}`;
  const params: any[] = [];
  const whereClauses: string[] = [];

  // Add tenant filter if provided
  if (tenantId) {
    whereClauses.push(`tenant_id = $${params.length + 1}`);
    params.push(tenantId);
  }

  // Add additional conditions
  if (conditions) {
    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined) {
        whereClauses.push(`${key} = $${params.length + 1}`);
        params.push(value);
      }
    }
  }

  if (whereClauses.length > 0) {
    text += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  return { text, params };
}

/**
 * Build a paginated SELECT query
 */
export function buildPaginatedQuery(
  table: string,
  columns: string[] = ["*"],
  page: number = 1,
  limit: number = 10,
  tenantId?: string,
  orderBy?: string,
): { text: string; params: any[] } {
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const whereClauses: string[] = [];

  let text = `SELECT ${columns.join(", ")} FROM ${table}`;

  // Add tenant filter if provided
  if (tenantId) {
    whereClauses.push(`tenant_id = $${params.length + 1}`);
    params.push(tenantId);
  }

  if (whereClauses.length > 0) {
    text += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  // Add ordering
  if (orderBy) {
    text += ` ORDER BY ${orderBy}`;
  }

  // Add limit and offset
  text += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  return { text, params };
}

/**
 * Build a raw WHERE clause for complex queries
 */
export function buildWhereClause(
  conditions: { [key: string]: any },
  tenantId?: string,
  startParamIndex: number = 1,
): { clause: string; params: any[] } {
  const params: any[] = [];
  const whereClauses: string[] = [];

  // Add tenant filter if provided
  if (tenantId) {
    whereClauses.push(`tenant_id = $${startParamIndex + params.length}`);
    params.push(tenantId);
  }

  // Add additional conditions
  if (conditions) {
    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined) {
        whereClauses.push(`${key} = $${startParamIndex + params.length}`);
        params.push(value);
      }
    }
  }

  const clause = whereClauses.length > 0 ? whereClauses.join(" AND ") : "1=1";

  return { clause, params };
}

/**
 * Execute a row-by-row transformation callback on query results
 */
export function mapRows<T>(result: QueryResult, mapper: (row: any) => T): T[] {
  return result.rows.map(mapper);
}

/**
 * Extract a single value from first row
 */
export function extractScalar(result: QueryResult): any {
  return result.rows[0] ? Object.values(result.rows[0])[0] : null;
}

/**
 * Check if query returned any rows
 */
export function hasRows(result: QueryResult): boolean {
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Create a savepoint for nested transactions
 */
export async function createSavepoint(
  client: PoolClient,
  name: string,
): Promise<void> {
  await client.query(`SAVEPOINT ${name}`);
}

/**
 * Rollback to a savepoint
 */
export async function rollbackToSavepoint(
  client: PoolClient,
  name: string,
): Promise<void> {
  await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
}

/**
 * Release a savepoint
 */
export async function releaseSavepoint(
  client: PoolClient,
  name: string,
): Promise<void> {
  await client.query(`RELEASE SAVEPOINT ${name}`);
}
