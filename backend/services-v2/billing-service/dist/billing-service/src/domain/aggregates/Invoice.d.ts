import { HealthcareAggregateRoot } from '../../../../shared/domain/base/aggregate-root';
import { InvoiceId } from '../value-objects/InvoiceId';
import { Money } from '../value-objects/Money';
import { InvoiceStatus } from '../value-objects/InvoiceStatus';
import { Insurance } from '../value-objects/Insurance';
import { InvoiceItem } from '../entities/InvoiceItem';
import { Payment } from '../entities/Payment';
export interface InvoiceProps {
    id: InvoiceId;
    patientId: string;
    invoiceNumber?: string;
    items: InvoiceItem[];
    subtotal: Money;
    tax: Money;
    insuranceCoverage: Money;
    totalAmount: Money;
    outstandingAmount: Money;
    status: InvoiceStatus;
    insurance?: Insurance;
    payments: Payment[];
    createdAt: Date;
    updatedAt: Date;
    finalizedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
}
export declare class Invoice extends HealthcareAggregateRoot<InvoiceProps> {
    private constructor();
    static create(patientId: string, items: InvoiceItem[], insurance?: Insurance): Invoice;
    finalize(): void;
    cancel(reason: string): void;
    processPayment(payment: Payment): void;
    processInsuranceClaim(): void;
    private generateInvoiceNumber;
    get id(): string;
    validateBusinessInvariants(): void;
    getPatientId(): string;
    applyEvent(event: any): void;
    validate(): void;
    toPersistence(): any;
    get invoiceId(): InvoiceId;
    get patientId(): string;
    get invoiceNumber(): string | undefined;
    get items(): InvoiceItem[];
    get subtotal(): Money;
    get tax(): Money;
    get insuranceCoverage(): Money;
    get totalAmount(): Money;
    get outstandingAmount(): Money;
    get status(): InvoiceStatus;
    get insurance(): Insurance | undefined;
    get payments(): Payment[];
    get createdAt(): Date;
    get updatedAt(): Date;
}
//# sourceMappingURL=Invoice.d.ts.map