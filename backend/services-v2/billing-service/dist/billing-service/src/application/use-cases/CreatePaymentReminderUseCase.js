"use strict";
/**
 * CreatePaymentReminderUseCase - Command Use Case
 * Create payment reminder schedule for invoice using Event-Driven Architecture
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Event-Driven
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePaymentReminderUseCase = void 0;
const InvoiceId_1 = require("../../domain/value-objects/InvoiceId");
class CreatePaymentReminderUseCase {
    constructor(invoiceRepository, eventBus) {
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
    }
    async execute(command) {
        try {
            // Get invoice
            const invoiceId = InvoiceId_1.InvoiceId.fromString(command.invoiceId);
            const invoice = await this.invoiceRepository.findById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            // Check if invoice has due date
            const dueDate = invoice.getDueDate();
            if (!dueDate) {
                throw new Error('Invoice does not have a due date');
            }
            // Check if invoice is already paid or cancelled
            const status = invoice.getStatus();
            if (status === 'PAID' || status === 'CANCELLED') {
                throw new Error(`Cannot create reminder for ${status} invoice`);
            }
            const patientId = invoice.getPatientId();
            const reminderDays = command.reminderDays || [3, 1, 0]; // Default: 3 days before, 1 day before, on due date
            const reminders = [];
            // Publish event for Scheduler Service to consume and create schedules
            for (const days of reminderDays) {
                const reminderDate = new Date(dueDate);
                reminderDate.setDate(reminderDate.getDate() - days);
                // Skip if reminder date is in the past
                if (reminderDate < new Date()) {
                    continue;
                }
                const reminderType = days > 0 ? 'before-due' : days === 0 ? 'on-due' : 'after-due';
                // Publish event to Scheduler Service
                await this.eventBus.publish('billing.payment.reminder.scheduled', {
                    invoiceId: command.invoiceId,
                    patientId,
                    patientName: 'Patient', // TODO: Get from patient service
                    invoiceNumber: invoice.getInvoiceNumber(),
                    totalAmount: invoice.getTotalAmount(),
                    dueDate: dueDate,
                    reminderDate: reminderDate,
                    reminderType,
                    daysBeforeDue: days,
                    scheduledAt: new Date(),
                    scheduledBy: 'system'
                });
                reminders.push({
                    type: reminderType,
                    scheduledDate: reminderDate,
                    scheduleId: 'event-published' // Event published, schedule will be created by Scheduler Service
                });
            }
            return {
                success: true,
                invoiceId: command.invoiceId,
                reminders,
                message: `Created ${reminders.length} payment reminder(s)`
            };
        }
        catch (error) {
            throw new Error(`Failed to create payment reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.CreatePaymentReminderUseCase = CreatePaymentReminderUseCase;
//# sourceMappingURL=CreatePaymentReminderUseCase.js.map