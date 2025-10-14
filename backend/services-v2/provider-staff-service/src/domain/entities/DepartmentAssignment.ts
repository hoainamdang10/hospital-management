/**
 * DepartmentAssignment Entity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Entity } from '../../../shared/domain/base/entity';

interface DepartmentAssignmentProps {
  departmentId: string;
  departmentName: string;
  role: string;
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

  public static fromPersistence(data: any): DepartmentAssignment {
    return new DepartmentAssignment({
      departmentId: data.department_id,
      departmentName: data.department_name,
      role: data.role,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }, data.id);
  }

  public get departmentId(): string {
    return this.props.departmentId;
  }

  public get departmentName(): string {
    return this.props.departmentName;
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

  public toPersistence(): any {
    return {
      id: this.id,
      department_id: this.props.departmentId,
      department_name: this.props.departmentName,
      role: this.props.role,
      start_date: this.props.startDate.toISOString(),
      end_date: this.props.endDate?.toISOString(),
      is_active: this.props.isActive,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }
}

