/**
 * DepartmentAssignment Entity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Entity } from '@shared/domain/base/entity';

interface DepartmentAssignmentProps {
  departmentId: string;
  departmentCode: string;        // Department code (CARD, ORTH, PEDI, etc.)
  departmentNameEn: string;      // English name
  departmentNameVi: string;      // Vietnamese name
  role: string;
  isPrimary?: boolean;           // Is this the primary department assignment?
  isHead?: boolean;              // Is this staff the department head?
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DepartmentAssignment extends Entity<DepartmentAssignmentProps> {
  private constructor(props: DepartmentAssignmentProps, id?: string) {
    super(props, id);
  }

  public static create(props: Omit<DepartmentAssignmentProps, 'createdAt' | 'updatedAt'>): DepartmentAssignment {
    const now = new Date();
    return new DepartmentAssignment({ ...props, createdAt: now, updatedAt: now });
  }

  public static fromPersistenceData(data: any): DepartmentAssignment {
    return new DepartmentAssignment({
      departmentId: data.department_id || data.departmentId,
      departmentCode: data.department_code || data.departmentCode,
      departmentNameEn: data.department_name_en || data.departmentNameEn || data.department_name || data.departmentName,
      departmentNameVi: data.department_name_vi || data.departmentNameVi || data.department_name || data.departmentName,
      role: data.role,
      isPrimary: data.is_primary || data.isPrimary || false,
      isHead: data.is_head || data.isHead || false,
      startDate: new Date(data.start_date || data.startDate || Date.now()),
      endDate: data.end_date || data.endDate ? new Date(data.end_date || data.endDate) : undefined,
      isActive: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true),
      createdAt: new Date(data.created_at || data.createdAt || Date.now()),
      updatedAt: new Date(data.updated_at || data.updatedAt || Date.now())
    }, data.id);
  }

  public get departmentId(): string {
    return this.props.departmentId;
  }

  public get departmentCode(): string {
    return this.props.departmentCode;
  }

  public get departmentNameEn(): string {
    return this.props.departmentNameEn;
  }

  public get departmentNameVi(): string {
    return this.props.departmentNameVi;
  }

  public get isPrimary(): boolean {
    return this.props.isPrimary || false;
  }

  public get isHead(): boolean {
    return this.props.isHead || false;
  }

  public set isHead(value: boolean) {
    this.props.isHead = value;
    this.touch();
  }

  public get role(): string {
    return this.props.role;
  }

  public get startDate(): Date {
    return this.props.startDate;
  }

  public get endDate(): Date | undefined {
    return this.props.endDate;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public end(endDate: Date): void {
    this.props.endDate = endDate;
    this.props.isActive = false;
    this.touch();
  }

  public validate(): void {
    if (!this.props.departmentId) {
      throw new Error('ID khoa/phòng ban không được để trống');
    }
  }

  private safeToISOString(date: Date | undefined | null, fallback: Date = new Date()): string {
    if (!date) return fallback.toISOString();
    if (!(date instanceof Date)) {
      const parsed = new Date(date as any);
      if (isNaN(parsed.getTime())) return fallback.toISOString();
      return parsed.toISOString();
    }
    if (isNaN(date.getTime())) return fallback.toISOString();
    return date.toISOString();
  }

  public toPersistence(): any {
    const now = new Date();
    return {
      id: this.id,
      departmentId: this.props.departmentId,
      departmentCode: this.props.departmentCode,
      departmentNameEn: this.props.departmentNameEn,
      departmentNameVi: this.props.departmentNameVi,
      role: this.props.role,
      isPrimary: this.props.isPrimary || false,
      isHead: this.props.isHead || false,
      startDate: this.safeToISOString(this.props.startDate, now),
      endDate: this.props.endDate ? this.safeToISOString(this.props.endDate) : null,
      isActive: this.props.isActive,
      createdAt: this.safeToISOString(this.props.createdAt, now),
      updatedAt: this.safeToISOString(this.props.updatedAt, now)
    };
  }
}

