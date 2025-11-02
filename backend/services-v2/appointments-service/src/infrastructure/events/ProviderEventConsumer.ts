/**
 * Provider Event Consumer
 * Consumes events from Provider/Staff Service to maintain local read model
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, CQRS, Eventual Consistency
 */

import { ProviderReadModelRepository } from '../repositories/ProviderReadModelRepository';
import { InboxRepository } from '../inbox/InboxRepository';

/**
 * Provider Event Consumer
 * 
 * Subscribed Events:
 * - provider.staff.created
 * - provider.staff.updated
 * - provider.staff.deactivated
 * 
 * Pattern: Inbox Pattern for idempotency
 */
export class ProviderEventConsumer {
  constructor(
    private readonly providerReadRepo: ProviderReadModelRepository,
    private readonly inboxRepo: InboxRepository
  ) {}

  /**
   * Handle provider event (entry point)
   */
  async handle(event: any): Promise<void> {
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
          await this.handleStaffCreated(event);
          break;
        
        case 'provider.staff.updated':
          await this.handleStaffUpdated(event);
          break;
        
        case 'provider.staff.deactivated':
          await this.handleStaffDeactivated(event);
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
        sourceService: 'provider-staff',
        payloadJson: event
      });

      console.log(`[ProviderEventConsumer] ✓ Event ${eventId} processed successfully`);
    } catch (error) {
      console.error(`[ProviderEventConsumer] Error processing event ${eventId}:`, error);
      throw error; // Let RabbitMQ retry
    }
  }

  /**
   * Handle staff created event
   */
  private async handleStaffCreated(event: any): Promise<void> {
    const payload = event.payload || event.data;

    if (!payload) {
      throw new Error('Invalid staff.created event: missing payload');
    }

    const providerId = payload.staffId || payload.providerId;
    if (!providerId) {
      throw new Error('Invalid staff.created event: missing staffId/providerId');
    }

    await this.providerReadRepo.upsert({
      providerId,
      tenantId: payload.tenantId || 'hospital-1',
      fullName: this.extractFullName(payload),
      specialization: this.extractSpecialization(payload),
      department: this.extractDepartment(payload),
      licenseNumber: this.extractLicenseNumber(payload),
      phone: this.extractPhone(payload),
      email: this.extractEmail(payload),
      isActive: this.extractIsActive(payload)
    });

    console.log(`[ProviderEventConsumer] ✓ Provider ${providerId} created in read model`);
  }

  /**
   * Handle staff updated event
   */
  private async handleStaffUpdated(event: any): Promise<void> {
    const payload = event.payload || event.data;

    if (!payload) {
      throw new Error('Invalid staff.updated event: missing payload');
    }

    const providerId = payload.staffId || payload.providerId;
    if (!providerId) {
      throw new Error('Invalid staff.updated event: missing staffId/providerId');
    }

    await this.providerReadRepo.upsert({
      providerId,
      tenantId: payload.tenantId || 'hospital-1',
      fullName: this.extractFullName(payload),
      specialization: this.extractSpecialization(payload),
      department: this.extractDepartment(payload),
      licenseNumber: this.extractLicenseNumber(payload),
      phone: this.extractPhone(payload),
      email: this.extractEmail(payload),
      isActive: this.extractIsActive(payload)
    });

    console.log(`[ProviderEventConsumer] ✓ Provider ${providerId} updated in read model`);
  }

  /**
   * Handle staff deactivated event
   */
  private async handleStaffDeactivated(event: any): Promise<void> {
    const payload = event.payload || event.data;

    if (!payload) {
      throw new Error('Invalid staff.deactivated event: missing payload');
    }

    const providerId = payload.staffId || payload.providerId;
    if (!providerId) {
      throw new Error('Invalid staff.deactivated event: missing staffId/providerId');
    }

    // Update to set isActive = false
    const existing = await this.providerReadRepo.findById(providerId);
    if (existing) {
      await this.providerReadRepo.upsert({
        ...existing,
        isActive: false
      });
    }

    console.log(`[ProviderEventConsumer] ✓ Provider ${providerId} deactivated in read model`);
  }

  /**
   * Handle staff deleted event
   */
  private async handleStaffDeleted(event: any): Promise<void> {
    const payload = event.payload || event.data;

    if (!payload) {
      throw new Error('Invalid staff.deleted event: missing payload');
    }

    const providerId = payload.staffId || payload.providerId;
    if (!providerId) {
      throw new Error('Invalid staff.deleted event: missing staffId/providerId');
    }

    await this.providerReadRepo.delete(providerId);

    console.log(`[ProviderEventConsumer] ✓ Provider ${providerId} deleted from read model`);
  }

  // ==========================================================================
  // Helper Methods - Extract data from various event payload structures
  // ==========================================================================

  private extractFullName(payload: any): string {
    return (
      payload.personalInfo?.fullName ||
      payload.fullName ||
      payload.full_name ||
      `${payload.firstName || ''} ${payload.lastName || ''}`.trim() ||
      'Unknown'
    );
  }

  private extractSpecialization(payload: any): string | undefined {
    // Credentials may have multiple specializations, take first one
    const specializations = payload.credentials?.specializations || payload.specializations;
    if (Array.isArray(specializations) && specializations.length > 0) {
      return specializations[0];
    }
    return (
      payload.specialization ||
      payload.specialty ||
      undefined
    );
  }

  private extractDepartment(payload: any): string | undefined {
    return (
      payload.department ||
      payload.departmentName ||
      payload.department_name ||
      undefined
    );
  }

  private extractLicenseNumber(payload: any): string | undefined {
    return (
      payload.credentials?.licenseNumber ||
      payload.licenseNumber ||
      payload.license_number ||
      undefined
    );
  }

  private extractPhone(payload: any): string | undefined {
    return (
      payload.contactInfo?.primaryPhone ||
      payload.contactInfo?.phone ||
      payload.phone ||
      payload.phoneNumber ||
      undefined
    );
  }

  private extractEmail(payload: any): string | undefined {
    return (
      payload.contactInfo?.email ||
      payload.email ||
      undefined
    );
  }

  private extractIsActive(payload: any): boolean {
    // Default to true if not specified
    if (payload.status === 'ACTIVE' || payload.status === 'active') return true;
    if (payload.status === 'INACTIVE' || payload.status === 'inactive') return false;
    if (payload.isActive !== undefined) return payload.isActive;
    if (payload.is_active !== undefined) return payload.is_active;
    return true; // Default to active
  }
}
