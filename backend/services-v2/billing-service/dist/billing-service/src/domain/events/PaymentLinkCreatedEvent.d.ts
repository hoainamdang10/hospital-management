import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PaymentLinkCreatedEventData {
    invoiceId: string;
    patientId: string;
    orderCode: number;
    checkoutUrl: string;
    qrCode: string;
    amount: number;
    currency: string;
    description: string;
    createdAt: Date;
}
/**
 * Event emitted when a PayOS payment link is created for an invoice
 * This event can be consumed by:
 * - Notifications Service: Send payment link to patient via email/SMS
 * - Frontend: Display QR code and checkout URL
 * - Analytics: Track payment link generation
 */
export declare class PaymentLinkCreatedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly patientId: string;
    readonly orderCode: number;
    readonly checkoutUrl: string;
    readonly qrCode: string;
    readonly amount: number;
    readonly currency: string;
    readonly description: string;
    constructor(invoiceId: string, patientId: string, orderCode: number, checkoutUrl: string, qrCode: string, amount: number, currency: string, description: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PaymentLinkCreatedEventData;
    getEventData(): any;
}
//# sourceMappingURL=PaymentLinkCreatedEvent.d.ts.map