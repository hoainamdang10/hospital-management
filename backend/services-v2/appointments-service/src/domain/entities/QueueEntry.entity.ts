/**
 * Queue Entry Entity - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { HealthcareEntity } from '@shared/domain/base/entity';

export enum QueueStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum QueuePriority {
  EMERGENCY = 'EMERGENCY',
  URGENT = 'URGENT',
  NORMAL = 'NORMAL',
  LOW = 'LOW'
}

export interface QueueEntryProps {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  queueNumber: number;
  priority: QueuePriority;
  status: QueueStatus;
  checkInTime: Date;
  calledTime?: Date;
  completedTime?: Date;
  serviceStartedAt?: Date;     // When patient enters consultation room
  serviceCompletedAt?: Date;   // When consultation is finished
  estimatedWaitMinutes?: number;
  createdAt: Date;
}

/**
 * Queue Entry Entity
 * Represents a patient in the waiting queue
 */
export class QueueEntry extends HealthcareEntity<QueueEntryProps> {
  private constructor(props: QueueEntryProps) {
    super(props);
  }

  /**
   * Create new queue entry
   */
  public static create(
    patientId: string,
    doctorId: string,
    queueNumber: number,
    priority: QueuePriority,
    appointmentId?: string
  ): QueueEntry {
    const props: QueueEntryProps = {
      id: crypto.randomUUID(),
      patientId,
      doctorId,
      appointmentId,
      queueNumber,
      priority,
      status: QueueStatus.WAITING,
      checkInTime: new Date(),
      estimatedWaitMinutes: undefined,
      createdAt: new Date()
    };

    return new QueueEntry(props);
  }

  /**
   * Reconstitute from database
   */
  public static reconstitute(props: QueueEntryProps): QueueEntry {
    return new QueueEntry(props);
  }

  // Getters
  public override get id(): string {
    return this.props.id;
  }

  public get patientId(): string {
    return this.props.patientId;
  }

  public get doctorId(): string {
    return this.props.doctorId;
  }

  public get appointmentId(): string | undefined {
    return this.props.appointmentId;
  }

  public get queueNumber(): number {
    return this.props.queueNumber;
  }

  public get priority(): QueuePriority {
    return this.props.priority;
  }

  public get status(): QueueStatus {
    return this.props.status;
  }

  public get checkInTime(): Date {
    return this.props.checkInTime;
  }

  public get calledTime(): Date | undefined {
    return this.props.calledTime;
  }

  public get completedTime(): Date | undefined {
    return this.props.completedTime;
  }

  public get serviceStartedAt(): Date | undefined {
    return this.props.serviceStartedAt;
  }

  public get serviceCompletedAt(): Date | undefined {
    return this.props.serviceCompletedAt;
  }

  public get estimatedWaitMinutes(): number | undefined {
    return this.props.estimatedWaitMinutes;
  }

  public override get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Call patient
   */
  public call(): void {
    if (this.props.status !== QueueStatus.WAITING) {
      throw new Error('Only waiting patients can be called');
    }

    this.props.status = QueueStatus.CALLED;
    this.props.calledTime = new Date();
  }

  /**
   * Start service (patient enters consultation)
   */
  public startService(): void {
    if (this.props.status !== QueueStatus.CALLED) {
      throw new Error('Patient must be called before starting service');
    }

    this.props.status = QueueStatus.IN_PROGRESS;
    this.props.serviceStartedAt = new Date();
  }

  /**
   * Complete service
   */
  public complete(): void {
    if (this.props.status !== QueueStatus.IN_PROGRESS) {
      throw new Error('Service must be in progress to complete');
    }

    this.props.status = QueueStatus.COMPLETED;
    this.props.completedTime = new Date();
    this.props.serviceCompletedAt = new Date();
  }

  /**
   * Cancel queue entry
   */
  public cancel(): void {
    if (this.props.status === QueueStatus.COMPLETED) {
      throw new Error('Cannot cancel completed queue entry');
    }

    this.props.status = QueueStatus.CANCELLED;
  }

  /**
   * Update estimated wait time
   */
  public updateEstimatedWait(minutes: number): void {
    this.props.estimatedWaitMinutes = minutes;
  }

  /**
   * Update queue number (when reordering)
   */
  public updateQueueNumber(newNumber: number): void {
    this.props.queueNumber = newNumber;
  }

  /**
   * Check if patient is waiting
   */
  public isWaiting(): boolean {
    return this.props.status === QueueStatus.WAITING;
  }

  /**
   * Check if patient has been called
   */
  public isCalled(): boolean {
    return this.props.status === QueueStatus.CALLED;
  }

  /**
   * Check if service is in progress
   */
  public isInProgress(): boolean {
    return this.props.status === QueueStatus.IN_PROGRESS;
  }

  /**
   * Get wait time in minutes
   */
  public getWaitTimeMinutes(): number {
    const endTime = this.props.calledTime || new Date();
    return Math.floor((endTime.getTime() - this.props.checkInTime.getTime()) / 60000);
  }

  /**
   * Healthcare-specific: Contains PHI
   */
  override containsPHI(): boolean {
    return true;
  }

  /**
   * Healthcare-specific: Get patient ID
   */
  override getPatientId(): string | null {
    return this.props.patientId;
  }

  /**
   * Validate business rules (required by base class)
   */
  validateBusinessRules(): void {
    if (!this.props.patientId || !this.props.doctorId) {
      throw new Error('Patient ID and Doctor ID are required');
    }

    if (this.props.queueNumber < 1) {
      throw new Error('Queue number must be positive');
    }
  }

  /**
   * Anonymize PHI data (required by base class)
   */
  anonymize(): QueueEntry {
    const anonymizedProps = {
      ...this.props,
      patientId: '***REDACTED***',
      doctorId: '***REDACTED***',
      appointmentId: this.props.appointmentId ? '***REDACTED***' : undefined
    };
    return QueueEntry.reconstitute(anonymizedProps);
  }

  /**
   * Convert to persistence format (required by base class)
   */
  toPersistence(): any {
    return {
      id: this.props.id,
      patient_id: this.props.patientId,
      doctor_id: this.props.doctorId,
      appointment_id: this.props.appointmentId,
      queue_number: this.props.queueNumber,
      priority: this.props.priority,
      status: this.props.status,
      check_in_time: this.props.checkInTime.toISOString(),
      called_time: this.props.calledTime?.toISOString(),
      completed_time: this.props.completedTime?.toISOString(),
      estimated_wait_minutes: this.props.estimatedWaitMinutes,
      created_at: this.props.createdAt.toISOString()
    };
  }

  /**
   * Validate entity (legacy method - kept for compatibility)
   */
  override validate(): void {
    if (!this.props.patientId || !this.props.doctorId) {
      throw new Error('Patient ID and Doctor ID are required');
    }

    if (this.props.queueNumber < 1) {
      throw new Error('Queue number must be positive');
    }
  }
}

