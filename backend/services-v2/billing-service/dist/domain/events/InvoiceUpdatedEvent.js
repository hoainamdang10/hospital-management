"use strict";
/**
 * InvoiceUpdatedEvent - Domain Event
 * Raised when an invoice is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceUpdatedEvent = void 0;
class InvoiceUpdatedEvent {
    constructor(invoiceId, patientId, updateType, updateDetails, updatedBy, occurredAt) {
        this.invoiceId = invoiceId;
        this.patientId = patientId;
        this.updateType = updateType;
        this.updateDetails = updateDetails;
        this.updatedBy = updatedBy;
        this.eventVersion = 1;
        this.eventId = `invoice-updated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.aggregateId = invoiceId;
        this.occurredAt = occurredAt;
    }
    /**
     * Get event name
     */
    getEventName() {
        return 'InvoiceUpdatedEvent';
    }
    /**
     * Get aggregate type
     */
    getAggregateType() {
        return 'BillingAggregate';
    }
    /**
     * Get Vietnamese update type
     */
    getVietnameseUpdateType() {
        switch (this.updateType) {
            case 'item_added': return 'Thêm item';
            case 'item_removed': return 'Xóa item';
            case 'insurance_updated': return 'Cập nhật bảo hiểm';
            case 'finalized': return 'Hoàn thành hóa đơn';
            case 'cancelled': return 'Hủy hóa đơn';
            case 'status_changed': return 'Thay đổi trạng thái';
            default: return 'Cập nhật khác';
        }
    }
    /**
     * Get event data
     */
    getEventData() {
        return {
            invoiceId: this.invoiceId,
            patientId: this.patientId,
            updateType: this.updateType,
            vietnameseUpdateType: this.getVietnameseUpdateType(),
            updateDetails: this.updateDetails,
            updatedBy: this.updatedBy,
            occurredAt: this.occurredAt.toISOString(),
            eventVersion: this.eventVersion,
            vietnameseDescription: `Hóa đơn đã được cập nhật: ${this.getVietnameseUpdateType()}`
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
exports.InvoiceUpdatedEvent = InvoiceUpdatedEvent;
//# sourceMappingURL=InvoiceUpdatedEvent.js.map