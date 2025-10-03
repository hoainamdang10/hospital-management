/**
 * MedicalHistory Entity - Patient Registry
 * Patient medical history tracking
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { Entity } from '../../../../shared/domain/base/entity';

export interface MedicalHistoryProps {
  id: string;
  conditionName: string;
  diagnosedDate: Date;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  status: 'active' | 'resolved' | 'chronic' | 'in_remission';
  isChronic: boolean;
  notes?: string;
  treatingPhysician?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MedicalHistory extends Entity<MedicalHistoryProps> {
  private constructor(props: MedicalHistoryProps) {
    super(props);
  }

  /**
   * Create new medical history entry
   */
  public static create(
    conditionName: string,
    diagnosedDate: Date,
    severity: 'mild' | 'moderate' | 'severe' | 'critical',
    status: 'active' | 'resolved' | 'chronic' | 'in_remission',
    isChronic: boolean = false,
    notes?: string,
    treatingPhysician?: string
  ): MedicalHistory {
    const now = new Date();
    
    return new MedicalHistory({
      id: Entity.generateId(),
      conditionName: conditionName.trim(),
      diagnosedDate,
      severity,
      status,
      isChronic,
      notes: notes?.trim(),
      treatingPhysician: treatingPhysician?.trim(),
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(props: MedicalHistoryProps): MedicalHistory {
    return new MedicalHistory(props);
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get conditionName(): string {
    return this.props.conditionName;
  }

  public get diagnosedDate(): Date {
    return this.props.diagnosedDate;
  }

  public get severity(): 'mild' | 'moderate' | 'severe' | 'critical' {
    return this.props.severity;
  }

  public get status(): 'active' | 'resolved' | 'chronic' | 'in_remission' {
    return this.props.status;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  public get treatingPhysician(): string | undefined {
    return this.props.treatingPhysician;
  }

  // Business methods
  public isActive(): boolean {
    return this.props.status === 'active' || this.props.status === 'chronic';
  }

  public isResolved(): boolean {
    return this.props.status === 'resolved';
  }

  public isChronic(): boolean {
    return this.props.isChronic || this.props.status === 'chronic';
  }

  public isCritical(): boolean {
    return this.props.severity === 'critical';
  }

  public updateStatus(status: 'active' | 'resolved' | 'chronic' | 'in_remission'): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  public updateSeverity(severity: 'mild' | 'moderate' | 'severe' | 'critical'): void {
    this.props.severity = severity;
    this.props.updatedAt = new Date();
  }

  public addNotes(notes: string): void {
    if (this.props.notes) {
      this.props.notes += '\n' + notes.trim();
    } else {
      this.props.notes = notes.trim();
    }
    this.props.updatedAt = new Date();
  }

  public resolve(): void {
    this.props.status = 'resolved';
    this.props.updatedAt = new Date();
  }

  public markAsChronic(): void {
    this.props.status = 'chronic';
    this.props.isChronic = true;
    this.props.updatedAt = new Date();
  }

  public getDurationInDays(): number {
    const today = new Date();
    const diffTime = today.getTime() - this.props.diagnosedDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getDurationInYears(): number {
    return Math.floor(this.getDurationInDays() / 365);
  }

  // Validation methods
  public isValid(): boolean {
    return (
      this.props.conditionName.length > 0 &&
      this.props.diagnosedDate <= new Date()
    );
  }

  // Persistence methods
  public toPersistence(): any {
    return {
      id: this.props.id,
      conditionName: this.props.conditionName,
      diagnosedDate: this.props.diagnosedDate.toISOString(),
      severity: this.props.severity,
      status: this.props.status,
      isChronic: this.props.isChronic,
      notes: this.props.notes,
      treatingPhysician: this.props.treatingPhysician,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }

  public static fromPersistence(data: any): MedicalHistory {
    return MedicalHistory.reconstitute({
      id: data.id,
      conditionName: data.conditionName,
      diagnosedDate: new Date(data.diagnosedDate),
      severity: data.severity,
      status: data.status,
      isChronic: data.isChronic,
      notes: data.notes,
      treatingPhysician: data.treatingPhysician,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }

  // Logging methods
  public getSummaryForLogging(): object {
    return {
      id: this.props.id,
      conditionName: this.props.conditionName,
      severity: this.props.severity,
      status: this.props.status,
      isChronic: this.props.isChronic,
      durationInDays: this.getDurationInDays()
    };
  }
}

