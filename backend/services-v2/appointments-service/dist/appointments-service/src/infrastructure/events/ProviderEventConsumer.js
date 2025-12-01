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
            console.error("[ProviderEventConsumer] Missing eventId, cannot process:", event);
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
                case "provider.staff.created":
                case "StaffRegisteredEvent":
                    await this.handleStaffCreated(event);
                    break;
                case "provider.staff.updated":
                case "StaffUpdatedEvent":
                    await this.handleStaffUpdated(event);
                    break;
                case "provider.staff.deactivated":
                case "provider.staff.status.changed":
                case "StaffStatusChangedEvent":
                    await this.handleStaffStatusChanged(event);
                    break;
                case "provider.staff.deleted":
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
                sourceService: "provider-staff-service",
                payloadJson: event,
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
        const staffData = this.mapPayloadToProvider(payload);
        const existing = await this.providerReadRepo.findById(staffData.providerId);
        const merged = this.mergeProviderData(staffData, existing);
        await this.providerReadRepo.upsert({
            ...merged,
            syncedAt: new Date(),
            createdAt: payload.createdAt || new Date(),
            updatedAt: payload.updatedAt || new Date(),
        });
        console.log(`[ProviderEventConsumer] Staff created in read model: ${staffData.providerId}`);
    }
    /**
     * Handle staff updated event
     */
    async handleStaffUpdated(event) {
        const payload = event.payload || event.data || event;
        const staffData = this.mapPayloadToProvider(payload);
        const existing = await this.providerReadRepo.findById(staffData.providerId);
        const merged = this.mergeProviderData(staffData, existing);
        await this.providerReadRepo.upsert({
            ...merged,
            syncedAt: new Date(),
            updatedAt: new Date(),
        });
        console.log(`[ProviderEventConsumer] Staff updated in read model: ${staffData.providerId}`);
    }
    /**
     * Handle staff status changed event
     */
    async handleStaffStatusChanged(event) {
        const payload = event.payload || event.data || event;
        const staffData = this.mapPayloadToProvider(payload);
        const existing = await this.providerReadRepo.findById(staffData.providerId);
        const merged = this.mergeProviderData(staffData, existing);
        await this.providerReadRepo.upsert({
            ...merged,
            syncedAt: new Date(),
            updatedAt: new Date(),
        });
        console.log(`[ProviderEventConsumer] Staff status updated: ${staffData.providerId} -> ${payload.status || payload.newStatus}`);
        // If staff is deactivated, handle appointment implications
        if (!staffData.isActive) {
            console.warn(`[ProviderEventConsumer] Staff ${staffData.providerId} deactivated - should trigger appointment rescheduling`);
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
    /**
     * Map various payload shapes from provider-staff service into ProviderReadModel fields
     * Handles both camelCase and snake_case, and ensures fullName is non-null.
     */
    mapPayloadToProvider(payload) {
        const sources = this.collectPayloadSources(payload && typeof payload === "object" ? payload : {});
        const primarySource = sources[0] || {};
        const updated = this.findNestedField(sources, ["updatedData"]) ||
            {};
        const personal = this.findNestedField(sources, [
            "personalInfo",
            "personal_info",
            "personal",
        ]) || {};
        const professional = this.findNestedField(sources, [
            "professionalInfo",
            "professional_info",
            "professional",
        ]) || {};
        const personalUpdated = updated.personalInfo || updated.personal_info || {};
        const professionalUpdated = updated.professionalInfo || updated.professional_info || {};
        const normalizeId = (value) => {
            if (typeof value === "string")
                return value;
            if (value?.props?.value)
                return value.props.value;
            if (value?.value)
                return value.value;
            return `${value ?? "unknown"}`;
        };
        const firstName = personal.firstName ||
            personal.first_name ||
            personalUpdated.firstName ||
            personalUpdated.first_name ||
            primarySource.firstName ||
            primarySource.first_name ||
            "";
        const lastName = personal.lastName ||
            personal.last_name ||
            personalUpdated.lastName ||
            personalUpdated.last_name ||
            primarySource.lastName ||
            primarySource.last_name ||
            "";
        const fullNameCandidates = [
            primarySource.fullName,
            primarySource.full_name,
            personal.fullName,
            personal.full_name,
            personalUpdated.fullName,
            personalUpdated.full_name,
            `${firstName} ${lastName}`.trim(),
        ].filter((v) => typeof v === "string" && v.trim().length > 0);
        const providerId = normalizeId(this.findNestedField(sources, [
            "staffId",
            "providerId",
            "id",
            "aggregateId",
        ]) || personal.staffId);
        const fullName = (fullNameCandidates[0] ||
            `${providerId}` ||
            "Unknown").trim();
        const specialization = primarySource.specialization ||
            primarySource.specializationName ||
            professional.specialization ||
            professional.specializationName ||
            professional.title ||
            professionalUpdated.specialization ||
            professionalUpdated.specializationName ||
            professionalUpdated.title;
        const department = primarySource.department ||
            primarySource.departmentId ||
            professional.department ||
            professional.departmentName ||
            professional.department_name ||
            professionalUpdated.department ||
            professionalUpdated.departmentName ||
            professionalUpdated.department_name;
        const licenseNumber = primarySource.licenseNumber ||
            primarySource.license_number ||
            professional.licenseNumber ||
            professional.license_number ||
            professionalUpdated.licenseNumber ||
            professionalUpdated.license_number ||
            updated.licenseNumber;
        const phone = personal.phoneNumber ||
            personal.phone ||
            personalUpdated.phoneNumber ||
            personalUpdated.phone ||
            primarySource.phone ||
            primarySource.phoneNumber;
        const email = personal.email ||
            personalUpdated.email ||
            primarySource.email ||
            updated.email;
        const statusValue = primarySource.status ||
            primarySource.newStatus ||
            primarySource.isActive ||
            "active";
        const isActive = typeof statusValue === "string"
            ? statusValue.toLowerCase() === "active"
            : !!statusValue;
        return {
            providerId,
            tenantId: payload.tenantId || "hospital-1",
            fullName,
            specialization: specialization || null,
            department: department || null,
            licenseNumber: licenseNumber || null,
            phone: phone || null,
            email: email || null,
            isActive,
        };
    }
    mergeProviderData(incoming, existing) {
        const tenantId = incoming.tenantId || existing?.tenantId || "hospital-1";
        const fullName = this.isMeaningfulText(incoming.fullName, incoming.providerId)
            ? incoming.fullName
            : existing?.fullName || incoming.providerId;
        const specialization = incoming.specialization !== undefined
            ? incoming.specialization
            : existing?.specialization;
        const department = incoming.department !== undefined
            ? incoming.department
            : existing?.department;
        const licenseNumber = incoming.licenseNumber !== undefined
            ? incoming.licenseNumber
            : existing?.licenseNumber;
        const phone = incoming.phone !== undefined ? incoming.phone : existing?.phone;
        const email = incoming.email !== undefined ? incoming.email : existing?.email;
        const isActive = incoming.isActive !== undefined
            ? incoming.isActive
            : (existing?.isActive ?? true);
        return {
            providerId: incoming.providerId,
            tenantId,
            fullName,
            specialization: specialization ?? undefined,
            department: department ?? undefined,
            licenseNumber: licenseNumber ?? undefined,
            phone: phone ?? undefined,
            email: email ?? undefined,
            isActive,
            syncedAt: incoming.syncedAt,
            createdAt: incoming.createdAt || existing?.createdAt,
            updatedAt: incoming.updatedAt || existing?.updatedAt,
        };
    }
    collectPayloadSources(payload) {
        const sources = [];
        const queue = [payload];
        while (queue.length) {
            const current = queue.shift();
            if (!current || typeof current !== "object") {
                continue;
            }
            if (sources.includes(current)) {
                continue;
            }
            sources.push(current);
            const children = [
                current.payload,
                current.data,
                current.eventData,
                current.eventData?.payload,
                current.eventData?.data,
                current.eventData?.eventData,
            ];
            for (const child of children) {
                if (child && typeof child === "object") {
                    queue.push(child);
                }
            }
        }
        return sources;
    }
    findNestedField(sources, fieldNames) {
        for (const source of sources) {
            if (!source || typeof source !== "object")
                continue;
            for (const field of fieldNames) {
                if (Object.prototype.hasOwnProperty.call(source, field) &&
                    source[field] !== undefined &&
                    source[field] !== null) {
                    return source[field];
                }
            }
        }
        return undefined;
    }
    isMeaningfulText(value, fallback) {
        if (!value) {
            return false;
        }
        const normalized = value.trim().toLowerCase();
        if (!normalized) {
            return false;
        }
        if (normalized === fallback.toLowerCase()) {
            return false;
        }
        return normalized !== "unknown";
    }
}
exports.ProviderEventConsumer = ProviderEventConsumer;
//# sourceMappingURL=ProviderEventConsumer.js.map