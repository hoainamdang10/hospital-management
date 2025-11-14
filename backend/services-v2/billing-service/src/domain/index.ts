/**
 * Domain Layer Exports - Billing Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Aggregates
export { Invoice } from './aggregates/Invoice';

// Entities (Patient is exported as type only to avoid conflict)
// export { Patient } from './entities/Patient';

// Events
export { InvoiceCreatedEvent } from './events/InvoiceCreatedEvent';
export { InvoiceFinalizedEvent } from './events/InvoiceFinalizedEvent';
export { InvoiceCancelledEvent } from './events/InvoiceCancelledEvent';
export { PaymentProcessedEvent } from './events/PaymentProcessedEvent';
export { InsuranceClaimProcessedEvent } from './events/InsuranceClaimProcessedEvent';

// Repositories
export type { IInvoiceRepository } from './repositories/IInvoiceRepository';
// IPatientRepository is exported below with Patient type

// Value Objects
export type { Money } from './value-objects/Money';
export type { InvoiceStatus } from './value-objects/InvoiceStatus';
export type { PaymentStatus } from './entities/Payment';

// Types
export type { Patient, PatientInsuranceInfo, IPatientRepository } from './entities/Patient';
