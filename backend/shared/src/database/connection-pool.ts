import { createClient, SupabaseClient } from "@supabase/supabase-js";
import logger from "../utils/logger";

/**
 * Hospital Management System Database Connection Pool
 * Provides optimized database connections with healthcare-specific features
 */
// DEPRECATION GUARD: Legacy 'public' schema pool is forbidden in schema-per-service
if (
  process.env.NODE_ENV !== "test" &&
  process.env.ALLOW_PUBLIC_POOL !== "true"
) {
  throw new Error(
    "Deprecated: backend/shared/src/database/connection-pool.ts (schema 'public') bị chặn. Hãy dùng '@hospital/shared/dist/database/schema-aware-connection-pool'."
  );
}

interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  healthCheckInterval: number;
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  totalQueries: number;
  averageQueryTime: number;
  errorCount: number;
}

class DatabaseConnectionPool {
  private clients: SupabaseClient[] = [];
  private activeClients: Set<SupabaseClient> = new Set();
  private config: PoolConfig;
  private metrics: ConnectionMetrics;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      maxConnections: config.maxConnections || 20,
      minConnections: config.minConnections || 5,
      acquireTimeoutMillis: config.acquireTimeoutMillis || 30000,
      idleTimeoutMillis: config.idleTimeoutMillis || 300000,
      healthCheckInterval: config.healthCheckInterval || 60000,
    };

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      totalQueries: 0,
      averageQueryTime: 0,
      errorCount: 0,
    };

    this.initializePool();
    this.startHealthCheck();
  }

  private initializePool(): void {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    // Create minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      const client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: "public",
        },
        global: {
          headers: {
            "x-application-name": "hospital-management-system",
          },
        },
      });

      this.clients.push(client);
      this.metrics.totalConnections++;
    }

    this.metrics.idleConnections = this.clients.length;
    logger.info(
      `Database connection pool initialized with ${this.clients.length} connections`
    );
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const client = await this.acquireConnection();
      const { error } = await client.from("profiles").select("count").limit(1);

      if (error) {
        logger.warn("Database health check failed", { error: error.message });
        this.metrics.errorCount++;
      }

      this.releaseConnection(client);
    } catch (error) {
      logger.error("Database health check error", { error });
      this.metrics.errorCount++;
    }
  }

  private async acquireConnection(): Promise<SupabaseClient> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.config.acquireTimeoutMillis) {
      // Find available connection
      const availableClient = this.clients.find(
        (client) => !this.activeClients.has(client)
      );

      if (availableClient) {
        this.activeClients.add(availableClient);
        this.metrics.activeConnections = this.activeClients.size;
        this.metrics.idleConnections =
          this.clients.length - this.activeClients.size;
        return availableClient;
      }

      // Create new connection if under max limit
      if (this.clients.length < this.config.maxConnections) {
        const newClient = this.createNewConnection();
        this.clients.push(newClient);
        this.activeClients.add(newClient);
        this.metrics.totalConnections++;
        this.metrics.activeConnections = this.activeClients.size;
        this.metrics.idleConnections =
          this.clients.length - this.activeClients.size;
        return newClient;
      }

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error("Connection pool timeout: Unable to acquire connection");
  }

  private createNewConnection(): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-application-name": "hospital-management-system",
        },
      },
    });
  }

  private releaseConnection(client: SupabaseClient): void {
    this.activeClients.delete(client);
    this.metrics.activeConnections = this.activeClients.size;
    this.metrics.idleConnections =
      this.clients.length - this.activeClients.size;
  }

  // Public API methods
  async executeQuery<T>(
    queryFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const client = await this.acquireConnection();
    const startTime = Date.now();

    try {
      const result = await queryFn(client);

      // Update metrics
      const queryTime = Date.now() - startTime;
      this.metrics.totalQueries++;
      this.metrics.averageQueryTime =
        (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) +
          queryTime) /
        this.metrics.totalQueries;

      return result;
    } catch (error) {
      this.metrics.errorCount++;
      logger.error("Database query error", {
        error,
        queryTime: Date.now() - startTime,
      });
      throw error;
    } finally {
      this.releaseConnection(client);
    }
  }

  async executeFHIRValidation<T>(
    validationFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return this.executeQuery(validationFn);
  }

  async executeDiagnosisOperation<T>(
    diagnosisFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return this.executeQuery(diagnosisFn);
  }

  async executeBulkOperation<T>(
    bulkFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return this.executeQuery(bulkFn);
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  async close(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Close all connections
    this.clients.length = 0;
    this.activeClients.clear();
    this.metrics.totalConnections = 0;
    this.metrics.activeConnections = 0;
    this.metrics.idleConnections = 0;

    logger.info("Database connection pool closed");
  }
}

// Export singleton instance
export const connectionPool = new DatabaseConnectionPool();

// Export class for custom instances
export { DatabaseConnectionPool };
export type { ConnectionMetrics, PoolConfig };
