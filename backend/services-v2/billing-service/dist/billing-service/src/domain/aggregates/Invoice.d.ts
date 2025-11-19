import { HealthcareAggregateRoot } from '../../../../shared/domain/base/aggregate-root';
import { InvoiceId } from '../value-objects/InvoiceId';
import { Money } from '../value-objects/Money';
import { InvoiceStatus } from '../value-objects/InvoiceStatus';
import { InvoiceItem } from '../entities/InvoiceItem';
import { Payment } from '../entities/Payment';
export interface InvoiceProps {
    id: InvoiceId;
    patientId: string;
    appointmentId?: string;
    staffId?: string;
    invoiceNumber?: string;
    items: InvoiceItem[];
    subtotal: Money;
    tax: Money;
    totalAmount: Money;
    outstandingAmount: Money;
    status: InvoiceStatus;
    payments: Payment[];
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Invoice extends HealthcareAggregateRoot<InvoiceProps> {
    private constructor();
    static create(patientId: string, items: InvoiceItem[]): Invoice;
    processPayment(payment: Payment): void;
    private static generateInvoiceNumber;
    get id(): string;
    validateBusinessInvariants(): void;
    getPatientId(): string;
    setAppointmentId(appointmentId: string): void;
    getAppointmentId(): string | undefined;
    setStaffId(staffId: string): void;
    getStaffId(): string | undefined;
    applyEvent(event: any): void;
    validate(): void;
    toPersistence(): any;
    get invoiceId(): InvoiceId;
    get patientId(): string;
    get invoiceNumber(): string | undefined;
    get items(): InvoiceItem[];
    get subtotal(): Money;
    get tax(): Money;
    get totalAmount(): Money;
    get outstandingAmount(): Money;
    get status(): InvoiceStatus;
    get payments(): Payment[];
    get createdAt(): Date;
    get updatedAt(): Date;
    get paidAt(): Date | undefined;
}
//# sourceMappingURL=Invoice.d.ts.map