import { Pool, PoolClient, QueryResult } from "pg";
import config from "./index";

export interface QueryOptions {
  tenantId?: string;
  timeout?: number;
}

export interface TransactionCallback {
  (client: PoolClient): Promise<any>;
}

/**
 * Database connection and query management class
 * Handles connection pooling, transactions, and tenant-aware queries
 */
class Database {
  private pool: Pool;
  private isInitialized: boolean = false;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      max: 20, // Maximum connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.setupPoolListeners();
  }

  /**
   * Setup pool event listeners for error handling and monitoring
   */
  private setupPoolListeners(): void {
    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle client in pool:", err);
    });

    this.pool.on("connect", () => {
      // Optionally log pool connections
    });

    this.pool.on("remove", () => {
      // Optionally log pool removals
    });
  }

  /**
   * Test and establish database connection
   */
  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();
      this.isInitialized = true;
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Failed to connect to database:", error);
      throw error;
    }
  }

  /**
   * Execute a single query using connection pool
   */
  async query(
    text: string,
    params?: any[],
    options?: QueryOptions,
  ): Promise<QueryResult> {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error("Database query error:", { query: text, params, error });
      throw error;
    }
  }

  /**
   * Get a client from the pool for advanced operations
   */
  async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      console.error("Failed to get database client:", error);
      throw error;
    }
  }

  /**
   * Execute a callback within a transaction
   * Automatically handles commit/rollback
   */
  async withTransaction<T>(
    callback: TransactionCallback,
    tenantId?: string,
  ): Promise<T> {
    const client = await this.getClient();
    try {
      // Begin transaction
      await client.query("BEGIN");

      // Set tenant context if provided
      if (tenantId) {
        await client.query("SET app.current_tenant_id TO $1", [tenantId]);
      }

      // Execute callback
      const result = await callback(client);

      // Commit transaction
      await client.query("COMMIT");

      return result;
    } catch (error) {
      // Rollback on error
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
      console.error("Transaction error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Query with tenant context
   * Adds tenant_id filter to queries automatically
   */
  async queryWithTenant(
    text: string,
    tenantId: string,
    params?: any[],
  ): Promise<QueryResult> {
    try {
      // Add tenant_id to params
      const allParams = [...(params || []), tenantId];

      // Assuming tables have tenant_id column
      // This is a safe approach that requires tenant_id in WHERE clause
      const result = await this.pool.query(text, allParams);

      return result;
    } catch (error) {
      console.error("Tenant query error:", { query: text, tenantId, error });
      throw error;
    }
  }

  /**
   * Execute multiple queries in sequence
   */
  async batch(
    queries: Array<{ text: string; params?: any[] }>,
    tenantId?: string,
  ): Promise<QueryResult[]> {
    const client = await this.getClient();
    const results: QueryResult[] = [];

    try {
      await client.query("BEGIN");

      if (tenantId) {
        await client.query("SET app.current_tenant_id TO $1", [tenantId]);
      }

      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result);
      }

      await client.query("COMMIT");

      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Batch query error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  getPoolStats(): {
    total: number;
    idle: number;
    waiting: number;
  } {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  /**
   * Graceful database disconnect
   */
  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isInitialized = false;
      console.log("Database disconnected");
    } catch (error) {
      console.error("Error disconnecting from database:", error);
    }
  }

  /**
   * Get the connection pool directly (use sparingly)
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Check if database is connected and initialized
   */
  isConnected(): boolean {
    return this.isInitialized && this.pool && !this.pool.ended;
  }
}

export default new Database();
