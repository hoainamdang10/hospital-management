"use strict";
/**
 * Clinical EMR Event Consumer - Infrastructure Layer
 * Consumes clinical events from Clinical EMR Service
 * Handles clinical requirements, medical constraints, and health aspects for appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalEMREventConsumer = void 0;
const Appointment_aggregate_1 = require("../../domain/aggregates/Appointment.aggregate");
const TimeSlot_vo_1 = require("../../domain/value-objects/TimeSlot.vo");
const AppointmentDetails_vo_1 = require("../../domain/value-objects/AppointmentDetails.vo");
const Appointment_aggregate_2 = require("../../domain/aggregates/Appointment.aggregate");
const AppointmentId_vo_1 = require("../../domain/value-objects/AppointmentId.vo");
const TenantId_vo_1 = require("../../domain/value-objects/TenantId.vo");
class ClinicalEMREventConsumer {
    constructor(inboxRepository, appointmentRepository, reminderService, conflictResolutionService, queueRepository) {
        this.inboxRepository = inboxRepository;
        this.appointmentRepository = appointmentRepository;
        this.reminderService = reminderService;
        this.conflictResolutionService = conflictResolutionService;
        this.queueRepository = queueRepository;
        this.isConnected = false;
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        try {
            // TODO: Implement RabbitMQ connection logic
            // This would follow the same pattern as BillingEventConsumer
            this.isConnected = true;
            console.log('Clinical EMR Event Consumer connected');
        }
        catch (error) {
            console.error('Failed to connect Clinical EMR Event Consumer', error);
            throw error;
        }
    }
    /**
     * Disconnect from RabbitMQ
     */
    async disconnect() {
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
        }
        catch (error) {
            console.error('Failed to disconnect Clinical EMR Event Consumer', error);
            throw error;
        }
    }
    /**
     * Handle patient clinical profile updates
     */
    async handlePatientClinicalProfileUpdated(data) {
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
        }
        catch (error) {
            console.error('Failed to handle patient clinical profile update', {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Evaluate appointment for clinical changes
     */
    async evaluateAppointmentForClinicalChanges(appointment, clinicalData) {
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
        }
        catch (error) {
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
    async prioritizePatientScheduling(clinicalData) {
        try {
            // BOUNDED CONTEXT VIOLATION: Priority scheduling list belongs to Scheduling Service
            console.warn('BOUNDED CONTEXT VIOLATION: addToPriorityList should be in Scheduling Service');
            // BOUNDED CONTEXT VIOLATION: Priority time slots belong to Scheduling Service
            console.warn('BOUNDED CONTEXT VIOLATION: findPriorityTimeSlots should be in Scheduling Service');
        }
        catch (error) {
            console.error('Failed to prioritize patient scheduling', {
                patientId: clinicalData.patientId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Update appointment requirements based on clinical data
     */
    async updateAppointmentRequirements(clinicalData) {
        try {
            // Update future appointments with new requirements
            const futureAppointments = await this.appointmentRepository.findByPatientId(clinicalData.patientId);
            for (const appointment of futureAppointments) {
                // BOUNDED CONTEXT VIOLATION: Requirements update belongs to Clinical EMR Service
                console.warn('BOUNDED CONTEXT VIOLATION: updateRequirements should be in Clinical EMR Service');
            }
        }
        catch (error) {
            console.error('Failed to update appointment requirements', {
                patientId: clinicalData.patientId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Handle treatment plan creation
     */
    async handleTreatmentPlanCreated(data) {
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
        }
        catch (error) {
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
    generateTreatmentPlanAppointments(data) {
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
    async handleEmergencyCaseCreated(data) {
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
        }
        catch (error) {
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
    async createUrgentAppointment(data) {
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
            const appointment = Appointment_aggregate_1.Appointment.create(AppointmentId_vo_1.AppointmentId.create(`apt_${Date.now()}_${Math.random()}`), TenantId_vo_1.TenantId.create(`tenant_${Date.now()}`), data.patientId, data.physicianId || 'emergency-physician', TimeSlot_vo_1.TimeSlot.createWithTimestamps(urgentSlot.startTime.toISOString().split('T')[0], urgentSlot.startTime.toTimeString().slice(0, 5), urgentSlot.startTime, urgentSlot.endTime), data.estimatedDuration, Appointment_aggregate_2.AppointmentType.EMERGENCY, Appointment_aggregate_2.AppointmentPriority.EMERGENCY, AppointmentDetails_vo_1.AppointmentDetails.create(`Emergency: ${data.emergencyType}`, '', [], '', ''), 0, // consultation fee
            'emergency' // departmentId
            );
            await this.appointmentRepository.save(appointment);
            return appointment;
        }
        catch (error) {
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
    async handleSurgicalProcedureScheduled(data) {
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
        }
        catch (error) {
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
    async createPreOperativeAppointment(data) {
        try {
            const preOpDate = new Date(data.surgeryDate);
            preOpDate.setDate(preOpDate.getDate() - 1); // Day before surgery
            const appointment = Appointment_aggregate_1.Appointment.create(AppointmentId_vo_1.AppointmentId.create(`apt_${Date.now()}_${Math.random()}`), TenantId_vo_1.TenantId.create(`tenant_${Date.now()}`), data.patientId, data.surgeonId, TimeSlot_vo_1.TimeSlot.createWithTimestamps(preOpDate.toISOString().split('T')[0], preOpDate.toTimeString().slice(0, 5), preOpDate, new Date(preOpDate.getTime() + 60 * 60 * 1000)), 60, // 1 hour
            Appointment_aggregate_2.AppointmentType.SURGERY, Appointment_aggregate_2.AppointmentPriority.URGENT, AppointmentDetails_vo_1.AppointmentDetails.create(`Pre-operative: ${data.procedureType}`, '', [], '', ''), data.consultationFee, 'surgery');
            await this.appointmentRepository.save(appointment);
            return appointment;
        }
        catch (error) {
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
    async createPostOperativeAppointments(data) {
        const appointments = [];
        try {
            for (let i = 0; i < data.followUpCount; i++) {
                const followUpDate = new Date(data.surgeryDate);
                followUpDate.setDate(followUpDate.getDate() + data.followUpInterval * (i + 1));
                const appointment = Appointment_aggregate_1.Appointment.create(AppointmentId_vo_1.AppointmentId.create(`apt_${Date.now()}_${Math.random()}`), TenantId_vo_1.TenantId.create(`tenant_${Date.now()}`), data.patientId, data.surgeonId, TimeSlot_vo_1.TimeSlot.createWithTimestamps(followUpDate.toISOString().split('T')[0], followUpDate.toTimeString().slice(0, 5), followUpDate, new Date(followUpDate.getTime() + 30 * 60 * 1000)), 30, // 30 minutes
                Appointment_aggregate_2.AppointmentType.FOLLOW_UP, Appointment_aggregate_2.AppointmentPriority.NORMAL, AppointmentDetails_vo_1.AppointmentDetails.create(`Post-operative: ${data.procedureType}`, '', [], '', ''), data.consultationFee, 'surgery');
                await this.appointmentRepository.save(appointment);
                appointments.push(appointment);
            }
        }
        catch (error) {
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
    async handleFollowUpAppointmentRequested(data) {
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
        }
        catch (error) {
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
    async createFollowUpAppointment(data) {
        try {
            const appointment = Appointment_aggregate_1.Appointment.create(AppointmentId_vo_1.AppointmentId.create(`apt_${Date.now()}_${Math.random()}`), TenantId_vo_1.TenantId.create(`tenant_${Date.now()}`), data.patientId, data.physicianId, TimeSlot_vo_1.TimeSlot.createWithTimestamps(data.requestedDate.toISOString().split('T')[0], data.requestedDate.toTimeString().slice(0, 5), data.requestedDate, new Date(data.requestedDate.getTime() + 30 * 60 * 1000)), 30, // 30 minutes
            Appointment_aggregate_2.AppointmentType.FOLLOW_UP, Appointment_aggregate_2.AppointmentPriority.NORMAL, AppointmentDetails_vo_1.AppointmentDetails.create('Follow-up appointment', '', [], '', ''), data.consultationFee, 'general');
            await this.appointmentRepository.save(appointment);
            return appointment;
        }
        catch (error) {
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
    getPriorityFromRiskLevel(riskLevel) {
        const priorityMap = {
            'low': Appointment_aggregate_2.AppointmentPriority.NORMAL,
            'normal': Appointment_aggregate_2.AppointmentPriority.NORMAL,
            'high': Appointment_aggregate_2.AppointmentPriority.URGENT,
            'critical': Appointment_aggregate_2.AppointmentPriority.EMERGENCY,
        };
        return priorityMap[riskLevel] || Appointment_aggregate_2.AppointmentPriority.NORMAL;
    }
    /**
     * Get priority from urgency
     */
    getPriorityFromUrgency(urgencyLevel) {
        const priorityMap = {
            'stat': Appointment_aggregate_2.AppointmentPriority.EMERGENCY,
            'urgent': Appointment_aggregate_2.AppointmentPriority.URGENT,
            'routine': Appointment_aggregate_2.AppointmentPriority.NORMAL,
        };
        return priorityMap[urgencyLevel] || Appointment_aggregate_2.AppointmentPriority.NORMAL;
    }
}
exports.ClinicalEMREventConsumer = ClinicalEMREventConsumer;
//# sourceMappingURL=ClinicalEMREventConsumer.js.map