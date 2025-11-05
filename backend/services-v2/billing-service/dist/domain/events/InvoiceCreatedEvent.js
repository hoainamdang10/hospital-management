"use strict";
/**
 * InvoiceCreatedEvent - Domain Event
 * Raised when a new invoice is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCreatedEvent = void 0;
class InvoiceCreatedEvent {
    constructor(invoiceId, patientId, medicalRecordId, doctorId, appointmentId, issuedBy, occurredAt) {
        this.invoiceId = invoiceId;
        this.patientId = patientId;
        this.medicalRecordId = medicalRecordId;
        this.doctorId = doctorId;
        this.appointmentId = appointmentId;
        this.issuedBy = issuedBy;
        this.eventVersion = 1;
        this.eventId = `invoice-created-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.aggregateId = invoiceId;
        this.occurredAt = occurredAt;
    }
    /**
     * Get event name
     */
    getEventName() {
        return 'InvoiceCreatedEvent';
    }
    /**
     * Get aggregate type
     */
    getAggregateType() {
        return 'BillingAggregate';
    }
    /**
     * Get event data
     */
    getEventData() {
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
    toJSON() {
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
exports.InvoiceCreatedEvent = InvoiceCreatedEvent;
//# sourceMappingURL=InvoiceCreatedEvent.js.map