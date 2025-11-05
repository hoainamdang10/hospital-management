/**
 * InvoiceCreatedEvent - Domain Event
 * Raised when a new invoice is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '../../../../shared/domain/base/domain-event';

export class InvoiceCreatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly patientId: string,
    public readonly medicalRecordId: string,
    public readonly doctorId: string,
    public readonly appointmentId: string,
    public readonly issuedBy: string
  ) {
    super(invoiceId, 'InvoiceCreatedEvent', 1);
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
      vietnameseDescription: 'Hóa đơn mới đã được tạo'
    };
  }
}
