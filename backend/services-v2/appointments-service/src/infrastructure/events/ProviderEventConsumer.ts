/**
 * Provider Event Consumer
 * Consumes events from Provider Staff Service to maintain local read model
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, CQRS, Eventual Consistency
 */

import { ProviderReadModelRepository } from "../repositories/ProviderReadModelRepository";
import { InboxRepository } from "../inbox/InboxRepository";

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
export class ProviderEventConsumer {
  constructor(
    private readonly providerReadRepo: ProviderReadModelRepository,
    private readonly inboxRepo: InboxRepository,
  ) {}

  /**
   * Handle provider event (entry point)
   */
  async handle(event: any): Promise<void> {
    // Extract event metadata
    const eventId = event.eventId || event.id || event.metadata?.eventId;
    const eventType = event.eventType || event.type;

    if (!eventId) {
      console.error(
        "[ProviderEventConsumer] Missing eventId, cannot process:",
        event,
      );
      return;
    }

    // Idempotency check
    if (await this.inboxRepo.exists(eventId)) {
      console.debug(
        `[ProviderEventConsumer] Duplicate event ${eventId}, skipping`,
      );
      return;
    }

    console.log(
      `[ProviderEventConsumer] Processing event: ${eventType} (${eventId})`,
    );

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
          console.warn(
            `[ProviderEventConsumer] Unknown event type: ${eventType}`,
          );
        // Still save to inbox to avoid reprocessing
      }

      // Mark as processed
      await this.inboxRepo.save({
        eventId,
        eventType,
        sourceService: "provider-staff-service",
        payloadJson: event,
      });

      console.log(
        `[ProviderEventConsumer] Event processed successfully: ${eventId}`,
      );
    } catch (error) {
      console.error(
        `[ProviderEventConsumer] Error processing event ${eventId}:`,
        error,
      );
      throw error; // Let message broker handle retry
    }
  }

  /**
   * Handle staff created event
   */
  private async handleStaffCreated(event: any): Promise<void> {
    const payload = event.payload || event.data || event;
    const staffData = this.mapPayloadToProvider(payload);

    await this.providerReadRepo.upsert({
      ...staffData,
      syncedAt: new Date(),
      createdAt: payload.createdAt || new Date(),
      updatedAt: payload.updatedAt || new Date(),
    });
    console.log(
      `[ProviderEventConsumer] Staff created in read model: ${staffData.providerId}`,
    );
  }

  /**
   * Handle staff updated event
   */
  private async handleStaffUpdated(event: any): Promise<void> {
    const payload = event.payload || event.data || event;

    const staffData = this.mapPayloadToProvider(payload);

    await this.providerReadRepo.upsert({
      ...staffData,
      syncedAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(
      `[ProviderEventConsumer] Staff updated in read model: ${staffData.providerId}`,
    );
  }

  /**
   * Handle staff status changed event
   */
  private async handleStaffStatusChanged(event: any): Promise<void> {
    const payload = event.payload || event.data || event;

    const staffData = this.mapPayloadToProvider(payload);

    await this.providerReadRepo.upsert({
      ...staffData,
      syncedAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `[ProviderEventConsumer] Staff status updated: ${staffData.providerId} -> ${payload.status || payload.newStatus}`,
    );

    // If staff is deactivated, handle appointment implications
    if (!staffData.isActive) {
      console.warn(
        `[ProviderEventConsumer] Staff ${staffData.providerId} deactivated - should trigger appointment rescheduling`,
      );
      // TODO: Trigger rescheduling use case or emit internal event
    }
  }

  /**
   * Handle staff deleted event
   */
  private async handleStaffDeleted(event: any): Promise<void> {
    const payload = event.payload || event.data || event;

    const staffId = payload.staffId || payload.id;

    await this.providerReadRepo.delete(staffId);
    console.log(
      `[ProviderEventConsumer] Staff deleted from read model: ${staffId}`,
    );

    // Appointments with this staff should be handled
    console.warn(
      `[ProviderEventConsumer] Staff ${staffId} deleted - appointments require attention`,
    );
  }

  /**
   * Map various payload shapes from provider-staff service into ProviderReadModel fields
   * Handles both camelCase and snake_case, and ensures fullName is non-null.
   */
  private mapPayloadToProvider(payload: any) {
    // Unwrap GenericIntegrationEvent shape where actual payload is in `data`
    const src =
      payload && typeof payload.data === "object" ? payload.data : payload;
    const updated = src.updatedData || {};
    const personalUpdated = updated.personalInfo || updated.personal_info || {};
    const professionalUpdated =
      updated.professionalInfo || updated.professional_info || {};

    const normalizeId = (value: any): string => {
      if (typeof value === "string") return value;
      if (value?.props?.value) return value.props.value;
      if (value?.value) return value.value;
      return `${value ?? "unknown"}`;
    };

    const personal =
      src.personalInfo || src.personal_info || src.personal || {};
    const professional =
      src.professionalInfo || src.professional_info || src.professional || {};

    const firstName =
      personal.firstName ||
      personal.first_name ||
      personalUpdated.firstName ||
      personalUpdated.first_name ||
      src.firstName ||
      src.first_name ||
      "";
    const lastName =
      personal.lastName ||
      personal.last_name ||
      personalUpdated.lastName ||
      personalUpdated.last_name ||
      src.lastName ||
      src.last_name ||
      "";

    const fullNameCandidates = [
      src.fullName,
      personal.fullName,
      personal.full_name,
      personalUpdated.fullName,
      personalUpdated.full_name,
      `${firstName} ${lastName}`.trim(),
    ].filter((v) => typeof v === "string" && v.trim().length > 0);

    const providerId = normalizeId(
      src.staffId || src.id || src.aggregateId || personal.staffId,
    );

    const fullName = (
      fullNameCandidates[0] ||
      `${providerId}` ||
      "Unknown"
    ).trim();

    const specialization =
      src.specialization ||
      professional.specialization ||
      professional.specializationName ||
      professional.title ||
      professionalUpdated.specialization ||
      professionalUpdated.specializationName ||
      professionalUpdated.title;

    const department =
      src.department ||
      src.departmentId ||
      professional.department ||
      professional.departmentName ||
      professional.department_name ||
      professionalUpdated.department ||
      professionalUpdated.departmentName ||
      professionalUpdated.department_name;

    const licenseNumber =
      src.licenseNumber ||
      professional.licenseNumber ||
      professional.license_number ||
      professionalUpdated.licenseNumber ||
      professionalUpdated.license_number ||
      updated.licenseNumber;

    const phone =
      personal.phoneNumber ||
      personal.phone ||
      personalUpdated.phoneNumber ||
      personalUpdated.phone ||
      src.phone ||
      src.phoneNumber;

    const email =
      personal.email || personalUpdated.email || src.email || updated.email;

    const statusValue = src.status || src.newStatus || src.isActive || "active";
    const isActive =
      typeof statusValue === "string"
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
}
