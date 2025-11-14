/**
 * Department Entity - Domain Layer (Event-Enhanced)
 * Aggregate Root with domain events support
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import {
  DepartmentCreatedEvent,
  DepartmentUpdatedEvent,
  DepartmentHeadAssignedEvent,
  DepartmentActivatedEvent,
  DepartmentDeactivatedEvent,
  DepartmentStaffCountChangedEvent
} from '../events/DepartmentEvents';
import { HealthcareDomainEvent } from '@shared/domain/base/domain-event';

export interface DepartmentProps {
  departmentCode: string;
  departmentNameEn: string;
  departmentNameVi: string;
  description?: string;
  phone?: string;
  email?: string;
  location?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  headOfDepartmentId?: string;
  headOfDepartmentName?: string;
  headOfDepartmentEmail?: string;
  staffCount?: number;
  activeStaffCount?: number;
}

export class Department {
  private _domainEvents: HealthcareDomainEvent[] = [];

  constructor(
    public readonly id: string,
    public readonly props: DepartmentProps,
    isNew: boolean = false
  ) {
    this.validate();
    
    // Publish creation event for new departments
    if (isNew) {
      this.addDomainEvent(DepartmentCreatedEvent.create(
        this.id,
        this.props.departmentCode,
        this.props.departmentNameEn,
        this.props.departmentNameVi,
        this.props.createdBy
      ));
    }
  }

  // Getters
  get code(): string {
    return this.props.departmentCode;
  }

  get nameEn(): string {
    return this.props.departmentNameEn;
  }

  get nameVi(): string {
    return this.props.departmentNameVi;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get location(): string | undefined {
    return this.props.location;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  get headOfDepartmentId(): string | undefined {
    return this.props.headOfDepartmentId;
  }

  get headOfDepartmentName(): string | undefined {
    return this.props.headOfDepartmentName;
  }

  get headOfDepartmentEmail(): string | undefined {
    return this.props.headOfDepartmentEmail;
  }

  get staffCount(): number {
    return this.props.staffCount || 0;
  }

  get activeStaffCount(): number {
    if (this.props.activeStaffCount !== undefined) {
      return this.props.activeStaffCount;
    }
    return this.staffCount;
  }

  get domainEvents(): HealthcareDomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // Business methods
  public activate(triggeredBy?: string): void {
    if (!this.props.isActive) {
      this.props.isActive = true;
      this.touch(triggeredBy);
      
      this.addDomainEvent(DepartmentActivatedEvent.create(
        this.id,
        this.props.departmentCode,
        this.props.departmentNameEn,
        this.props.departmentNameVi,
        triggeredBy
      ));
    }
  }

  public deactivate(reason?: string, triggeredBy?: string): void {
    if (this.props.isActive) {
      this.props.isActive = false;
      this.touch(triggeredBy);
      
      this.addDomainEvent(DepartmentDeactivatedEvent.create(
        this.id,
        this.props.departmentCode,
        this.props.departmentNameEn,
        this.props.departmentNameVi,
        reason,
        triggeredBy
      ));
    }
  }

  public updateContactInfo(phone?: string, email?: string, location?: string, triggeredBy?: string): void {
    const previousValues = {
      phone: this.props.phone,
      email: this.props.email,
      location: this.props.location,
    };

    const updatedFields: string[] = [];
    
    if (phone !== undefined && phone !== this.props.phone) {
      this.props.phone = phone;
      updatedFields.push('phone');
    }
    
    if (email !== undefined && email !== this.props.email) {
      this.props.email = email;
      updatedFields.push('email');
    }
    
    if (location !== undefined && location !== this.props.location) {
      this.props.location = location;
      updatedFields.push('location');
    }

    if (updatedFields.length > 0) {
      this.touch(triggeredBy);
      
      const newValues = {
        phone: this.props.phone,
        email: this.props.email,
        location: this.props.location,
      };

      this.addDomainEvent(DepartmentUpdatedEvent.create(
        this.id,
        this.props.departmentCode,
        this.props.departmentNameEn,
        this.props.departmentNameVi,
        updatedFields,
        previousValues,
        newValues,
        triggeredBy
      ));
    }
  }

  public updateBasicInfo(
    departmentNameEn?: string,
    departmentNameVi?: string,
    description?: string,
    triggeredBy?: string
  ): void {
    const previousValues = {
      departmentNameEn: this.props.departmentNameEn,
      departmentNameVi: this.props.departmentNameVi,
      description: this.props.description,
    };

    const updatedFields: string[] = [];
    
    if (departmentNameEn !== undefined && departmentNameEn !== this.props.departmentNameEn) {
      this.props.departmentNameEn = departmentNameEn;
      updatedFields.push('departmentNameEn');
    }
    
    if (departmentNameVi !== undefined && departmentNameVi !== this.props.departmentNameVi) {
      this.props.departmentNameVi = departmentNameVi;
      updatedFields.push('departmentNameVi');
    }
    
    if (description !== undefined && description !== this.props.description) {
      this.props.description = description;
      updatedFields.push('description');
    }

    if (updatedFields.length > 0) {
      this.touch(triggeredBy);
      
      const newValues = {
        departmentNameEn: this.props.departmentNameEn,
        departmentNameVi: this.props.departmentNameVi,
        description: this.props.description,
      };

      this.addDomainEvent(DepartmentUpdatedEvent.create(
        this.id,
        this.props.departmentCode,
        this.props.departmentNameEn,
        this.props.departmentNameVi,
        updatedFields,
        previousValues,
        newValues,
        triggeredBy
      ));
    }
  }

  public assignDepartmentHead(
    headId: string,
    headName: string,
    headEmail: string,
    triggeredBy?: string
  ): void {
    const previousHeadId = this.props.headOfDepartmentId;
    
    this.props.headOfDepartmentId = headId;
    this.props.headOfDepartmentName = headName;
    this.props.headOfDepartmentEmail = headEmail;
    this.touch(triggeredBy);

    this.addDomainEvent(DepartmentHeadAssignedEvent.create(
      this.id,
      this.props.departmentCode,
      this.props.departmentNameEn,
      this.props.departmentNameVi,
      headId,
      headName,
      headEmail,
      previousHeadId,
      triggeredBy
    ));
  }

  public updateStaffCount(newCount: number, changeType: 'added' | 'removed' | 'transferred_in' | 'transferred_out', staffId?: string, staffName?: string): void {
    const previousCount = this.props.staffCount || 0;
    this.props.staffCount = newCount;
    if (this.props.activeStaffCount === undefined) {
      this.props.activeStaffCount = newCount;
    }

    this.addDomainEvent(DepartmentStaffCountChangedEvent.create(
      this.id,
      this.props.departmentCode,
      this.props.departmentNameEn,
      this.props.departmentNameVi,
      previousCount,
      newCount,
      changeType,
      staffId,
      staffName
    ));
  }

  // Validation
  private validate(): void {
    if (!this.props.departmentCode || this.props.departmentCode.length < 2) {
      throw new Error('Department code must be at least 2 characters');
    }

    if (!/^[A-Z]{2,4}$/.test(this.props.departmentCode)) {
      throw new Error('Department code must be 2-4 uppercase letters');
    }

    if (!this.props.departmentNameEn || this.props.departmentNameEn.trim().length === 0) {
      throw new Error('Department name (English) is required');
    }

    if (!this.props.departmentNameVi || this.props.departmentNameVi.trim().length === 0) {
      throw new Error('Department name (Vietnamese) is required');
    }

    if (this.props.email && !this.isValidEmail(this.props.email)) {
      throw new Error('Invalid email format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private touch(triggeredBy?: string): void {
    this.props.updatedAt = new Date();
    this.props.updatedBy = triggeredBy;
  }

  private addDomainEvent(event: HealthcareDomainEvent): void {
    this._domainEvents.push(event);
  }

  // Serialization
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      code: this.props.departmentCode,
      nameEn: this.props.departmentNameEn,
      nameVi: this.props.departmentNameVi,
      description: this.props.description,
      phone: this.props.phone,
      email: this.props.email,
      location: this.props.location,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      createdBy: this.props.createdBy,
      updatedBy: this.props.updatedBy,
      headOfDepartmentId: this.props.headOfDepartmentId,
      headOfDepartmentName: this.props.headOfDepartmentName,
      headOfDepartmentEmail: this.props.headOfDepartmentEmail,
      staffCount: this.props.staffCount,
      activeStaffCount: this.props.activeStaffCount,
    };
  }

  // Factory method
  public static create(props: DepartmentProps, id?: string): Department {
    const departmentId = id || this.generateId();
    return new Department(departmentId, props, true); // Mark as new for event publishing
  }

  public static reconstitute(id: string, props: DepartmentProps): Department {
    return new Department(id, props, false); // Don't publish events for reconstituted entities
  }

  private static generateId(): string {
    // Simple UUID v4 generation (in production, use uuid library)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

