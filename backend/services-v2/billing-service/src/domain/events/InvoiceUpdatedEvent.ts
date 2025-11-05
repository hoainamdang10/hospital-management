/**
 * InvoiceUpdatedEvent - Domain Event
 * Raised when an invoice is updated
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '../../../../shared/domain/base/domain-event';

export class InvoiceUpdatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly patientId: string,
    public readonly updateType: string,
    public readonly updateDetails: any,
    public readonly updatedBy: string
  ) {
    super(invoiceId, 'InvoiceUpdatedEvent', 1);
  }

  /**
   * Get aggregate type
   */
  getAggregateType(): string {
    return 'BillingAggregate';
  }

  /**
   * Get Vietnamese update type
   */
  getVietnameseUpdateType(): string {
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
  getEventData(): any {
    return {
      invoiceId: this.invoiceId,
      patientId: this.patientId,
      updateType: this.updateType,
      vietnameseUpdateType: this.getVietnameseUpdateType(),
      updateDetails: this.updateDetails,
      updatedBy: this.updatedBy,
      vietnameseDescription: `Hóa đơn đã được cập nhật: ${this.getVietnameseUpdateType()}`
    };
  }
}
