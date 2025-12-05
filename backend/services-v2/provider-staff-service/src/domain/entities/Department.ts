/**
 * Department Entity - Domain Layer
 * Simple entity for department management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */

import { safeToISOString } from "../utils/date-utils";

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
  constructor(
    public readonly id: string,
    public readonly props: DepartmentProps,
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

  // Business methods
  public activate(triggeredBy?: string): void {
    if (!this.props.isActive) {
      this.props.isActive = true;
      this.touch(triggeredBy);
    }
  }

  public deactivate(_reason?: string, triggeredBy?: string): void {
    if (this.props.isActive) {
      this.props.isActive = false;
      this.touch(triggeredBy);
    }
  }

  public updateContactInfo(
    phone?: string,
    email?: string,
    location?: string,
    triggeredBy?: string,
  ): void {
    if (phone !== undefined) {
      this.props.phone = phone;
    }
    if (email !== undefined) {
      this.props.email = email;
    }
    if (location !== undefined) {
      this.props.location = location;
    }
    this.touch(triggeredBy);
  }

  public updateBasicInfo(
    departmentNameEn?: string,
    departmentNameVi?: string,
    description?: string,
    triggeredBy?: string,
  ): void {
    if (departmentNameEn !== undefined) {
      this.props.departmentNameEn = departmentNameEn;
    }
    if (departmentNameVi !== undefined) {
      this.props.departmentNameVi = departmentNameVi;
    }
    if (description !== undefined) {
      this.props.description = description;
    }
    this.touch(triggeredBy);
  }

  public assignDepartmentHead(
    headId: string,
    headName: string,
    headEmail: string,
    triggeredBy?: string,
  ): void {
    this.props.headOfDepartmentId = headId;
    this.props.headOfDepartmentName = headName;
    this.props.headOfDepartmentEmail = headEmail;
    this.touch(triggeredBy);
  }

  public updateStaffCount(
    newCount: number,
    _changeType?: "added" | "removed" | "transferred_in" | "transferred_out",
    _staffId?: string,
    _staffName?: string,
  ): void {
    this.props.staffCount = newCount;
    if (this.props.activeStaffCount === undefined) {
      this.props.activeStaffCount = newCount;
    }
  }

  // Validation
  private validate(): void {
    if (!this.props.departmentCode || this.props.departmentCode.length < 2) {
      throw new Error("Department code must be at least 2 characters");
    }

    if (!/^[A-Z]{2,4}$/.test(this.props.departmentCode)) {
      throw new Error("Department code must be 2-4 uppercase letters");
    }

    if (
      !this.props.departmentNameEn ||
      this.props.departmentNameEn.trim().length === 0
    ) {
      throw new Error("Department name (English) is required");
    }

    if (
      !this.props.departmentNameVi ||
      this.props.departmentNameVi.trim().length === 0
    ) {
      throw new Error("Department name (Vietnamese) is required");
    }

    if (this.props.email && !this.isValidEmail(this.props.email)) {
      throw new Error("Invalid email format");
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
      createdAt: safeToISOString(this.props.createdAt),
      updatedAt: safeToISOString(this.props.updatedAt),
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
    return new Department(departmentId, props);
  }

  public static reconstitute(id: string, props: DepartmentProps): Department {
    return new Department(id, props);
  }

  private static generateId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
