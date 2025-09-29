/**
 * InvoiceCreatedEvent - Domain Event
 * Raised when a new invoice is created
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';

export class InvoiceCreatedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly occurredAt: Date;
  public readonly eventVersion: number = 1;

  constructor(
    public readonly invoiceId: string,
    public readonly patientId: string,
    public readonly medicalRecordId: string,
    public readonly doctorId: string,
    public readonly appointmentId: string,
    public readonly issuedBy: string,
    occurredAt: Date
  ) {
    this.eventId = `invoice-created-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.aggregateId = invoiceId;
    this.occurredAt = occurredAt;
  }

  /**
   * Get event name
   */
  getEventName(): string {
    return 'InvoiceCreatedEvent';
  }

  /**
   * Get aggregate type
   */
  getAggregateType(): string {
    return 'BillingAggregate';
  }

  /**
   * Get event data
   */
  getEventData(): any {
    return {
      invoiceId: this.invoiceId,
      patientId: this.patientId,
      medicalRecordId: this.medicalRecordId,
      doctorId: this.doctorId,
      appointmentId: this.appointmentId,
      issuedBy: this.issuedBy,
      occurredAt: this.occurredAt.toISOString(),
      eventVersion: this.eventVersion,
      vietnameseDescription: 'Hóa đơn mới đã được tạo'
    };
  }

  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return {
      eventId: this.eventId,
      eventName: this.getEventName(),
      aggregateId: this.aggregateId,
      aggregateType: this.getAggregateType(),
      eventVersion: this.eventVersion,
      occurredAt: this.occurredAt.toISOString(),
      eventData: this.getEventData()
    };
  }
}
