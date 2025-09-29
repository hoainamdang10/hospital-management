/**
 * Query Base Classes - CQRS Pattern
 * Base classes for implementing query side of CQRS
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Performance Optimization, HIPAA
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Base interface for all queries
 */
export interface IQuery<TResult = any> {
  readonly queryId: string;
  readonly queryType: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly correlationId?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * Abstract base class for all queries
 */
export abstract class Query<TResult = any> implements IQuery<TResult> {
  public readonly queryId: string;
  public readonly queryType: string;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly correlationId?: string;
  public readonly metadata?: Record<string, any>;

  protected constructor(
    queryType: string,
    userId?: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ) {
    this.queryId = uuidv4();
    this.queryType = queryType;
    this.timestamp = new Date();
    this.userId = userId;
    this.correlationId = correlationId;
    this.metadata = metadata;
  }

  /**
   * Validate query parameters
   */
  public abstract validate(): Promise<ValidationResult>;

  /**
   * Get query parameters for serialization
   */
  public abstract getParameters(): any;

  /**
   * Check if query accesses PHI (Protected Health Information)
   */
  public abstract accessesPHI(): boolean;

  /**
   * Get patient ID if query is related to patient data
   */
  public abstract getPatientId(): string | null;

  /**
   * Get query description for audit logs
   */
  public abstract getDescription(): string;

  /**
   * Get cache key for query result caching
   */
  public abstract getCacheKey(): string | null;

  /**
   * Get cache TTL in seconds
   */
  public getCacheTTL(): number {
    return 300; // 5 minutes default
  }
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Query handler interface
 */
export interface IQueryHandler<TQuery extends IQuery<TResult>, TResult = any> {
  handle(query: TQuery): Promise<TResult>;
}

/**
 * Query result interface
 */
export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  totalCount?: number;
  pageInfo?: PageInfo;
  metadata?: Record<string, any>;
  executionTime?: number;
  fromCache?: boolean;
}

/**
 * Pagination info interface
 */
export interface PageInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Abstract base class for query handlers
 */
export abstract class QueryHandler<TQuery extends IQuery<TResult>, TResult = any> 
  implements IQueryHandler<TQuery, TResult> {
  
  /**
   * Handle the query
   */
  public async handle(query: TQuery): Promise<TResult> {
    const startTime = Date.now();

    // Validate query
    const validationResult = await query.validate();
    if (!validationResult.isValid) {
      throw new QueryValidationError(
        `Query validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
        validationResult.errors
      );
    }

    // Log query execution for audit
    await this.logQueryExecution(query);

    // Check cache first
    const cacheKey = query.getCacheKey();
    if (cacheKey) {
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        await this.logQueryCacheHit(query);
        return cachedResult;
      }
    }

    // Execute query
    try {
      const result = await this.executeQuery(query);
      
      // Cache result if applicable
      if (cacheKey) {
        await this.cacheResult(cacheKey, result, query.getCacheTTL());
      }
      
      // Log successful execution
      const executionTime = Date.now() - startTime;
      await this.logQuerySuccess(query, executionTime);
      
      return result;
    } catch (error) {
      // Log query failure
      const executionTime = Date.now() - startTime;
      await this.logQueryFailure(query, error, executionTime);
      throw error;
    }
  }

  /**
   * Execute the actual query logic
   */
  protected abstract executeQuery(query: TQuery): Promise<TResult>;

  /**
   * Get cached result
   */
  protected async getCachedResult(cacheKey: string): Promise<TResult | null> {
    // Implementation would use Redis or other cache
    return null;
  }

  /**
   * Cache query result
   */
  protected async cacheResult(cacheKey: string, result: TResult, ttl: number): Promise<void> {
    // Implementation would use Redis or other cache
  }

  /**
   * Log query execution for audit trail
   */
  protected async logQueryExecution(query: TQuery): Promise<void> {
    console.log(`Executing query: ${query.queryType}`, {
      queryId: query.queryId,
      userId: query.userId,
      timestamp: query.timestamp,
      accessesPHI: query.accessesPHI(),
      patientId: query.getPatientId(),
    });
  }

  /**
   * Log cache hit
   */
  protected async logQueryCacheHit(query: TQuery): Promise<void> {
    console.log(`Query cache hit: ${query.queryType}`, {
      queryId: query.queryId,
      userId: query.userId,
    });
  }

  /**
   * Log successful query execution
   */
  protected async logQuerySuccess(query: TQuery, executionTime: number): Promise<void> {
    console.log(`Query executed successfully: ${query.queryType}`, {
      queryId: query.queryId,
      userId: query.userId,
      executionTime: `${executionTime}ms`,
    });
  }

  /**
   * Log query execution failure
   */
  protected async logQueryFailure(query: TQuery, error: any, executionTime: number): Promise<void> {
    console.error(`Query execution failed: ${query.queryType}`, {
      queryId: query.queryId,
      userId: query.userId,
      executionTime: `${executionTime}ms`,
      error: error.message,
    });
  }
}

/**
 * Query validation error
 */
export class QueryValidationError extends Error {
  public readonly validationErrors: ValidationError[];

  constructor(message: string, validationErrors: ValidationError[]) {
    super(message);
    this.name = 'QueryValidationError';
    this.validationErrors = validationErrors;
  }
}

/**
 * Query execution error
 */
export class QueryExecutionError extends Error {
  public readonly queryId: string;
  public readonly queryType: string;

  constructor(message: string, queryId: string, queryType: string) {
    super(message);
    this.name = 'QueryExecutionError';
    this.queryId = queryId;
    this.queryType = queryType;
  }
}

/**
 * Query bus interface
 */
export interface IQueryBus {
  send<TResult = any>(query: IQuery<TResult>): Promise<TResult>;
  register<TQuery extends IQuery<TResult>, TResult = any>(
    queryType: string,
    handler: IQueryHandler<TQuery, TResult>
  ): void;
}

/**
 * Simple in-memory query bus implementation
 */
export class QueryBus implements IQueryBus {
  private handlers = new Map<string, IQueryHandler<any, any>>();

  /**
   * Send query to appropriate handler
   */
  public async send<TResult = any>(query: IQuery<TResult>): Promise<TResult> {
    const handler = this.handlers.get(query.queryType);
    if (!handler) {
      throw new Error(`No handler registered for query type: ${query.queryType}`);
    }

    return await handler.handle(query);
  }

  /**
   * Register query handler
   */
  public register<TQuery extends IQuery<TResult>, TResult = any>(
    queryType: string,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    if (this.handlers.has(queryType)) {
      throw new Error(`Handler already registered for query type: ${queryType}`);
    }

    this.handlers.set(queryType, handler);
  }

  /**
   * Get registered handler types
   */
  public getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if handler is registered
   */
  public hasHandler(queryType: string): boolean {
    return this.handlers.has(queryType);
  }
}
