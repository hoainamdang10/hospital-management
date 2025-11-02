/**
 * Patient Event Consumer
 * Consumes events from Patient Registry Service to maintain local read model
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, CQRS, Eventual Consistency
 */

import { PatientReadModelRepository } from '../repositories/PatientReadModelRepository';
import { InboxRepository } from '../inbox/InboxRepository';

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
export class PatientEventConsumer {
  constructor(
    private readonly patientReadRepo: PatientReadModelRepository,
    private readonly inboxRepo: InboxRepository
  ) {}

  /**
   * Handle patient event (entry point)
   */
  async handle(event: any): Promise<void> {
    // Extract event metadata
    const eventId = event.eventId || event.id || event.metadata?.eventId;
    const eventType = event.eventType || event.type;

    if (!eventId) {
      console.error('[PatientEventConsumer] Missing eventId, cannot process:', event);
      return;
    }

    // Idempotency check
    if (await this.inboxRepo.exists(eventId)) {
      console.debug(`[PatientEventConsumer] Duplicate event ${eventId}, skipping`);
      return;
    }

    console.log(`[PatientEventConsumer] Processing event: ${eventType} (${eventId})`);

    try {
      // Route to handler based on event type
      switch (eventType) {
        case 'patient.patient.registered':
          await this.handlePatientRegistered(event);
          break;
        
        case 'patient.patient.updated':
          await this.handlePatientUpdated(event);
          break;
        
        case 'patient.patient.deactivated':
          await this.handlePatientDeactivated(event);
          break;
        
        case 'patient.patient.deleted':
          await this.handlePatientDeleted(event);
          break;
        
        default:
          console.warn(`[PatientEventConsumer] Unknown event type: ${eventType}`);
          // Still save to inbox to avoid reprocessing
      }

      // Mark as processed
      await this.inboxRepo.save({
        eventId,
        eventType,
        sourceService: 'patient-registry',
        payloadJson: event
      });

      console.log(`[PatientEventConsumer] ✓ Event ${eventId} processed successfully`);
    } catch (error) {
      console.error(`[PatientEventConsumer] Error processing event ${eventId}:`, error);
      throw error; // Let RabbitMQ retry
    }
  }

  /**
   * Handle patient registered event
   */
  private async handlePatientRegistered(event: any): Promise<void> {
    const payload = event.payload || event.data;

    if (!payload || !payload.patientId) {
      throw new Error('Invalid patient.registered event: missing patientId');
    }

    await this.patientReadRepo.upsert({
      patientId: payload.patientId,
      tenantId: payload.tenantId || 'hospital-1',
      fullName: this.extractFullName(payload),
      phone: this.extractPhone(payload),
      email: this.extractEmail(payload),
      dateOfBirth: this.extractDateOfBirth(payload),
      gender: this.extractGender(payload),
      nationalId: this.extractNationalId(payload),
      insuranceNumber: this.extractInsuranceNumber(payload),
      insuranceType: this.extractInsuranceType(payload),
      address: this.extractAddress(payload)
    });

    console.log(`[PatientEventConsumer] ✓ Patient ${payload.patientId} registered in read model`);
  }

  /**
   * Handle patient updated event
   */
  private async handlePatientUpdated(event: any): Promise<void> {
    const payload = event.payload || event.data;

    if (!payload || !payload.patientId) {
      throw new Error('Invalid patient.updated event: missing patientId');
    }

    await this.patientReadRepo.upsert({
      patientId: payload.patientId,
      tenantId: payload.tenantId || 'hospital-1',
      fullName: this.extractFullName(payload),
      phone: this.extractPhone(payload),
      email: this.extractEmail(payload),
      dateOfBirth: this.extractDateOfBirth(payload),
      gender: this.extractGender(payload),
      nationalId: this.extractNationalId(payload),
      insuranceNumber: this.extractInsuranceNumber(payload),
      insuranceType: this.extractInsuranceType(payload),
      address: this.extractAddress(payload)
    });

    console.log(`[PatientEventConsumer] ✓ Patient ${payload.patientId} updated in read model`);
  }

  /**
   * Handle patient deactivated event
   */
  private async handlePatientDeactivated(event: any): Promise<void> {
    const payload = event.payload || event.data;

    if (!payload || !payload.patientId) {
      throw new Error('Invalid patient.deactivated event: missing patientId');
    }

    // Option 1: Keep in read model with deactivated flag (if needed in future)
    // Option 2: Delete from read model
    // For now, we keep the data (appointments history still needs it)
    
    console.log(`[PatientEventConsumer] ✓ Patient ${payload.patientId} deactivated (kept in read model)`);
  }

  /**
   * Handle patient deleted event
   */
  private async handlePatientDeleted(event: any): Promise<void> {
    const payload = event.payload || event.data;

    if (!payload || !payload.patientId) {
      throw new Error('Invalid patient.deleted event: missing patientId');
    }

    await this.patientReadRepo.delete(payload.patientId);

    console.log(`[PatientEventConsumer] ✓ Patient ${payload.patientId} deleted from read model`);
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

  private extractDateOfBirth(payload: any): Date | undefined {
    const dob = payload.personalInfo?.dateOfBirth || payload.dateOfBirth || payload.dob;
    return dob ? new Date(dob) : undefined;
  }

  private extractGender(payload: any): string | undefined {
    return (
      payload.personalInfo?.gender ||
      payload.gender ||
      undefined
    );
  }

  private extractNationalId(payload: any): string | undefined {
    return (
      payload.personalInfo?.nationalId ||
      payload.nationalId ||
      payload.national_id ||
      undefined
    );
  }

  private extractInsuranceNumber(payload: any): string | undefined {
    return (
      payload.insuranceInfo?.number ||
      payload.insuranceNumber ||
      payload.insurance_number ||
      undefined
    );
  }

  private extractInsuranceType(payload: any): string | undefined {
    return (
      payload.insuranceInfo?.type ||
      payload.insuranceType ||
      payload.insurance_type ||
      undefined
    );
  }

  private extractAddress(payload: any): any {
    return (
      payload.contactInfo?.address ||
      payload.address ||
      undefined
    );
  }
}
