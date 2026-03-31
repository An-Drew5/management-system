import { PoolClient } from "pg";

/**
 * Tenant context for multi-tenant operations
 * Stores tenant information for the current request/transaction
 */
export interface TenantContext {
  tenantId: string;
  tenantName?: string;
  metadata?: Record<string, any>;
}

/**
 * Request-level tenant context manager
 * Uses local storage or AsyncLocalStorage patterns
 */
class TenantContextManager {
  private contexts: Map<string, TenantContext> = new Map();
  private contextId: number = 0;

  /**
   * Create and register a new tenant context
   */
  createContext(
    tenantId: string,
    name?: string,
    metadata?: Record<string, any>,
  ): string {
    const id = `context_${++this.contextId}_${Date.now()}`;
    this.contexts.set(id, {
      tenantId,
      tenantName: name,
      metadata,
    });
    return id;
  }

  /**
   * Get tenant context by ID
   */
  getContext(contextId: string): TenantContext | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Update tenant context
   */
  updateContext(contextId: string, updates: Partial<TenantContext>): boolean {
    const context = this.contexts.get(contextId);
    if (!context) return false;

    Object.assign(context, updates);
    return true;
  }

  /**
   * Delete/cleanup tenant context
   */
  deleteContext(contextId: string): boolean {
    return this.contexts.delete(contextId);
  }

  /**
   * Get all active contexts (for monitoring)
   */
  getActiveContexts(): Record<string, TenantContext> {
    const result: Record<string, TenantContext> = {};
    this.contexts.forEach((context, id) => {
      result[id] = context;
    });
    return result;
  }
}

/**
 * Transaction context for tenant-aware transactions
 */
export class TenantTransaction {
  private client: PoolClient;
  private tenantId: string;
  private savepoints: string[] = [];

  constructor(client: PoolClient, tenantId: string) {
    this.client = client;
    this.tenantId = tenantId;
  }

  /**
   * Get the database client
   */
  getClient(): PoolClient {
    return this.client;
  }

  /**
   * Get the tenant ID for this transaction
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Execute a query within this transaction
   */
  async query(text: string, params?: any[]): Promise<any> {
    return await this.client.query(text, params);
  }

  /**
   * Create a savepoint for nested operations
   */
  async createSavepoint(name: string): Promise<void> {
    await this.client.query(`SAVEPOINT ${name}`);
    this.savepoints.push(name);
  }

  /**
   * Rollback to a savepoint
   */
  async rollbackToSavepoint(name: string): Promise<void> {
    await this.client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    // Remove this and all subsequent savepoints from the stack
    const index = this.savepoints.indexOf(name);
    if (index !== -1) {
      this.savepoints.splice(index);
    }
  }

  /**
   * Release a savepoint
   */
  async releaseSavepoint(name: string): Promise<void> {
    await this.client.query(`RELEASE SAVEPOINT ${name}`);
    // Remove from stack
    const index = this.savepoints.indexOf(name);
    if (index !== -1) {
      this.savepoints.splice(index, 1);
    }
  }

  /**
   * Get active savepoints
   */
  getSavepoints(): string[] {
    return [...this.savepoints];
  }
}

/**
 * Multi-tenant transaction manager
 * Handles transactions with automatic tenant context
 */
export class MultiTenantTransactionManager {
  private contextManager = new TenantContextManager();

  /**
   * Begin a multi-tenant transaction
   */
  async beginTransaction(
    client: PoolClient,
    tenantId: string,
  ): Promise<TenantTransaction> {
    // Begin transaction
    await client.query("BEGIN");

    // Set tenant context
    await client.query("SET app.current_tenant_id TO $1", [tenantId]);

    return new TenantTransaction(client, tenantId);
  }

  /**
   * Commit transaction
   */
  async commitTransaction(transaction: TenantTransaction): Promise<void> {
    await transaction.getClient().query("COMMIT");
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(transaction: TenantTransaction): Promise<void> {
    try {
      await transaction.getClient().query("ROLLBACK");
    } catch (error) {
      console.error("Error rolling back transaction:", error);
    }
  }

  /**
   * Execute a callback within a transaction
   */
  async withTransaction<T>(
    client: PoolClient,
    tenantId: string,
    callback: (tx: TenantTransaction) => Promise<T>,
  ): Promise<T> {
    const transaction = await this.beginTransaction(client, tenantId);

    try {
      const result = await callback(transaction);
      await this.commitTransaction(transaction);
      return result;
    } catch (error) {
      await this.rollbackTransaction(transaction);
      throw error;
    }
  }

  /**
   * Get the context manager
   */
  getContextManager(): TenantContextManager {
    return this.contextManager;
  }
}

// Export singleton instance
export const tenantContextManager = new TenantContextManager();
export const transactionManager = new MultiTenantTransactionManager();
