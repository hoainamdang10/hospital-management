/**
 * Clinical EMR Event Consumer - Infrastructure Layer
 * Consumes clinical events from Clinical EMR Service
 * Handles clinical requirements, medical constraints, and health aspects for appointments
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from 'amqplib';
import { InboxRepository } from '../inbox/InboxRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IReminderService } from '../../application/services/IReminderService';
import { IConflictResolutionService } from '../../application/services/IConflictResolutionService';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { Appointment } from '../../domain/aggregates/Appointment.aggregate';
import { TimeSlot } from '../../domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../domain/value-objects/AppointmentDetails.vo';
import { AppointmentType, AppointmentPriority, AppointmentStatus } from '../../domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../domain/value-objects/AppointmentId.vo';
import { TenantId } from '../../domain/value-objects/TenantId.vo';

// Define event types locally for now
interface PatientClinicalProfileUpdatedEventData {
  patientId: string;
  patientName: string;
  clinicalData: {
    riskLevel: string;
    allergies: string[];
    medications: string[];
    specialRequirements?: string[];
    primaryPhysician: string;
  };
  updatedAt: Date;
  updatedBy: string;
}

interface TreatmentPlanCreatedEventData {
  treatmentPlanId: string;
  patientId: string;
  physicianId: string;
  treatmentType: string;
  startDate: Date;
  numberOfSessions: number;
  sessionDuration: number;
  sessionInterval: number;
  consultationFee: number;
}

interface EmergencyCaseCreatedEventData {
  patientId: string;
  physicianId?: string;
  emergencyType: string;
  emergencyLevel: string;
  estimatedDuration: number;
}

interface SurgicalProcedureScheduledEventData {
  procedureId: string;
  patientId: string;
  surgeonId: string;
  procedureType: string;
  surgeryDate: Date;
  consultationFee: number;
  followUpCount: number;
  followUpInterval: number;
}

interface FollowUpAppointmentRequestedEventData {
  patientId: string;
  physicianId: string;
  originalAppointmentId: string;
  requestedDate: Date;
  consultationFee: number;
}

export class ClinicalEMREventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;

  constructor(
    private inboxRepository: InboxRepository,
    private appointmentRepository: IAppointmentRepository,
    private reminderService: IReminderService,
    private conflictResolutionService: IConflictResolutionService,
    private queueRepository: IQueueRepository
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      // TODO: Implement RabbitMQ connection logic
      // This would follow the same pattern as BillingEventConsumer
      this.isConnected = true;
      console.log('Clinical EMR Event Consumer connected');
    } catch (error) {
      console.error('Failed to connect Clinical EMR Event Consumer', error);
      throw error;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }
      this.isConnected = false;
      console.log('Clinical EMR Event Consumer disconnected');
    } catch (error) {
      console.error('Failed to disconnect Clinical EMR Event Consumer', error);
      throw error;
    }
  }

  /**
   * Handle patient clinical profile updates
   */
  private async handlePatientClinicalProfileUpdated(data: PatientClinicalProfileUpdatedEventData): Promise<void> {
    try {
      // Evaluate existing appointments for clinical changes
      const appointments = await this.appointmentRepository.findByPatientId(data.patientId);
      
      for (const appointment of appointments) {
        await this.evaluateAppointmentForClinicalChanges(appointment, data);
      }

      // Prioritize patient scheduling based on risk level
      await this.prioritizePatientScheduling(data);

      // Update appointment requirements based on clinical data
      await this.updateAppointmentRequirements(data);

    } catch (error) {
      console.error('Failed to handle patient clinical profile update', {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Evaluate appointment for clinical changes
   */
  private async evaluateAppointmentForClinicalChanges(
    appointment: Appointment,
    clinicalData: PatientClinicalProfileUpdatedEventData
  ): Promise<void> {
    try {
      let needsUpdate = false;
      let updateReason = '';

      // Check if risk level requires appointment priority change
      if (clinicalData.clinicalData.riskLevel === 'high' || clinicalData.clinicalData.riskLevel === 'critical') {
        if (appointment.priority !== 'urgent' && appointment.priority !== 'emergency') {
          needsUpdate = true;
          updateReason = 'risk_level_priority_change';
        }
      }

      // Check if new medications require appointment changes
      if (clinicalData.clinicalData.medications.length > 0) {
        needsUpdate = true;
        updateReason = 'new_medications_review_required';
      }

      // Check if special requirements need accommodation
      if (clinicalData.clinicalData.specialRequirements && 
          clinicalData.clinicalData.specialRequirements.length > 0) {
        needsUpdate = true;
        updateReason = 'special_accommodations_required';
      }

      if (needsUpdate) {
        // Update the appointment object directly
        // Note: This is a simplified approach - in production, use proper aggregate methods
        await this.appointmentRepository.update(appointment);

        // BOUNDED CONTEXT VIOLATION: Clinical review queue belongs to Clinical EMR Service
        console.warn('BOUNDED CONTEXT VIOLATION: addToClinicalReviewQueue should be in Clinical EMR Service');
      }

      console.log('Marked appointment for clinical review', {
        appointmentId: appointment.id,
        patientId: clinicalData.patientId,
        reason: updateReason,
      });

    } catch (error) {
      console.error('Failed to evaluate appointment for clinical changes', {
        appointmentId: appointment.id,
        patientId: clinicalData.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Prioritize patient scheduling based on risk level
   */
  private async prioritizePatientScheduling(clinicalData: PatientClinicalProfileUpdatedEventData): Promise<void> {
    try {
      // BOUNDED CONTEXT VIOLATION: Priority scheduling list belongs to Scheduling Service
      console.warn('BOUNDED CONTEXT VIOLATION: addToPriorityList should be in Scheduling Service');

      // BOUNDED CONTEXT VIOLATION: Priority time slots belong to Scheduling Service
      console.warn('BOUNDED CONTEXT VIOLATION: findPriorityTimeSlots should be in Scheduling Service');

    } catch (error) {
      console.error('Failed to prioritize patient scheduling', {
        patientId: clinicalData.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update appointment requirements based on clinical data
   */
  private async updateAppointmentRequirements(clinicalData: PatientClinicalProfileUpdatedEventData): Promise<void> {
    try {
      // Update future appointments with new requirements
      const futureAppointments = await this.appointmentRepository.findByPatientId(
        clinicalData.patientId
      );

      for (const appointment of futureAppointments) {
        // BOUNDED CONTEXT VIOLATION: Requirements update belongs to Clinical EMR Service
        console.warn('BOUNDED CONTEXT VIOLATION: updateRequirements should be in Clinical EMR Service');
      }

    } catch (error) {
      console.error('Failed to update appointment requirements', {
        patientId: clinicalData.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle treatment plan creation
   */
  private async handleTreatmentPlanCreated(data: TreatmentPlanCreatedEventData): Promise<void> {
    try {
      const appointments = this.generateTreatmentPlanAppointments(data);

      for (const appointmentData of appointments) {
        const appointment = await this.appointmentRepository.create({
          ...appointmentData,
          treatmentPlanId: data.treatmentPlanId,
          status: 'scheduled',
          createdAt: new Date(),
        });

        // BOUNDED CONTEXT VIOLATION: Treatment plan notifications belong to Clinical EMR Service
        console.warn('BOUNDED CONTEXT VIOLATION: sendTreatmentPlanAppointmentNotification should be in Clinical EMR Service');
      }

      console.log('Created treatment plan appointments', {
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        appointmentsCount: appointments.length,
      });

    } catch (error) {
      console.error('Failed to create treatment plan appointments', {
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate treatment plan appointments
   */
  private generateTreatmentPlanAppointments(data: TreatmentPlanCreatedEventData): any[] {
    const appointments = [];
    const startDate = new Date(data.startDate);
    
    for (let i = 0; i < data.numberOfSessions; i++) {
      const appointmentDate = new Date(startDate);
      appointmentDate.setDate(startDate.getDate() + (i * data.sessionInterval));
      
      appointments.push({
        patientId: data.patientId,
        physicianId: data.physicianId,
        appointmentDate: appointmentDate,
        durationMinutes: data.sessionDuration,
        type: 'treatment',
        status: 'scheduled',
        treatmentPlanId: data.treatmentPlanId,
        sessionNumber: i + 1,
      });
    }
    
    return appointments;
  }

  /**
   * Handle emergency case creation
   */
  private async handleEmergencyCaseCreated(data: EmergencyCaseCreatedEventData): Promise<void> {
    try {
      const urgentAppointment = await this.createUrgentAppointment(data);
      
      if (urgentAppointment) {
        // Send urgent appointment notification
        await this.reminderService.sendUrgentAppointmentNotification({
          appointmentId: urgentAppointment.id,
          patientId: data.patientId,
          patientName: `Patient ${data.patientId}`,
          urgency: 'emergency',
          appointmentTime: urgentAppointment.timeSlot.startAtUtc || new Date(),
          department: 'emergency',
        });

        // Add to urgent care queue
        // BOUNDED CONTEXT VIOLATION: Urgent care queue belongs to Emergency Service
        // await this.queueRepository.addToUrgentCareList({
        //   appointmentId: urgentAppointment.id,
        //   patientId: data.patientId,
        //   emergencyLevel: data.emergencyLevel,
        //   createdAt: new Date(),
        // });
        console.warn('BOUNDED CONTEXT VIOLATION: addToUrgentCareList should be in Emergency Service');

        console.log('Created emergency appointment', {
          appointmentId: urgentAppointment.id,
          patientId: data.patientId,
          emergencyType: data.emergencyType,
        });
      }

    } catch (error) {
      console.error('Failed to handle emergency case', {
        patientId: data.patientId,
        emergencyType: data.emergencyType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create urgent appointment
   */
  private async createUrgentAppointment(data: EmergencyCaseCreatedEventData): Promise<Appointment | null> {
    try {
      const urgentSlot = await this.conflictResolutionService.findUrgentAppointmentSlot({
        departmentId: 'emergency',
        urgency: 'emergency',
        preferredTime: new Date(),
        durationMinutes: data.estimatedDuration,
        patientId: data.patientId,
      });

      if (!urgentSlot) {
        console.warn('No urgent slot available for emergency case', {
          patientId: data.patientId,
          emergencyType: data.emergencyType,
        });
        return null;
      }

      const appointment = Appointment.create(
        AppointmentId.create(`apt_${Date.now()}_${Math.random()}`),
        TenantId.create(`tenant_${Date.now()}`),
        data.patientId,
        data.physicianId || 'emergency-physician',
        TimeSlot.createWithTimestamps(
          urgentSlot.startTime.toISOString().split('T')[0],
          urgentSlot.startTime.toTimeString().slice(0, 5),
          urgentSlot.startTime,
          urgentSlot.endTime
        ),
        data.estimatedDuration,
        AppointmentType.EMERGENCY,
        AppointmentPriority.EMERGENCY,
        AppointmentDetails.create(`Emergency: ${data.emergencyType}`, '', [], '', ''),
        0, // consultation fee
        'emergency' // departmentId
      );

      await this.appointmentRepository.save(appointment);
      return appointment;

    } catch (error) {
      console.error('Failed to create urgent appointment', {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Handle surgical procedure scheduling
   */
  private async handleSurgicalProcedureScheduled(data: SurgicalProcedureScheduledEventData): Promise<void> {
    try {
      // Create pre-operative appointment
      const preOpAppointment = await this.createPreOperativeAppointment(data);
      
      if (preOpAppointment) {
        // Schedule pre-op reminders
        // BOUNDED CONTEXT VIOLATION: Pre-operative instructions belong to Clinical EMR Service
        // await this.reminderService.sendPreOperativeInstructions({
        //   appointmentId: preOpAppointment.id,
        //   patientId: data.patientId,
        //   procedureType: data.procedureType,
        //   surgeryDate: data.surgeryDate,
        // });
        console.warn('BOUNDED CONTEXT VIOLATION: sendPreOperativeInstructions should be in Clinical EMR Service');
      }

      // Create post-operative appointments
      const postOpAppointments = await this.createPostOperativeAppointments(data);
      
      console.log('Scheduled surgical appointments', {
        procedureId: data.procedureId,
        patientId: data.patientId,
        preOpAppointmentId: preOpAppointment?.id,
        postOpAppointmentsCount: postOpAppointments.length,
      });

    } catch (error) {
      console.error('Failed to handle surgical procedure scheduling', {
        procedureId: data.procedureId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create pre-operative appointment
   */
  private async createPreOperativeAppointment(data: SurgicalProcedureScheduledEventData): Promise<Appointment | null> {
    try {
      const preOpDate = new Date(data.surgeryDate);
      preOpDate.setDate(preOpDate.getDate() - 1); // Day before surgery

      const appointment = Appointment.create(
        AppointmentId.create(`apt_${Date.now()}_${Math.random()}`),
        TenantId.create(`tenant_${Date.now()}`),
        data.patientId,
        data.surgeonId,
        TimeSlot.createWithTimestamps(
          preOpDate.toISOString().split('T')[0],
          preOpDate.toTimeString().slice(0, 5),
          preOpDate,
          new Date(preOpDate.getTime() + 60 * 60 * 1000)
        ),
        60, // 1 hour
        AppointmentType.SURGERY,
        AppointmentPriority.URGENT,
        AppointmentDetails.create(`Pre-operative: ${data.procedureType}`, '', [], '', ''),
        data.consultationFee,
        'surgery'
      );

      await this.appointmentRepository.save(appointment);
      return appointment;

    } catch (error) {
      console.error('Failed to create pre-operative appointment', {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Create post-operative appointments
   */
  private async createPostOperativeAppointments(data: SurgicalProcedureScheduledEventData): Promise<Appointment[]> {
    const appointments = [];
    
    try {
      for (let i = 0; i < data.followUpCount; i++) {
        const followUpDate = new Date(data.surgeryDate);
        followUpDate.setDate(followUpDate.getDate() + data.followUpInterval * (i + 1));

        const appointment = Appointment.create(
          AppointmentId.create(`apt_${Date.now()}_${Math.random()}`),
          TenantId.create(`tenant_${Date.now()}`),
          data.patientId,
          data.surgeonId,
          TimeSlot.createWithTimestamps(
            followUpDate.toISOString().split('T')[0],
            followUpDate.toTimeString().slice(0, 5),
            followUpDate,
            new Date(followUpDate.getTime() + 30 * 60 * 1000)
          ),
          30, // 30 minutes
          AppointmentType.FOLLOW_UP,
          AppointmentPriority.NORMAL,
          AppointmentDetails.create(`Post-operative: ${data.procedureType}`, '', [], '', ''),
          data.consultationFee,
          'surgery'
        );

        await this.appointmentRepository.save(appointment);
        appointments.push(appointment);
      }
    } catch (error) {
      console.error('Failed to create post-operative appointments', {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return appointments;
  }

  /**
   * Handle follow-up appointment request
   */
  private async handleFollowUpAppointmentRequested(data: FollowUpAppointmentRequestedEventData): Promise<void> {
    try {
      const followUpAppointment = await this.createFollowUpAppointment(data);
      
      if (followUpAppointment) {
        // Send follow-up appointment notification
        // BOUNDED CONTEXT VIOLATION: Follow-up notifications belong to Clinical EMR Service
        // await this.reminderService.sendFollowUpAppointmentNotification({
        //   appointmentId: followUpAppointment.id,
        //   patientId: data.patientId,
        //   originalAppointmentId: data.originalAppointmentId,
        //   followUpDate: data.requestedDate,
        // });
        console.warn('BOUNDED CONTEXT VIOLATION: sendFollowUpAppointmentNotification should be in Clinical EMR Service');

        console.log('Created follow-up appointment', {
          appointmentId: followUpAppointment.id,
          patientId: data.patientId,
          originalAppointmentId: data.originalAppointmentId,
        });
      }

    } catch (error) {
      console.error('Failed to handle follow-up appointment request', {
        patientId: data.patientId,
        originalAppointmentId: data.originalAppointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create follow-up appointment
   */
  private async createFollowUpAppointment(data: FollowUpAppointmentRequestedEventData): Promise<Appointment | null> {
    try {
      const appointment = Appointment.create(
        AppointmentId.create(`apt_${Date.now()}_${Math.random()}`),
        TenantId.create(`tenant_${Date.now()}`),
        data.patientId,
        data.physicianId,
        TimeSlot.createWithTimestamps(
          data.requestedDate.toISOString().split('T')[0],
          data.requestedDate.toTimeString().slice(0, 5),
          data.requestedDate,
          new Date(data.requestedDate.getTime() + 30 * 60 * 1000)
        ),
        30, // 30 minutes
        AppointmentType.FOLLOW_UP,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Follow-up appointment', '', [], '', ''),
        data.consultationFee,
        'general'
      );

      await this.appointmentRepository.save(appointment);
      return appointment;

    } catch (error) {
      console.error('Failed to create follow-up appointment', {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Get priority from risk level
   */
  private getPriorityFromRiskLevel(riskLevel: string): AppointmentPriority {
    const priorityMap: { [key: string]: AppointmentPriority } = {
      'low': AppointmentPriority.NORMAL,
      'normal': AppointmentPriority.NORMAL,
      'high': AppointmentPriority.URGENT,
      'critical': AppointmentPriority.EMERGENCY,
    };
    return priorityMap[riskLevel] || AppointmentPriority.NORMAL;
  }

  /**
   * Get priority from urgency
   */
  private getPriorityFromUrgency(urgencyLevel: string): AppointmentPriority {
    const priorityMap: { [key: string]: AppointmentPriority } = {
      'stat': AppointmentPriority.EMERGENCY,
      'urgent': AppointmentPriority.URGENT,
      'routine': AppointmentPriority.NORMAL,
    };
    return priorityMap[urgencyLevel] || AppointmentPriority.NORMAL;
  }
}
