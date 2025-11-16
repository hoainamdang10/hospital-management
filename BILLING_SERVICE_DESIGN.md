# Billing Service Design - Scope Analysis & Architecture

**Date**: 2025-11-15  
**Status**: Phase 1 MVP Design  
**Scope**: Hospital Management System (HMS) with Appointment Booking

---

## 1. Project Context

### System Overview
- **Type**: Hospital Management System (HMS) web application
- **Core Feature**: Appointment booking system
- **MVP Scope**: Patient registration → Appointment booking → Billing → Payment
- **Architecture**: Microservices with Event-Driven Architecture
- **Events**: RabbitMQ-based event publishing/consumption

### Billing Service Role
**Billing Service** is responsible for:
- Invoice generation from completed appointments
- Payment processing (Cash, Card, Bank Transfer, PayOS)
- Insurance coverage calculation (BHYT/BHTN)
- Payment tracking and reporting

---

## 2. MVP Scope for Billing Service (Phase 1)

### ✅ IN SCOPE - Core Flows

#### Flow 4: Appointment Completion → Invoice → Payment
```
Appointment Completed Event
    ↓
Billing Service (AppointmentEventConsumer)
    ↓
CreateInvoiceUseCase
    ├─ Calculate consultation fee
    ├─ Apply insurance coverage (BHYT/BHTN)
    ├─ Generate line items
    └─ Create Invoice aggregate
    ↓
Invoice saved to database
    ↓
Publish: invoice.generated event
    ↓
Notifications Service (sends invoice to patient)
    ↓
Patient makes payment
    ↓
ProcessPaymentUseCase
    ├─ Validate payment method
    ├─ Process payment (PayOS integration)
    ├─ Update invoice status
    └─ Record transaction
    ↓
Publish: payment.completed event
```

### ✅ IN SCOPE - Use Cases (Phase 1)

**Core Use Cases**:
1. ✅ `CreateInvoiceUseCase` - Generate invoice from appointment
2. ✅ `ProcessPaymentUseCase` - Process payment
3. ✅ `GetInvoiceUseCase` - Retrieve invoice details
4. ✅ `GetPatientInvoicesUseCase` - Get patient's invoices
5. ✅ `FinalizeInvoiceUseCase` - Mark invoice as finalized
6. ✅ `CancelInvoiceUseCase` - Cancel invoice (for cancelled appointments)
7. ✅ `CreatePayOSPaymentLinkUseCase` - Generate PayOS payment link
8. ✅ `HandlePayOSWebhookUseCase` - Handle PayOS webhook

**Query Use Cases** (for reporting):
9. ✅ `SearchInvoicesUseCase` - Search invoices by criteria
10. ✅ `GetOverdueInvoicesUseCase` - Get overdue invoices
11. ✅ `GetPatientBillingSummaryUseCase` - Get patient's billing summary
12. ✅ `GetRevenueReportUseCase` - Get revenue report

### ❌ OUT OF SCOPE - Post-MVP Features

**Payment Plans & Installments**:
- ❌ Installment payment plans
- ❌ Discount codes/coupons
- ❌ Payment plan scheduling

**Advanced Features**:
- ❌ Vietnamese VAT calculation
- ❌ Insurance claim submission (external API)
- ❌ Refund processing (use case exists but not tested)
- ❌ Overdue payment reminders (use case exists but not scheduled)
- ❌ Payment email/SMS notifications (belongs to Notifications Service)
- ❌ Invoice email sending (belongs to Notifications Service)
- ❌ Payment reminders (belongs to Notifications Service)

**Out of Scope Use Cases** (to be removed):
- ❌ `SendInvoiceEmailUseCase` - Belongs to Notifications Service
- ❌ `CreatePaymentReminderUseCase` - Belongs to Notifications Service
- ❌ `RefundPaymentUseCase` - Post-MVP feature
- ❌ `ProcessInsuranceClaimUseCase` - Requires external API integration (post-MVP)

---

## 3. Domain Model Design

### Aggregates

#### Invoice Aggregate
```typescript
Invoice {
  id: InvoiceId
  patientId: string
  appointmentId?: string          // Link to appointment
  staffId?: string                // Link to doctor/staff
  invoiceNumber?: string
  items: InvoiceItem[]
  subtotal: Money
  tax: Money
  insuranceCoverage: Money
  totalAmount: Money
  outstandingAmount: Money
  status: InvoiceStatus           // DRAFT, FINALIZED, PAID, CANCELLED
  insurance?: Insurance
  payments: Payment[]
  createdAt: Date
  updatedAt: Date
  finalizedAt?: Date
  cancelledAt?: Date
  cancellationReason?: string
}

InvoiceStatus = "DRAFT" | "FINALIZED" | "PAID" | "CANCELLED"
```

#### Payment Record
```typescript
Payment {
  id: PaymentId
  invoiceId: InvoiceId
  amount: Money
  method: PaymentMethod        // CASH, CARD, BANK_TRANSFER, PAYOS
  status: PaymentStatus        // PENDING, COMPLETED, FAILED
  transactionId?: string
  processedAt: Date
  reference?: string
}

PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "PAYOS"
PaymentStatus = "PENDING" | "COMPLETED" | "FAILED"
```

### Value Objects

- `InvoiceId` - Unique invoice identifier
- `Money` - Amount with currency
- `InvoiceStatus` - Invoice status
- `Insurance` - Insurance information (provider, policy number, coverage %)

### Events

**Published Events**:
1. `InvoiceCreatedEvent` - When invoice is created
2. `PaymentProcessedEvent` - When payment is processed

**Consumed Events**:
1. `AppointmentCompletedEvent` - Trigger invoice creation

---

## 4. Architecture Design

### Layered Architecture

```
┌─────────────────────────────────────────┐
│   Presentation Layer (Controllers)      │
│   - InvoiceController                   │
│   - PaymentController                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Application Layer (Use Cases)         │
│   - CreateInvoiceUseCase                │
│   - ProcessPaymentUseCase               │
│   - GetInvoiceUseCase                   │
│   - SearchInvoicesUseCase               │
│   - GetRevenueReportUseCase             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Domain Layer (Aggregates)             │
│   - Invoice                             │
│   - Payment                             │
│   - InvoiceItem                         │
│   - Money, Insurance                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Infrastructure Layer                  │
│   - SupabaseInvoiceRepository           │
│   - SupabasePatientRepository           │
│   - RabbitMQEventBus                    │
│   - AppointmentEventConsumer            │
│   - PayOSIntegrationService             │
│   - InvoiceMapper                       │
└─────────────────────────────────────────┘
```

### Event-Driven Flow

```
Appointments Service
    ↓ (publishes appointment.completed)
RabbitMQ Exchange (hospital.events)
    ↓
Billing Service Queue (billing.appointment.events)
    ↓
AppointmentEventConsumer
    ├─ Validates event
    ├─ Retrieves patient info
    └─ Calls BillingService.generateAppointmentInvoice()
    ↓
BillingService
    ├─ Calculates fees
    ├─ Applies insurance
    └─ Calls CreateInvoiceUseCase.execute()
    ↓
CreateInvoiceUseCase
    ├─ Creates Invoice aggregate
    ├─ Saves to repository
    └─ Publishes invoice.generated event
    ↓
RabbitMQ Exchange
    ↓
Notifications Service Queue
    ↓
NotificationEventConsumer
    └─ Sends invoice to patient
```

---

## 5. Database Schema

### Tables (Supabase)

#### billing_schema.invoices
```sql
id                          UUID PRIMARY KEY
invoice_id                  VARCHAR(255)
vietnamese_invoice_number   VARCHAR(255)
patient_id                  VARCHAR(255)
appointment_id              VARCHAR(255)          -- Link to appointment
doctor_id                   UUID                  -- Link to staff/doctor
status                      VARCHAR(50)           -- DRAFT, FINALIZED, PAID, CANCELLED
subtotal_amount             DECIMAL(12,2)
subtotal_currency           VARCHAR(3)
tax_amount                  DECIMAL(12,2)
tax_currency                VARCHAR(3)
total_amount                DECIMAL(12,2)
total_currency              VARCHAR(3)
insurance_coverage_amount   DECIMAL(12,2)
insurance_coverage_currency VARCHAR(3)
patient_payment_amount      DECIMAL(12,2)
patient_payment_currency    VARCHAR(3)
insurance_type              VARCHAR(50)           -- BHYT, BHTN, PRIVATE
insurance_number            VARCHAR(255)
insurance_coverage_level    DECIMAL(5,2)
insurance_issued_by         VARCHAR(255)
issued_by                   UUID
created_at                  TIMESTAMP
updated_at                  TIMESTAMP
finalized_at                TIMESTAMP
version                     INT
contains_phi                BOOLEAN
```

#### billing_schema.payment_records
```sql
id                  UUID PRIMARY KEY
invoice_id          UUID FOREIGN KEY
payment_id          VARCHAR(255)
amount              DECIMAL(12,2)
currency            VARCHAR(3)
method              VARCHAR(50)           -- CASH, CARD, BANK_TRANSFER, PAYOS
status              VARCHAR(50)           -- PENDING, COMPLETED, FAILED
transaction_id      VARCHAR(255)
reference           VARCHAR(255)
processed_at        TIMESTAMP
created_at          TIMESTAMP
```

#### billing_schema.invoice_items
```sql
id                  UUID PRIMARY KEY
invoice_id          UUID FOREIGN KEY
description         TEXT
quantity            INT
unit_price          DECIMAL(12,2)
total_price         DECIMAL(12,2)
category            VARCHAR(50)           -- consultation, procedure, medication, lab
code                VARCHAR(50)
created_at          TIMESTAMP
```

---

## 6. API Endpoints (Phase 1)

### Invoice Management

```
POST   /invoices                      - Create invoice (internal use)
GET    /invoices/:id                  - Get invoice details
GET    /invoices                      - Search invoices (with filters)
GET    /invoices/patient/:patientId   - Get patient's invoices
PUT    /invoices/:id/finalize         - Finalize invoice
PUT    /invoices/:id/cancel           - Cancel invoice
```

### Payment Processing

```
POST   /payments                      - Process payment
GET    /payments/:id                  - Get payment details
POST   /payments/payos/link           - Create PayOS payment link
POST   /payments/payos/webhook        - Handle PayOS webhook
```

### Reporting

```
GET    /reports/revenue               - Get revenue report
GET    /reports/overdue               - Get overdue invoices
GET    /reports/patient-summary       - Get patient billing summary
```

---

## 7. Integration Points

### Inbound Events (Consumed)

| Event | Source | Trigger | Action |
|-------|--------|---------|--------|
| `appointment.completed` | Appointments Service | Appointment marked as completed | Generate invoice |
| `appointment.cancelled` | Appointments Service | Appointment cancelled | Cancel invoice (if exists) |

### Outbound Events (Published)

| Event | Target | Trigger | Data |
|-------|--------|---------|------|
| `invoice.generated` | Notifications Service | Invoice created | invoiceId, patientId, totalAmount |
| `payment.completed` | Notifications Service | Payment processed | invoiceId, paymentId, amount |

### External Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| PayOS | Payment gateway | ✅ Implemented |
| Supabase | Database | ✅ Implemented |
| RabbitMQ | Event bus | ✅ Implemented |

---

## 8. Implementation Checklist (Phase 1)

### ✅ Completed
- [x] Domain aggregates (Invoice, Payment)
- [x] Value objects (Money, InvoiceStatus, Insurance)
- [x] Core use cases (CreateInvoice, ProcessPayment, GetInvoice)
- [x] Repositories (SupabaseInvoiceRepository)
- [x] Event consumers (AppointmentEventConsumer)
- [x] PayOS integration
- [x] Database schema
- [x] API routes (basic)

### 🔄 In Progress
- [ ] Fix out-of-scope use cases (SendInvoiceEmail, CreatePaymentReminder)
- [ ] Complete service startup (tsconfig path resolution)
- [ ] Integration testing with Appointments Service
- [ ] End-to-end Flow 4 testing

### ⏳ Post-MVP
- [ ] Payment plans & installments
- [ ] Vietnamese VAT calculation
- [ ] Insurance claim submission
- [ ] Refund processing
- [ ] Overdue payment reminders
- [ ] Advanced reporting & analytics

---

## 9. Key Design Decisions

### 1. Scope Limitation
**Decision**: Focus on core appointment-to-invoice-to-payment flow only.  
**Rationale**: MVP scope is appointment booking, not complex billing features.  
**Impact**: Removed SendInvoiceEmail and CreatePaymentReminder use cases (belong to Notifications Service).

### 2. Event-Driven Architecture
**Decision**: Use RabbitMQ for event publishing/consumption.  
**Rationale**: Loose coupling between services, scalability.  
**Impact**: Billing Service is event-driven, not request-driven.

### 3. Insurance Coverage Calculation
**Decision**: Simple percentage-based coverage (BHYT/BHTN).  
**Rationale**: MVP doesn't require complex insurance rules.  
**Impact**: Insurance coverage = totalAmount × coveragePercentage.

### 4. Payment Methods
**Decision**: Support Cash, Card, Bank Transfer, PayOS.  
**Rationale**: Common payment methods in Vietnam.  
**Impact**: PayOS integration for online payments.

### 5. Appointment-Invoice Linkage
**Decision**: Store `appointmentId` in invoices table.  
**Rationale**: Enable traceability from appointment → invoice → payment.  
**Impact**: appointment_id column added to invoices table.

---

## 10. Summary

### Billing Service MVP Scope
- **Core Responsibility**: Generate invoices from appointments, process payments
- **In Scope**: Invoice creation, payment processing, PayOS integration
- **Out of Scope**: Payment plans, VAT, insurance claims, email/SMS notifications
- **Events**: Consumes `appointment.completed`, publishes `invoice.generated` & `payment.completed`
- **Architecture**: Clean Architecture + DDD + Event-Driven
- **Database**: Supabase with proper schema for invoices, payments, items

### Next Steps
1. Remove out-of-scope use cases (SendInvoiceEmail, CreatePaymentReminder)
2. Fix service startup (tsconfig path resolution)
3. Complete integration testing with Appointments Service
4. Verify end-to-end Flow 4 functionality
