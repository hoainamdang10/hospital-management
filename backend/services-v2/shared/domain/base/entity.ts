/**
 * Entity Base Class - Clean Architecture + DDD
 * Enhanced version with healthcare-specific features
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract base class for all domain entities
 */
export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  protected constructor(props: T, id?: string) {
    this._id = id || uuidv4();
    this.props = props;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Get entity ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get creation timestamp
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Get last update timestamp
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Update the entity's updated timestamp
   */
  protected touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Check equality with another entity
   */
  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    return this._id === entity._id;
  }

  /**
   * Get entity properties (immutable copy)
   */
  protected getProps(): Readonly<T> {
    return Object.freeze({ ...this.props });
  }

  /**
   * Update entity properties
   */
  protected updateProps(updates: Partial<T>): void {
    this.props = { ...this.props, ...updates };
    this.touch();
  }

  /**
   * Validate entity state
   */
  abstract validate(): void;

  /**
   * Convert entity to plain object for persistence
   */
  abstract toPersistence(): any;

  /**
   * Create entity from persistence data
   */
  static fromPersistence<T>(data: any): Entity<T> {
    throw new Error('fromPersistence method must be implemented by subclasses');
  }
}

/**
 * Healthcare Entity Base Class
 * Specialized entity for healthcare domain
 */
export abstract class HealthcareEntity<T> extends Entity<T> {
  protected constructor(props: T, id?: string) {
    super(props, id);
  }

  /**
   * Check if entity contains PHI (Protected Health Information)
   */
  abstract containsPHI(): boolean;

  /**
   * Get patient ID if this entity is related to a patient
   */
  abstract getPatientId(): string | null;

  /**
   * Get HIPAA compliance level
   */
  getHIPAAComplianceLevel(): HIPAAComplianceLevel {
    return this.containsPHI() ? 'HIGH' : 'LOW';
  }

  /**
   * Healthcare-specific validation
   */
  validate(): void {
    this.validateHealthcareCompliance();
    this.validateBusinessRules();
  }

  /**
   * Validate healthcare compliance requirements
   */
  protected validateHealthcareCompliance(): void {
    if (this.containsPHI()) {
      this.validatePHIHandling();
    }
  }

  /**
   * Validate PHI handling requirements
   */
  protected validatePHIHandling(): void {
    // Ensure PHI is properly handled
    const patientId = this.getPatientId();
    if (!patientId) {
      throw new Error('PHI-containing entity must have associated patient ID');
    }
  }

  /**
   * Validate business-specific rules (to be implemented by subclasses)
   */
  protected abstract validateBusinessRules(): void;

  /**
   * Get audit information for HIPAA compliance
   */
  getAuditInfo(): EntityAuditInfo {
    return {
      entityId: this.id,
      entityType: this.constructor.name,
      containsPHI: this.containsPHI(),
      patientId: this.getPatientId(),
      complianceLevel: this.getHIPAAComplianceLevel(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Anonymize entity for non-PHI use cases
   */
  abstract anonymize(): Partial<T>;
}

/**
 * HIPAA Compliance Levels
 */
export type HIPAAComplianceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Entity Audit Information
 */
export interface EntityAuditInfo {
  entityId: string;
  entityType: string;
  containsPHI: boolean;
  patientId: string | null;
  complianceLevel: HIPAAComplianceLevel;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Value Object Base Class
 * For immutable value objects in the domain
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Check equality with another value object
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    if (vo.props === undefined) {
      return false;
    }

    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  /**
   * Get value object properties
   */
  public getValue(): T {
    return this.props;
  }

  /**
   * Validate value object
   */
  abstract validate(): void;

  /**
   * Convert to string representation
   */
  abstract toString(): string;
}

/**
 * Healthcare Value Object
 * Specialized value object for healthcare domain
 */
export abstract class HealthcareValueObject<T> extends ValueObject<T> {
  protected constructor(props: T) {
    super(props);
    this.validate();
  }

  /**
   * Check if value object contains PHI
   */
  abstract containsPHI(): boolean;

  /**
   * Healthcare-specific validation
   */
  validate(): void {
    this.validateFormat();
    this.validateHealthcareCompliance();
  }

  /**
   * Validate format (to be implemented by subclasses)
   */
  protected abstract validateFormat(): void;

  /**
   * Validate healthcare compliance
   */
  protected validateHealthcareCompliance(): void {
    if (this.containsPHI()) {
      this.validatePHIFormat();
    }
  }

  /**
   * Validate PHI format requirements
   */
  protected abstract validatePHIFormat(): void;

  /**
   * Anonymize value object for non-PHI use
   */
  abstract anonymize(): Partial<T>;
}
