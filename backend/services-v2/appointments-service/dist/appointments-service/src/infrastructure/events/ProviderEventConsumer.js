"use strict";
/**
 * Provider Event Consumer
 * Consumes events from Provider Staff Service to maintain local read model
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, CQRS, Eventual Consistency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderEventConsumer = void 0;
/**
 * Provider Event Consumer
 *
 * Subscribed Events:
 * - provider.staff.created
 * - provider.staff.updated
 * - provider.staff.deactivated
 * - provider.staff.deleted
 *
 * Pattern: Inbox Pattern for idempotency
 */
class ProviderEventConsumer {
    constructor(providerReadRepo, inboxRepo) {
        this.providerReadRepo = providerReadRepo;
        this.inboxRepo = inboxRepo;
    }
    /**
     * Handle provider event (entry point)
     */
    async handle(event) {
        // Extract event metadata
        const eventId = event.eventId || event.id || event.metadata?.eventId;
        const eventType = event.eventType || event.type;
        if (!eventId) {
            console.error('[ProviderEventConsumer] Missing eventId, cannot process:', event);
            return;
        }
        // Idempotency check
        if (await this.inboxRepo.exists(eventId)) {
            console.debug(`[ProviderEventConsumer] Duplicate event ${eventId}, skipping`);
            return;
        }
        console.log(`[ProviderEventConsumer] Processing event: ${eventType} (${eventId})`);
        try {
            // Route to handler based on event type
            switch (eventType) {
                case 'provider.staff.created':
                case 'StaffRegisteredEvent':
                    await this.handleStaffCreated(event);
                    break;
                case 'provider.staff.updated':
                case 'StaffUpdatedEvent':
                    await this.handleStaffUpdated(event);
                    break;
                case 'provider.staff.deactivated':
                case 'provider.staff.status.changed':
                case 'StaffStatusChangedEvent':
                    await this.handleStaffStatusChanged(event);
                    break;
                case 'provider.staff.deleted':
                    await this.handleStaffDeleted(event);
                    break;
                default:
                    console.warn(`[ProviderEventConsumer] Unknown event type: ${eventType}`);
                // Still save to inbox to avoid reprocessing
            }
            // Mark as processed
            await this.inboxRepo.save({
                eventId,
                eventType,
                sourceService: 'provider-staff-service',
                payloadJson: event
            });
            console.log(`[ProviderEventConsumer] Event processed successfully: ${eventId}`);
        }
        catch (error) {
            console.error(`[ProviderEventConsumer] Error processing event ${eventId}:`, error);
            throw error; // Let message broker handle retry
        }
    }
    /**
     * Handle staff created event
     */
    async handleStaffCreated(event) {
        const payload = event.payload || event.data || event;
        const staffData = {
            providerId: payload.staffId || payload.id,
            tenantId: payload.tenantId || 'default-tenant',
            fullName: `${payload.firstName} ${payload.lastName}`,
            specialization: payload.specialization,
            department: payload.departmentId,
            licenseNumber: payload.licenseNumber,
            phone: payload.phone,
            email: payload.email,
            isActive: payload.status === 'active',
            syncedAt: new Date(),
            createdAt: payload.createdAt || new Date(),
            updatedAt: payload.updatedAt || new Date()
        };
        await this.providerReadRepo.upsert(staffData);
        console.log(`[ProviderEventConsumer] Staff created in read model: ${staffData.providerId}`);
    }
    /**
     * Handle staff updated event
     */
    async handleStaffUpdated(event) {
        const payload = event.payload || event.data || event;
        const staffId = payload.staffId || payload.id;
        const updates = {
            providerId: staffId,
            tenantId: payload.tenantId || 'default-tenant',
            isActive: payload.status === 'active',
            syncedAt: new Date(),
            updatedAt: new Date()
        };
        // Only update fields that are present
        if (payload.firstName && payload.lastName) {
            updates.fullName = `${payload.firstName} ${payload.lastName}`;
        }
        if (payload.email !== undefined)
            updates.email = payload.email;
        if (payload.phone !== undefined)
            updates.phone = payload.phone;
        if (payload.specialization !== undefined)
            updates.specialization = payload.specialization;
        if (payload.licenseNumber !== undefined)
            updates.licenseNumber = payload.licenseNumber;
        if (payload.departmentId !== undefined)
            updates.department = payload.departmentId;
        await this.providerReadRepo.upsert(updates);
        console.log(`[ProviderEventConsumer] Staff updated in read model: ${staffId}`);
    }
    /**
     * Handle staff status changed event
     */
    async handleStaffStatusChanged(event) {
        const payload = event.payload || event.data || event;
        const staffId = payload.staffId || payload.id;
        const status = payload.status || payload.newStatus;
        const isActive = status === 'active';
        await this.providerReadRepo.upsert({
            providerId: staffId,
            tenantId: payload.tenantId || 'default-tenant',
            fullName: payload.fullName || 'Unknown', // Required field, use placeholder if not provided
            isActive,
            syncedAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`[ProviderEventConsumer] Staff status updated: ${staffId} -> ${status}`);
        // If staff is deactivated, handle appointment implications
        if (!isActive) {
            console.warn(`[ProviderEventConsumer] Staff ${staffId} deactivated - should trigger appointment rescheduling`);
            // TODO: Trigger rescheduling use case or emit internal event
        }
    }
    /**
     * Handle staff deleted event
     */
    async handleStaffDeleted(event) {
        const payload = event.payload || event.data || event;
        const staffId = payload.staffId || payload.id;
        await this.providerReadRepo.delete(staffId);
        console.log(`[ProviderEventConsumer] Staff deleted from read model: ${staffId}`);
        // Appointments with this staff should be handled
        console.warn(`[ProviderEventConsumer] Staff ${staffId} deleted - appointments require attention`);
    }
}
exports.ProviderEventConsumer = ProviderEventConsumer;
//# sourceMappingURL=ProviderEventConsumer.js.map