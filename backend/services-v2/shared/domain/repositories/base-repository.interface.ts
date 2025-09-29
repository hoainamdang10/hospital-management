/**
 * Base Repository Interface - Clean Architecture + DDD
 * Enhanced repository pattern with healthcare-specific features
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Repository Pattern
 */

import { AggregateRoot } from '../base/aggregate-root';

/**
 * Base repository interface for all aggregates
 */
export interface IBaseRepository<T extends AggregateRoot<any>> {
  /**
   * Find aggregate by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find multiple aggregates by IDs
   */
  findByIds(ids: string[]): Promise<T[]>;

  /**
   * Save aggregate (create or update)
   */
  save(aggregate: T): Promise<void>;

  /**
   * Save multiple aggregates
   */
  saveMany(aggregates: T[]): Promise<void>;

  /**
   * Delete aggregate by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if aggregate exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get aggregate count
   */
  count(criteria?: RepositoryCriteria): Promise<number>;

  /**
   * Find aggregates with pagination
   */
  findWithPagination(
    criteria?: RepositoryCriteria,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<T>>;
}

/**
 * Healthcare repository interface
 */
export interface IHealthcareRepository<T extends AggregateRoot<any>> extends IBaseRepository<T> {
  /**
   * Find aggregates by patient ID
   */
  findByPatientId(patientId: string): Promise<T[]>;

  /**
   * Find aggregates by user ID (for audit)
   */
  findByUserId(userId: string): Promise<T[]>;

  /**
   * Find aggregates within date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<T[]>;

  /**
   * Get HIPAA audit trail for aggregate
   */
  getAuditTrail(aggregateId: string): Promise<AuditTrailEntry[]>;

  /**
   * Anonymize aggregate data
   */
  anonymize(aggregateId: string): Promise<void>;
}

/**
 * Repository criteria for filtering
 */
export interface RepositoryCriteria {
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Audit trail entry
 */
export interface AuditTrailEntry {
  id: string;
  aggregateId: string;
  action: string;
  userId: string;
  timestamp: Date;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Repository transaction interface
 */
export interface IRepositoryTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

/**
 * Unit of Work interface
 */
export interface IUnitOfWork {
  /**
   * Begin transaction
   */
  begin(): Promise<IRepositoryTransaction>;

  /**
   * Register aggregate for save
   */
  registerNew<T extends AggregateRoot<any>>(aggregate: T): void;

  /**
   * Register aggregate for update
   */
  registerDirty<T extends AggregateRoot<any>>(aggregate: T): void;

  /**
   * Register aggregate for deletion
   */
  registerDeleted<T extends AggregateRoot<any>>(aggregate: T): void;

  /**
   * Commit all changes
   */
  commit(): Promise<void>;

  /**
   * Rollback all changes
   */
  rollback(): Promise<void>;

  /**
   * Check if unit of work has changes
   */
  hasChanges(): boolean;
}

/**
 * Base repository implementation
 */
export abstract class BaseRepository<T extends AggregateRoot<any>> implements IHealthcareRepository<T> {
  protected constructor(
    protected readonly tableName: string,
    protected readonly schemaName: string
  ) {}

  abstract findById(id: string): Promise<T | null>;
  abstract findByIds(ids: string[]): Promise<T[]>;
  abstract save(aggregate: T): Promise<void>;
  abstract saveMany(aggregates: T[]): Promise<void>;
  abstract delete(id: string): Promise<void>;

  async exists(id: string): Promise<boolean> {
    const aggregate = await this.findById(id);
    return aggregate !== null;
  }

  async count(criteria?: RepositoryCriteria): Promise<number> {
    // Implementation depends on database provider
    throw new Error('count method must be implemented by subclasses');
  }

  async findWithPagination(
    criteria?: RepositoryCriteria,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    // Implementation depends on database provider
    throw new Error('findWithPagination method must be implemented by subclasses');
  }

  async findByPatientId(patientId: string): Promise<T[]> {
    // Implementation depends on aggregate type
    throw new Error('findByPatientId method must be implemented by subclasses');
  }

  async findByUserId(userId: string): Promise<T[]> {
    // Implementation depends on aggregate type
    throw new Error('findByUserId method must be implemented by subclasses');
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<T[]> {
    // Implementation depends on aggregate type
    throw new Error('findByDateRange method must be implemented by subclasses');
  }

  async getAuditTrail(aggregateId: string): Promise<AuditTrailEntry[]> {
    // Implementation depends on audit system
    throw new Error('getAuditTrail method must be implemented by subclasses');
  }

  async anonymize(aggregateId: string): Promise<void> {
    // Implementation depends on aggregate type
    throw new Error('anonymize method must be implemented by subclasses');
  }

  /**
   * Convert aggregate to persistence format
   */
  protected abstract toPersistence(aggregate: T): any;

  /**
   * Convert persistence data to aggregate
   */
  protected abstract fromPersistence(data: any): T;

  /**
   * Validate aggregate before save
   */
  protected validateAggregate(aggregate: T): void {
    aggregate.validateInvariants();
  }

  /**
   * Log HIPAA audit event
   */
  protected async logHIPAAAudit(
    action: string,
    aggregateId: string,
    userId?: string,
    changes?: Record<string, any>
  ): Promise<void> {
    // Implementation would log to HIPAA audit system
    console.log('HIPAA Audit:', {
      action,
      aggregateId,
      userId,
      changes,
      timestamp: new Date()
    });
  }
}

/**
 * Repository factory interface
 */
export interface IRepositoryFactory {
  create<T extends AggregateRoot<any>>(
    aggregateType: new (...args: any[]) => T
  ): IHealthcareRepository<T>;
}

/**
 * Repository registry for managing repositories
 */
export interface IRepositoryRegistry {
  register<T extends AggregateRoot<any>>(
    aggregateType: new (...args: any[]) => T,
    repository: IHealthcareRepository<T>
  ): void;

  get<T extends AggregateRoot<any>>(
    aggregateType: new (...args: any[]) => T
  ): IHealthcareRepository<T>;

  has<T extends AggregateRoot<any>>(
    aggregateType: new (...args: any[]) => T
  ): boolean;
}

/**
 * Simple repository registry implementation
 */
export class RepositoryRegistry implements IRepositoryRegistry {
  private repositories = new Map<Function, IHealthcareRepository<any>>();

  register<T extends AggregateRoot<any>>(
    aggregateType: new (...args: any[]) => T,
    repository: IHealthcareRepository<T>
  ): void {
    this.repositories.set(aggregateType, repository);
  }

  get<T extends AggregateRoot<any>>(
    aggregateType: new (...args: any[]) => T
  ): IHealthcareRepository<T> {
    const repository = this.repositories.get(aggregateType);
    if (!repository) {
      throw new Error(`Repository not found for aggregate: ${aggregateType.name}`);
    }
    return repository;
  }

  has<T extends AggregateRoot<any>>(
    aggregateType: new (...args: any[]) => T
  ): boolean {
    return this.repositories.has(aggregateType);
  }
}
