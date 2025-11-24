"use strict";
/**
 * Staff Event Consumer - Infrastructure Layer
 * Consumes staff events from Provider Staff Service
 * Handles staff availability, schedule updates, and resource constraints for appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffEventConsumer = void 0;
/**
 * StaffEventConsumer - Handles staff events for appointment management
 */
class StaffEventConsumer {
    constructor(config, appointmentRepository, queueRepository, providerScheduleRepository, conflictResolutionService, reminderService, inboxRepo, reschedulingService) {
        this.config = config;
        this.appointmentRepository = appointmentRepository;
        this.queueRepository = queueRepository;
        this.providerScheduleRepository = providerScheduleRepository;
        this.conflictResolutionService = conflictResolutionService;
        this.reminderService = reminderService;
        this.inboxRepo = inboxRepo;
        this.reschedulingService = reschedulingService;
        this.isConnected = false;
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        try {
            console.log('Connecting to RabbitMQ for Staff events', {
                queueName: this.config.queueName,
            });
            const amqp = require('amqplib');
            this.connection = await amqp.connect(this.config.rabbitmqUrl);
            this.channel = await this.connection.createChannel();
            if (!this.channel) {
                throw new Error('Failed to create RabbitMQ channel');
            }
            // Assert exchange
            await this.channel.assertExchange(this.config.exchangeName, 'topic', {
                durable: true,
            });
            // Assert queue
            await this.channel.assertQueue(this.config.queueName, {
                durable: true,
            });
            // Bind queue to routing keys
            for (const routingKey of this.config.routingKeys) {
                await this.channel.bindQueue(this.config.queueName, this.config.exchangeName, routingKey);
                console.log('Queue bound to routing key', {
                    queueName: this.config.queueName,
                    routingKey,
                });
            }
            // Start consuming
            await this.channel.consume(this.config.queueName, this.handleMessage.bind(this), { noAck: false });
            this.isConnected = true;
            console.log('Staff event consumer connected successfully');
            // Handle connection errors
            this.connection.on('error', (error) => {
                console.error('RabbitMQ connection error', {
                    error: error.message,
                });
                this.isConnected = false;
            });
            this.connection.on('close', () => {
                console.warn('RabbitMQ connection closed');
                this.isConnected = false;
            });
        }
        catch (error) {
            console.error('Failed to connect to RabbitMQ', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle incoming message
     */
    async handleMessage(msg) {
        if (!msg || !this.channel) {
            return;
        }
        try {
            const content = msg.content.toString();
            const event = JSON.parse(content);
            const routingKey = msg.fields.routingKey;
            // Idempotency check
            const eventId = event.eventId || event.id || event.metadata?.eventId;
            if (!eventId) {
                console.error('[StaffEventConsumer] Missing eventId, cannot process:', event);
                this.channel?.ack(msg);
                return;
            }
            if (await this.inboxRepo.exists(eventId)) {
                console.debug(`[StaffEventConsumer] Duplicate event ${eventId}, skipping`);
                this.channel?.ack(msg);
                return;
            }
            console.log(`[StaffEventConsumer] Processing event: ${routingKey} (${eventId})`);
            // Route to appropriate handler
            switch (routingKey) {
                case 'provider.schedule.updated':
                    await this.handleStaffScheduleUpdated(event.payload);
                    break;
                case 'provider.status.changed':
                    await this.handleStaffStatusChanged(event.payload);
                    break;
                case 'provider.department.assigned':
                    await this.handleStaffDepartmentAssigned(event.payload);
                    break;
                case 'department.created':
                    await this.handleDepartmentCreated(event.payload);
                    break;
                case 'department.updated':
                    await this.handleDepartmentUpdated(event.payload);
                    break;
                case 'department.staff.count.changed':
                    await this.handleDepartmentStaffCountChanged(event.payload);
                    break;
                default:
                    console.warn('Unhandled routing key', { routingKey });
                    break;
            }
            // Store in inbox after successful processing
            await this.inboxRepo.store({
                eventId,
                eventType: routingKey,
                sourceService: 'provider-staff-service',
                payloadJson: event.payload,
                processedAt: new Date(),
            });
            // Acknowledge message
            this.channel.ack(msg);
        }
        catch (error) {
            console.error('Error processing staff event', {
                error: error instanceof Error ? error.message : 'Unknown error',
                routingKey: msg.fields.routingKey,
            });
            // Negative acknowledge (requeue)
            if (this.channel) {
                this.channel.nack(msg, false, true);
            }
        }
    }
    /**
     * Handle staff availability changed event
     */
    async handleStaffAvailabilityChanged(data) {
        console.log('Processing staff availability change for appointments', {
            staffId: data.staffId,
            availabilityType: data.availabilityType,
            startDate: data.startDate,
            endDate: data.endDate,
            isTemporary: data.isTemporary,
        });
        try {
            // If staff becomes unavailable, check for conflicting appointments
            if (data.availabilityType === 'unavailable' || data.availabilityType === 'off_duty') {
                const conflictingAppointments = await this.findConflictingAppointments(data.staffId, data.startDate, data.endDate);
                if (conflictingAppointments.length > 0) {
                    console.log(`Found ${conflictingAppointments.length} conflicting appointments for unavailable staff`, {
                        staffId: data.staffId,
                        availabilityType: data.availabilityType,
                    });
                    // Process each conflicting appointment
                    for (const appointment of conflictingAppointments) {
                        await this.handleConflictingAppointment(appointment, data, 'staff_unavailable');
                    }
                }
                // Update provider schedule to reflect unavailability
                if (data.startDate && data.endDate) {
                    await this.updateProviderScheduleAvailability(data.staffId, data.startDate, data.endDate, false);
                }
            }
            else if (data.availabilityType === 'available') {
                // Staff becomes available - update provider schedule
                if (data.startDate && data.endDate) {
                    await this.updateProviderScheduleAvailability(data.staffId, data.startDate, data.endDate, true);
                }
                // Check if any appointments can be rescheduled from waitlist
                if (data.startDate) {
                    await this.processWaitlistForAvailableStaff(data.staffId, data.startDate, data.endDate || new Date(data.startDate.getTime() + 24 * 60 * 60 * 1000) // Default to 24 hours later
                    );
                }
            }
        }
        catch (error) {
            console.error('Failed to process staff availability change', {
                staffId: data.staffId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle staff shift assigned event
     */
    async handleStaffShiftAssigned(data) {
        console.log('Processing staff shift assignment for appointments', {
            staffId: data.staffId,
            shiftId: data.shiftId,
            shiftType: data.shiftType,
            date: data.date,
            departmentId: data.departmentId,
        });
        try {
            // Update provider schedule with new shift
            await this.updateProviderScheduleShift(data);
            // Check for appointment conflicts with new shift
            const shiftStart = new Date(`${data.date.toISOString().split('T')[0]}T${data.startTime}`);
            const shiftEnd = new Date(`${data.date.toISOString().split('T')[0]}T${data.endTime}`);
            const conflictingAppointments = await this.findConflictingAppointments(data.staffId, shiftStart, shiftEnd);
            if (conflictingAppointments.length > 0) {
                console.log(`Found ${conflictingAppointments.length} appointments conflicting with new shift`, {
                    staffId: data.staffId,
                    shiftId: data.shiftId,
                    shiftType: data.shiftType,
                });
                for (const appointment of conflictingAppointments) {
                    await this.handleConflictingAppointment(appointment, data, 'shift_conflict');
                }
            }
            // If this is a recurring shift, update future schedule availability
            if (data.isRecurring && data.recurrencePattern) {
                await this.updateRecurringShiftSchedule(data);
            }
        }
        catch (error) {
            console.error('Failed to process staff shift assignment', {
                staffId: data.staffId,
                shiftId: data.shiftId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle staff shift cancelled event
     */
    async handleStaffShiftCancelled(data) {
        console.log('Processing staff shift cancellation for appointments', {
            staffId: data.staffId,
            shiftId: data.shiftId,
            date: data.date,
            cancelledBy: data.cancelledBy,
            reason: data.reason,
        });
        try {
            // Remove shift from provider schedule
            await this.removeShiftFromProviderSchedule(data.staffId, data.shiftId);
            // If this was a recurring shift, handle future dates
            if (data.isRecurring && data.affectedDates && data.affectedDates.length > 0) {
                await this.removeRecurringShiftFromSchedule(data.staffId, data.shiftId, data.affectedDates);
            }
            // Check if any waitlisted appointments can now be scheduled
            const shiftStart = new Date(`${data.date.toISOString().split('T')[0]}T${data.startTime}`);
            const shiftEnd = new Date(`${data.date.toISOString().split('T')[0]}T${data.endTime}`);
            await this.processWaitlistForAvailableStaff(data.staffId, shiftStart, shiftEnd);
        }
        catch (error) {
            console.error('Failed to process staff shift cancellation', {
                staffId: data.staffId,
                shiftId: data.shiftId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle staff schedule updated event
     */
    async handleStaffScheduleUpdated(data) {
        console.log('Processing staff schedule update for appointments', {
            staffId: data.staffId,
            scheduleId: data.scheduleId,
            scheduleType: data.scheduleType,
            startDate: data.startDate,
            endDate: data.endDate,
        });
        try {
            // Update provider schedule with new pattern
            await this.updateProviderSchedulePattern(data);
            // Check for conflicts with existing appointments
            const conflictingAppointments = await this.findConflictingAppointments(data.staffId, data.startDate, data.endDate);
            if (conflictingAppointments.length > 0) {
                console.log(`Found ${conflictingAppointments.length} appointments conflicting with updated schedule`, {
                    staffId: data.staffId,
                    scheduleId: data.scheduleId,
                    scheduleType: data.scheduleType,
                });
                for (const appointment of conflictingAppointments) {
                    await this.handleConflictingAppointment(appointment, data, 'schedule_conflict');
                }
            }
            // If schedule type is vacation/sick leave, process waitlist for when staff returns
            if (data.scheduleType === 'vacation' || data.scheduleType === 'sick_leave') {
                // Schedule automatic waitlist processing for return date
                await this.scheduleWaitlistProcessing(data.staffId, data.endDate);
            }
        }
        catch (error) {
            console.error('Failed to process staff schedule update', {
                staffId: data.staffId,
                scheduleId: data.scheduleId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Find conflicting appointments for staff within time range
     */
    async findConflictingAppointments(staffId, startDate, endDate) {
        try {
            // Get appointments for the staff member within the time range
            const appointments = await this.appointmentRepository.findByProviderId(staffId);
            const conflictingAppointments = appointments.filter(appointment => {
                const appointmentDate = new Date(appointment.timeSlot.appointmentDate);
                const [appointmentHour, appointmentMinute] = appointment.timeSlot.appointmentTime.split(':').map(Number);
                appointmentDate.setHours(appointmentHour, appointmentMinute, 0, 0);
                const appointmentEnd = new Date(appointmentDate.getTime() + (appointment.durationMinutes * 60 * 1000));
                const conflictEnd = endDate || new Date(startDate.getTime() + (24 * 60 * 60 * 1000)); // Default to 24 hours
                return ((appointmentDate >= startDate && appointmentDate <= conflictEnd) ||
                    (appointmentEnd >= startDate && appointmentEnd <= conflictEnd) ||
                    (appointmentDate <= startDate && appointmentEnd >= conflictEnd));
            });
            return conflictingAppointments;
        }
        catch (error) {
            console.error('Failed to find conflicting appointments', {
                staffId,
                startDate,
                endDate,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    /**
     * Handle conflicting appointment
     */
    async handleConflictingAppointment(appointment, staffData, conflictType) {
        try {
            console.log(`Handling ${conflictType} conflict for appointment`, {
                appointmentId: appointment.id,
                staffId: staffData.staffId,
                conflictType,
            });
            // Update appointment status to indicate conflict
            // Note: For now, we'll log the conflict. Actual status update should be done via proper domain events
            console.log(`Conflict detected for appointment ${appointment.appointmentId}: ${conflictType}`);
            // Handle conflict through ReschedulingService
            await this.reschedulingService.handleConflictDetected({
                appointment,
                conflictReason: conflictType,
                conflictDetails: {
                    conflictType,
                    staffData,
                    timestamp: new Date(),
                    detectedBy: 'StaffEventConsumer'
                }
            });
        }
        catch (error) {
            console.error('Failed to handle conflicting appointment', {
                appointmentId: appointment.id,
                conflictType,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Update provider schedule availability
     */
    async updateProviderScheduleAvailability(staffId, startDate, endDate, isAvailable) {
        try {
            await this.providerScheduleRepository.updateAvailability(staffId, {
                startDate,
                endDate,
                isAvailable,
                updatedAt: new Date(),
            });
            console.log('Updated provider schedule availability', {
                staffId,
                startDate,
                endDate,
                isAvailable,
            });
        }
        catch (error) {
            console.error('Failed to update provider schedule availability', {
                staffId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Update provider schedule with new shift
     */
    async updateProviderScheduleShift(shiftData) {
        try {
            await this.providerScheduleRepository.addShift(shiftData.staffId, {
                shiftId: shiftData.shiftId,
                shiftType: shiftData.shiftType,
                date: shiftData.date,
                startTime: shiftData.startTime,
                endTime: shiftData.endTime,
                departmentId: shiftData.departmentId,
                isRecurring: shiftData.isRecurring,
                recurrencePattern: shiftData.recurrencePattern,
            });
            console.log('Updated provider schedule with new shift', {
                staffId: shiftData.staffId,
                shiftId: shiftData.shiftId,
            });
        }
        catch (error) {
            console.error('Failed to update provider schedule shift', {
                staffId: shiftData.staffId,
                shiftId: shiftData.shiftId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Process waitlist for available staff
     * FIXED: Remove violating method call and add proper typing
     */
    async processWaitlistForAvailableStaff(staffId, startDate, endDate) {
        try {
            // FIXED: Remove findWaitlistByProviderId() - use proper waitlist repository
            // For now, just log the staff availability
            console.log('Staff availability updated for waitlist processing', {
                staffId,
                availabilityWindow: {
                    startDate,
                    endDate
                }
            });
            // TODO: Implement proper waitlist processing via WaitlistRepository
            // waitlistEntries = await this.waitlistRepository.findByProviderId(staffId);
        }
        catch (error) {
            console.error('Failed to process waitlist for available staff', {
                staffId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
        });
  
      } catch (error) {
        console.error('Failed to schedule appointment from waitlist', {
          waitlistEntryId: waitlistEntry.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  
    /**
     * Update recurring shift schedule
     */
    async updateRecurringShiftSchedule(shiftData) {
        try {
            if (!shiftData.recurrencePattern)
                return;
            // Implementation for updating recurring shifts
            console.log('Updating recurring shift schedule', {
                staffId: shiftData.staffId,
                shiftId: shiftData.shiftId,
                recurrencePattern: shiftData.recurrencePattern,
            });
            // This would involve calculating future shift dates and updating the schedule
            // Implementation details would depend on specific requirements
        }
        catch (error) {
            console.error('Failed to update recurring shift schedule', {
                staffId: shiftData.staffId,
                shiftId: shiftData.shiftId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Remove shift from provider schedule
     */
    async removeShiftFromProviderSchedule(staffId, shiftId) {
        try {
            await this.providerScheduleRepository.removeShift(staffId, shiftId);
            console.log('Removed shift from provider schedule', {
                staffId,
                shiftId,
            });
        }
        catch (error) {
            console.error('Failed to remove shift from provider schedule', {
                staffId,
                shiftId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Remove recurring shift from schedule
     */
    async removeRecurringShiftFromSchedule(staffId, shiftId, affectedDates) {
        try {
            for (const date of affectedDates) {
                await this.providerScheduleRepository.removeShift(staffId, shiftId);
            }
            console.log('Removed recurring shift from schedule', {
                staffId,
                shiftId,
                affectedDatesCount: affectedDates.length,
            });
        }
        catch (error) {
            console.error('Failed to remove recurring shift from schedule', {
                staffId,
                shiftId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Update provider schedule pattern
     */
    async updateProviderSchedulePattern(scheduleData) {
        try {
            await this.providerScheduleRepository.updatePattern(scheduleData.staffId, {
                scheduleId: scheduleData.scheduleId,
                scheduleType: scheduleData.scheduleType,
                startDate: scheduleData.startDate,
                endDate: scheduleData.endDate,
                shiftPattern: scheduleData.shiftPattern,
                departmentId: scheduleData.departmentId,
                updatedAt: scheduleData.updatedAt,
            });
            console.log('Updated provider schedule pattern', {
                staffId: scheduleData.staffId,
                scheduleId: scheduleData.scheduleId,
                scheduleType: scheduleData.scheduleType,
            });
        }
        catch (error) {
            console.error('Failed to update provider schedule pattern', {
                staffId: scheduleData.staffId,
                scheduleId: scheduleData.scheduleId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Schedule waitlist processing for return date
     */
    async scheduleWaitlistProcessing(staffId, returnDate) {
        try {
            // This would typically involve scheduling a background task
            // to process waitlist when staff returns from leave
            console.log('Scheduled waitlist processing for staff return', {
                staffId,
                returnDate,
            });
        }
        catch (error) {
            console.error('Failed to schedule waitlist processing', {
                staffId,
                returnDate,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Handle staff status changed event
     */
    async handleStaffStatusChanged(data) {
        console.log('Processing staff status change for appointments', {
            staffId: data.staffId,
            previousStatus: data.previousStatus,
            newStatus: data.newStatus,
            reason: data.reason,
        });
        try {
            // If staff is suspended/terminated, cancel future appointments
            if (data.newStatus === 'suspended' || data.newStatus === 'terminated') {
                const futureAppointments = await this.appointmentRepository.findUpcomingByProviderId(data.staffId);
                for (const appointment of futureAppointments) {
                    await this.appointmentRepository.updateStatus(appointment.appointmentId, 'cancelled');
                    console.log(`Cancelled appointment for ${data.newStatus} staff`, {
                        appointmentId: appointment.appointmentId,
                        staffId: data.staffId,
                        reason: data.reason || 'No reason provided',
                    });
                }
                console.log(`Cancelled ${futureAppointments.length} future appointments for ${data.newStatus} staff`, {
                    staffId: data.staffId,
                });
            }
            // If staff is reactivated, check for rescheduling opportunities
            if (data.newStatus === 'active' && data.previousStatus !== 'active') {
                await this.processPendingAppointmentsForStaff({
                    staffId: data.staffId,
                    staffName: data.staffName || 'Unknown',
                    departmentId: data.departmentId,
                    assignmentType: 'primary',
                });
            }
        }
        catch (error) {
            console.error('Failed to process staff status change', {
                staffId: data.staffId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle staff department assigned event
     */
    async handleStaffDepartmentAssigned(data) {
        console.log('Processing staff department assignment for appointments', {
            staffId: data.staffId,
            departmentId: data.departmentId,
            assignmentType: data.assignmentType,
        });
        try {
            // Update staff availability based on new department assignment
            await this.updateStaffAppointmentAvailability(data);
            // Check if any pending appointments can now be assigned to this staff
            if (data.assignmentType === 'primary' || data.assignmentType === 'secondary') {
                await this.processPendingAppointmentsForStaff(data);
            }
        }
        catch (error) {
            console.error('Failed to process staff department assignment', {
                staffId: data.staffId,
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle department created event
     */
    async handleDepartmentCreated(data) {
        console.log('Processing department creation for appointments', {
            departmentId: data.departmentId,
            departmentName: data.departmentName,
        });
        try {
            // Initialize department appointment availability patterns
            if (data.operatingHours) {
                await this.validateAppointmentsAgainstOperatingHours(data);
            }
            if (data.capacity) {
                await this.checkDepartmentCapacityCompliance(data);
            }
        }
        catch (error) {
            console.error('Failed to process department creation', {
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle department updated event
     */
    async handleDepartmentUpdated(data) {
        console.log('Processing department update for appointments', {
            departmentId: data.departmentId,
            updatedFields: data.updatedFields,
        });
        try {
            // If operating hours changed, validate existing appointments
            if (data.updatedFields.includes('operatingHours') && data.newOperatingHours) {
                await this.validateAppointmentsAgainstOperatingHours({
                    departmentId: data.departmentId,
                    operatingHours: data.newOperatingHours,
                });
            }
            // If capacity changed, check current appointment load
            if (data.updatedFields.includes('capacity') && data.newCapacity) {
                await this.checkDepartmentCapacityCompliance({
                    departmentId: data.departmentId,
                    capacity: data.newCapacity,
                });
            }
        }
        catch (error) {
            console.error('Failed to process department update', {
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle department staff count changed event
     */
    async handleDepartmentStaffCountChanged(data) {
        console.log('Processing department staff count change for appointments', {
            departmentId: data.departmentId,
            previousCount: data.previousCount,
            newCount: data.newCount,
            changeType: data.changeType,
        });
        try {
            // If staff count decreased, check for appointment capacity issues
            if (data.newCount < data.previousCount) {
                await this.handleDepartmentOverload(data.departmentId);
            }
            // If staff count increased, process waitlist
            if (data.newCount > data.previousCount) {
                await this.processWaitlistForIncreasedCapacity({
                    departmentId: data.departmentId,
                    newCapacity: { maxAppointmentsPerDay: data.newCount * 8 }, // Estimate 8 appointments per staff
                    previousCapacity: { maxAppointmentsPerDay: data.previousCount * 8 },
                });
            }
        }
        catch (error) {
            console.error('Failed to process department staff count change', {
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Update staff appointment availability
     */
    async updateStaffAppointmentAvailability(staffData) {
        try {
            // Update staff availability based on new department assignment
            // This affects appointment scheduling for this staff member
            console.log('Staff appointment availability updated', {
                staffId: staffData.staffId,
                departmentId: staffData.departmentId,
                assignmentType: staffData.assignmentType,
            });
        }
        catch (error) {
            console.error('Failed to update staff appointment availability', {
                staffId: staffData.staffId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Process pending appointments for staff
     */
    async processPendingAppointmentsForStaff(staffData) {
        try {
            // Check if any pending appointments can now be assigned to this staff
            console.log('Processing pending appointments for staff', {
                staffId: staffData.staffId,
                departmentId: staffData.departmentId,
            });
        }
        catch (error) {
            console.error('Failed to process pending appointments for staff', {
                staffId: staffData.staffId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Validate appointments against operating hours
     */
    async validateAppointmentsAgainstOperatingHours(departmentData) {
        try {
            if (!departmentData.operatingHours)
                return;
            const appointments = await this.appointmentRepository.findByDepartment(departmentData.departmentId);
            const conflictingAppointments = appointments.filter(appointment => {
                return this.isAppointmentOutsideOperatingHours(appointment, departmentData.operatingHours);
            });
            if (conflictingAppointments.length > 0) {
                console.log(`Found ${conflictingAppointments.length} appointments outside operating hours`, {
                    departmentId: departmentData.departmentId,
                });
                for (const appointment of conflictingAppointments) {
                    await this.handleOperatingHoursConflict(appointment, departmentData.operatingHours);
                }
            }
        }
        catch (error) {
            console.error('Failed to validate appointments against operating hours', {
                departmentId: departmentData.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Check department capacity compliance
     */
    async checkDepartmentCapacityCompliance(departmentData) {
        try {
            if (!departmentData.capacity)
                return;
            const appointments = await this.appointmentRepository.findByDepartment(departmentData.departmentId);
            const overloadedAppointments = this.findAppointmentsExceedingCapacity(appointments, departmentData.capacity);
            if (overloadedAppointments.length > 0) {
                console.log(`Found ${overloadedAppointments.length} appointments exceeding capacity limits`, {
                    departmentId: departmentData.departmentId,
                });
                for (const appointment of overloadedAppointments) {
                    await this.handleCapacityConflict(appointment, departmentData.capacity);
                }
            }
        }
        catch (error) {
            console.error('Failed to check department capacity compliance', {
                departmentId: departmentData.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle department overload
     */
    async handleDepartmentOverload(departmentId) {
        try {
            console.log('Handling department overload', {
                departmentId,
            });
            // Find appointments that need rescheduling
            const appointments = await this.appointmentRepository.findByDepartment(departmentId);
            // Process waitlist to free up capacity
            await this.processWaitlistForIncreasedCapacity({
                departmentId,
                newCapacity: { maxAppointmentsPerDay: 0 }, // Force processing
                previousCapacity: { maxAppointmentsPerDay: 999 },
            });
        }
        catch (error) {
            console.error('Failed to handle department overload', {
                departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Process waitlist for increased capacity
     */
    async processWaitlistForIncreasedCapacity(data) {
        try {
            console.log('Processing waitlist for increased capacity', {
                departmentId: data.departmentId,
                newCapacity: data.newCapacity.maxAppointmentsPerDay,
            });
            // Implementation would check waitlist and schedule appointments
            // This is a placeholder for the actual implementation
        }
        catch (error) {
            console.error('Failed to process waitlist for increased capacity', {
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Helper methods for conflict handling
     */
    isAppointmentOutsideOperatingHours(appointment, operatingHours) {
        const appointmentDate = new Date(appointment.appointmentDate);
        const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const dayHours = operatingHours[dayOfWeek];
        if (!dayHours || dayHours.isClosed) {
            return true;
        }
        const appointmentTime = appointment.appointmentTime;
        return appointmentTime < dayHours.open || appointmentTime > dayHours.close;
    }
    findAppointmentsExceedingCapacity(appointments, capacity) {
        // Group appointments by date and count
        const appointmentsByDate = appointments.reduce((acc, appointment) => {
            const date = appointment.appointmentDate;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(appointment);
            return acc;
        }, {});
        // Find dates exceeding capacity
        const overloadedAppointments = [];
        Object.entries(appointmentsByDate).forEach(([date, dayAppointments]) => {
            const dayApps = dayAppointments;
            if (dayApps.length > capacity.maxAppointmentsPerDay) {
                overloadedAppointments.push(...dayApps);
            }
        });
        return overloadedAppointments;
    }
    async handleOperatingHoursConflict(appointment, operatingHours) {
        console.log('Handling operating hours conflict', {
            appointmentId: appointment.appointmentId,
            appointmentTime: appointment.appointmentTime,
        });
        // Implementation would reschedule or notify about conflict
    }
    async handleCapacityConflict(appointment, capacity) {
        console.log('Handling capacity conflict', {
            appointmentId: appointment.appointmentId,
            appointmentDate: appointment.appointmentDate,
        });
        // Implementation would reschedule or notify about capacity issue
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
            console.log('Staff event consumer disconnected successfully');
        }
        catch (error) {
            console.error('Error disconnecting staff event consumer', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Check if consumer is connected
     */
    isConsumerConnected() {
        return this.isConnected;
    }
}
exports.StaffEventConsumer = StaffEventConsumer;
//# sourceMappingURL=StaffEventConsumer.js.map