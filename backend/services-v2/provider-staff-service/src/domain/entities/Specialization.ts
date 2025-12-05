/**
 * Specialization Entity
 * Vietnamese Healthcare Specialization
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { Entity } from "@shared/domain/base/entity";
import { safeToISOString } from "../utils/date-utils";

interface SpecializationProps {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Specialization extends Entity<SpecializationProps> {
  private constructor(props: SpecializationProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: Omit<SpecializationProps, "createdAt" | "updatedAt">,
  ): Specialization {
    const now = new Date();

    return new Specialization({
      ...props,
      code: props.code.trim().toUpperCase(),
      name: props.name.trim(),
      description: props.description?.trim(),
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistenceData(data: any): Specialization {
    return new Specialization(
      {
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      },
      data.id,
    );
  }

  // Getters
  public get code(): string {
    return this.props.code;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get isActive(): boolean {
    return this.props.isActive;
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

  public updateDescription(newDescription: string): void {
    this.props.description = newDescription.trim();
    this.touch();
  }

  public validate(): void {
    if (!this.props.code || this.props.code.trim().length === 0) {
      throw new Error("Mã chuyên khoa không được để trống");
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error("Tên chuyên khoa không được để trống");
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      code: this.props.code,
      name: this.props.name,
      description: this.props.description,
      is_active: this.props.isActive,
      created_at: safeToISOString(this.props.createdAt),
      updated_at: safeToISOString(this.props.updatedAt),
    };
  }

  public override equals(other: Specialization): boolean {
    if (!other) return false;
    return this.props.code === other.props.code;
  }

  public override toString(): string {
    return `${this.props.code} - ${this.props.name}`;
  }
}
