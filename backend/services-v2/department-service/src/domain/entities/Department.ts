/**
 * Department Entity - Domain Layer
 * Simple POCO (Plain Old Class Object) entity for Department
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Simple CRUD Pattern
 */

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
}

export class Department {
  constructor(
    public readonly id: string,
    public readonly props: DepartmentProps
  ) {
    this.validate();
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

  // Business methods
  public activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  public updateContactInfo(phone?: string, email?: string, location?: string): void {
    if (phone) this.props.phone = phone;
    if (email) this.props.email = email;
    if (location) this.props.location = location;
    this.touch();
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

  private touch(): void {
    this.props.updatedAt = new Date();
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
      updatedBy: this.props.updatedBy
    };
  }

  // Factory method
  public static create(props: DepartmentProps, id?: string): Department {
    const departmentId = id || this.generateId();
    return new Department(departmentId, props);
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

