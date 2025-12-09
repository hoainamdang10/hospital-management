"use strict";
/**
 * Patient Event Consumer
 * Consumes events from Patient Registry Service to maintain local read model
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, CQRS, Eventual Consistency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientEventConsumer = void 0;
/**
 * Patient Event Consumer
 *
 * Subscribed Events:
 * - patient.patient.registered
 * - patient.patient.updated
 * - patient.patient.deactivated
 *
 * Pattern: Inbox Pattern for idempotency
 */
class PatientEventConsumer {
    constructor(patientReadRepo, inboxRepo) {
        this.patientReadRepo = patientReadRepo;
        this.inboxRepo = inboxRepo;
    }
    /**
     * Handle patient event (entry point)
     */
    async handle(event) {
        // Extract event metadata
        const eventId = event.eventId || event.id || event.metadata?.eventId;
        const eventType = event.eventType || event.type || event.name;
        const routingKey = event.routingKey || event.metadata?.routingKey;
        const normalizedType = (eventType || routingKey || "").toLowerCase();
        if (!eventId) {
            console.error("[PatientEventConsumer] Missing eventId, cannot process:", event);
            return;
        }
        // Idempotency check
        if (await this.inboxRepo.exists(eventId)) {
            console.debug(`[PatientEventConsumer] Duplicate event ${eventId}, skipping`);
            return;
        }
        console.log(`[PatientEventConsumer] Processing event: ${eventType} (${eventId})`, routingKey ? `(routingKey=${routingKey})` : "");
        try {
            // Route to handler based on event type (accept both legacy and new routing keys)
            if (normalizedType.includes("patientregistered")) {
                await this.handlePatientRegistered(event);
            }
            else if (normalizedType.includes("patientupdated")) {
                await this.handlePatientUpdated(event);
            }
            else if (normalizedType.includes("patientdeactivated")) {
                await this.handlePatientDeactivated(event);
            }
            else if (normalizedType.includes("patientdeleted")) {
                await this.handlePatientDeleted(event);
            }
            else {
                console.warn(`[PatientEventConsumer] Unknown event type: ${eventType}`, routingKey ? `(routingKey=${routingKey})` : "");
                // Still save to inbox to avoid reprocessing
            }
            // Mark as processed
            await this.inboxRepo.save({
                eventId,
                eventType,
                sourceService: "patient-registry",
                payloadJson: event,
            });
            console.log(`[PatientEventConsumer] ✓ Event ${eventId} processed successfully`);
        }
        catch (error) {
            console.error(`[PatientEventConsumer] Error processing event ${eventId}:`, error);
            throw error; // Let RabbitMQ retry
        }
    }
    /**
     * Handle patient registered event
     */
    async handlePatientRegistered(event) {
        const payload = this.extractPayload(event);
        if (!payload || !payload.patientId) {
            throw new Error("Invalid patient.registered event: missing patientId");
        }
        await this.patientReadRepo.upsert({
            patientId: payload.patientId,
            tenantId: payload.tenantId || "hospital-1",
            fullName: this.extractFullName(payload),
            phone: this.extractPhone(payload),
            email: this.extractEmail(payload),
            dateOfBirth: this.extractDateOfBirth(payload),
            gender: this.extractGender(payload),
            nationalId: this.extractNationalId(payload),
            insuranceNumber: this.extractInsuranceNumber(payload),
            insuranceType: this.extractInsuranceType(payload),
            address: this.extractAddress(payload),
        });
        console.log(`[PatientEventConsumer] ✓ Patient ${payload.patientId} registered in read model`);
    }
    /**
     * Handle patient updated event
     */
    async handlePatientUpdated(event) {
        const payload = this.extractPayload(event);
        if (!payload || !payload.patientId) {
            throw new Error("Invalid patient.updated event: missing patientId");
        }
        await this.patientReadRepo.upsert({
            patientId: payload.patientId,
            tenantId: payload.tenantId || "hospital-1",
            fullName: this.extractFullName(payload),
            phone: this.extractPhone(payload),
            email: this.extractEmail(payload),
            dateOfBirth: this.extractDateOfBirth(payload),
            gender: this.extractGender(payload),
            nationalId: this.extractNationalId(payload),
            insuranceNumber: this.extractInsuranceNumber(payload),
            insuranceType: this.extractInsuranceType(payload),
            address: this.extractAddress(payload),
        });
        console.log(`[PatientEventConsumer] ✓ Patient ${payload.patientId} updated in read model`);
    }
    /**
     * Handle patient deactivated event
     */
    async handlePatientDeactivated(event) {
        const payload = this.extractPayload(event);
        if (!payload || !payload.patientId) {
            throw new Error("Invalid patient.deactivated event: missing patientId");
        }
        // Option 1: Keep in read model with deactivated flag (if needed in future)
        // Option 2: Delete from read model
        // For now, we keep the data (appointments history still needs it)
        console.log(`[PatientEventConsumer] ✓ Patient ${payload.patientId} deactivated (kept in read model)`);
    }
    /**
     * Handle patient deleted event
     */
    async handlePatientDeleted(event) {
        const payload = this.extractPayload(event);
        if (!payload || !payload.patientId) {
            throw new Error("Invalid patient.deleted event: missing patientId");
        }
        await this.patientReadRepo.delete(payload.patientId);
        console.log(`[PatientEventConsumer] ✓ Patient ${payload.patientId} deleted from read model`);
    }
    // ==========================================================================
    // Helper Methods - Extract data from various event payload structures
    // ==========================================================================
    extractFullName(payload) {
        return (payload.personalInfo?.fullName ||
            payload.fullName ||
            payload.full_name ||
            `${payload.firstName || ""} ${payload.lastName || ""}`.trim() ||
            "Unknown");
    }
    extractPhone(payload) {
        return (payload.contactInfo?.primaryPhone ||
            payload.contactInfo?.phone ||
            payload.phone ||
            payload.phoneNumber ||
            undefined);
    }
    extractEmail(payload) {
        return payload.contactInfo?.email || payload.email || undefined;
    }
    extractDateOfBirth(payload) {
        const dob = payload.personalInfo?.dateOfBirth || payload.dateOfBirth || payload.dob;
        return dob ? new Date(dob) : undefined;
    }
    extractGender(payload) {
        return payload.personalInfo?.gender || payload.gender || undefined;
    }
    extractNationalId(payload) {
        return (payload.personalInfo?.nationalId ||
            payload.nationalId ||
            payload.national_id ||
            undefined);
    }
    extractInsuranceNumber(payload) {
        return (payload.insuranceInfo?.number ||
            payload.insuranceNumber ||
            payload.insurance_number ||
            undefined);
    }
    extractInsuranceType(payload) {
        return (payload.insuranceInfo?.type ||
            payload.insuranceType ||
            payload.insurance_type ||
            undefined);
    }
    extractAddress(payload) {
        return payload.contactInfo?.address || payload.address || undefined;
    }
    extractPayload(event) {
        if (!event) {
            return undefined;
        }
        if (typeof event.getEventData === "function") {
            try {
                const data = event.getEventData();
                if (data) {
                    return data;
                }
            }
            catch (error) {
                console.error("[PatientEventConsumer] Failed to extract event data via getEventData", error);
            }
        }
        return event.eventData || event.payload || event.data || event;
    }
}
exports.PatientEventConsumer = PatientEventConsumer;
//# sourceMappingURL=PatientEventConsumer.js.map