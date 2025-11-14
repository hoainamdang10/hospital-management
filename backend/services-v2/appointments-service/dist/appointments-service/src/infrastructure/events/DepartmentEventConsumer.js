"use strict";
/**
 * Department Event Consumer - Infrastructure Layer
 * Consumes department events from Department Service
 * Handles department resource constraints, capacity limits, and operational changes for appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentEventConsumer = void 0;
/**
 * DepartmentEventConsumer - Handles department events for appointment management
 */
class DepartmentEventConsumer {
    constructor(config, appointmentRepository, queueRepository, conflictResolutionService, reminderService, inboxRepo) {
        this.config = config;
        this.appointmentRepository = appointmentRepository;
        this.queueRepository = queueRepository;
        this.conflictResolutionService = conflictResolutionService;
        this.reminderService = reminderService;
        this.inboxRepo = inboxRepo;
        this.isConnected = false;
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        try {
            console.log('Connecting to RabbitMQ for Department events', {
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
            console.log('Department event consumer connected successfully');
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
                console.error('[DepartmentEventConsumer] Missing eventId, cannot process:', event);
                this.channel?.ack(msg);
                return;
            }
            if (await this.inboxRepo.exists(eventId)) {
                console.debug(`[DepartmentEventConsumer] Duplicate event ${eventId}, skipping`);
                this.channel?.ack(msg);
                return;
            }
            console.log(`[DepartmentEventConsumer] Processing event: ${routingKey} (${eventId})`);
            // Route to appropriate handler
            switch (routingKey) {
                case 'department.created':
                    await this.handleDepartmentCreated(event.payload);
                    break;
                case 'department.staff.assigned':
                    await this.handleDepartmentStaffAssigned(event.payload);
                    break;
                case 'department.resource.updated':
                    await this.handleDepartmentResourceUpdated(event.payload);
                    break;
                case 'department.operational_hours.changed':
                    await this.handleDepartmentOperationalHoursChanged(event.payload);
                    break;
                case 'department.capacity.updated':
                    await this.handleDepartmentCapacityUpdated(event.payload);
                    break;
                default:
                    console.warn('Unhandled routing key', { routingKey });
                    break;
            }
            // Store in inbox after successful processing
            await this.inboxRepo.store({
                eventId,
                eventType: routingKey,
                sourceService: 'department-service',
                payloadJson: JSON.stringify(event.payload),
                processedAt: new Date(),
            });
            // Acknowledge message
            this.channel.ack(msg);
        }
        catch (error) {
            console.error('Error processing department event', {
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
     * Handle department created event
     */
    async handleDepartmentCreated(data) {
        console.log('Processing department creation for appointments', {
            departmentId: data.departmentId,
            departmentCode: data.departmentCode,
            departmentName: data.departmentName,
            departmentType: data.departmentType,
        });
        try {
            // ❌ REMOVED: initializeDepartmentAppointmentSettings(data);
            // This functionality belongs to Department Service
            console.log('Department created - Appointment Service notified for conflict detection', {
                departmentId: data.departmentId,
                departmentName: data.departmentName,
                timestamp: new Date()
            });
            // If department has operating hours, validate existing appointments
            if (data.operatingHours) {
                await this.validateAppointmentsAgainstOperatingHours(data);
            }
            // If department has capacity limits, check current appointment load
            if (data.capacity) {
                await this.checkDepartmentCapacityCompliance(data);
            }
            // ❌ REMOVED: setupDefaultAppointmentTypes(data);
            // This functionality belongs to Department Service
            console.log('Department appointment types setup delegated to Department Service', {
                departmentId: data.departmentId,
                departmentType: data.departmentType,
            });
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
     * Handle department staff assigned event
     */
    async handleDepartmentStaffAssigned(data) {
        console.log('Processing department staff assignment for appointments', {
            departmentId: data.departmentId,
            staffId: data.staffId,
            staffName: data.staffName,
            staffRole: data.staffRole,
            assignmentType: data.assignmentType,
        });
        try {
            // ❌ REMOVED: updateStaffAppointmentPermissions(data);
            // This functionality belongs to Provider Staff Service
            console.log('Staff permissions update delegated to Provider Staff Service', {
                staffId: data.staffId,
                departmentId: data.departmentId,
                staffRole: data.staffRole,
            });
            // If this is a clinical staff member, update appointment availability
            if (data.staffRole.includes('doctor') || data.staffRole.includes('nurse') || data.staffRole.includes('specialist')) {
                await this.updateStaffAppointmentAvailability(data);
            }
            // Check if any pending appointments can now be assigned to this staff
            if (data.assignmentType === 'primary' || data.assignmentType === 'secondary') {
                await this.processPendingAppointmentsForStaff(data);
            }
        }
        catch (error) {
            console.error('Failed to process department staff assignment', {
                departmentId: data.departmentId,
                staffId: data.staffId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle department resource updated event
     */
    async handleDepartmentResourceUpdated(data) {
        console.log('Processing department resource update for appointments', {
            departmentId: data.departmentId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            resourceName: data.resourceName,
            action: data.action,
        });
        try {
            // Handle different resource types
            switch (data.resourceType) {
                case 'room':
                case 'facility':
                    await this.handleFacilityResourceUpdate(data);
                    break;
                case 'equipment':
                    await this.handleEquipmentResourceUpdate(data);
                    break;
                case 'bed':
                    await this.handleBedResourceUpdate(data);
                    break;
                default:
                    console.log('Unhandled resource type', { resourceType: data.resourceType });
                    break;
            }
        }
        catch (error) {
            console.error('Failed to process department resource update', {
                departmentId: data.departmentId,
                resourceId: data.resourceId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle department operational hours changed event
     */
    async handleDepartmentOperationalHoursChanged(data) {
        console.log('Processing department operational hours change for appointments', {
            departmentId: data.departmentId,
            departmentName: data.departmentName,
            changedAt: data.changedAt,
            reason: data.reason,
        });
        try {
            // Find all appointments that conflict with new operating hours
            const conflictingAppointments = await this.findAppointmentsConflictingWithHours(data.departmentId, data.newHours);
            if (conflictingAppointments.length > 0) {
                console.log(`Found ${conflictingAppointments.length} appointments conflicting with new operating hours`, {
                    departmentId: data.departmentId,
                });
                for (const appointment of conflictingAppointments) {
                    await this.handleOperatingHoursConflict(appointment, data);
                }
            }
            // Update department appointment availability based on new hours
            await this.updateDepartmentAppointmentAvailability(data.departmentId, data.newHours);
            // Notify patients about rescheduled appointments
            await this.notifyPatientsAboutOperatingHoursChanges(conflictingAppointments, data);
        }
        catch (error) {
            console.error('Failed to process department operational hours change', {
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle department capacity updated event
     */
    async handleDepartmentCapacityUpdated(data) {
        console.log('Processing department capacity update for appointments', {
            departmentId: data.departmentId,
            previousCapacity: data.previousCapacity,
            newCapacity: data.newCapacity,
        });
        try {
            // Check if current appointments exceed new capacity limits
            const overloadedAppointments = await this.findAppointmentsExceedingCapacity(data.departmentId, data.newCapacity);
            if (overloadedAppointments.length > 0) {
                console.log(`Found ${overloadedAppointments.length} appointments exceeding new capacity limits`, {
                    departmentId: data.departmentId,
                });
                for (const appointment of overloadedAppointments) {
                    await this.handleCapacityConflict(appointment, data);
                }
            }
            // Update department capacity settings
            await this.updateDepartmentCapacitySettings(data.departmentId, data.newCapacity);
            // Process waitlist if capacity increased
            if (data.newCapacity.maxAppointmentsPerDay > data.previousCapacity.maxAppointmentsPerDay) {
                await this.processWaitlistForIncreasedCapacity(data);
            }
        }
        catch (error) {
            console.error('Failed to process department capacity update', {
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * ❌ REMOVED: initializeDepartmentAppointmentSettings
     * DEPRECATED: Department settings management is out of scope
     * This functionality belongs to Department Service
     *
     * Appointment Service should only:
     * - Consume department events for appointment conflict detection
     * - Update availability patterns based on department changes
     * - Handle appointment-specific operations
     */
    /**
     * Validate appointments against operating hours
     */
    async validateAppointmentsAgainstOperatingHours(departmentData) {
        try {
            if (!departmentData.operatingHours)
                return;
            const appointments = await this.appointmentRepository.findByDepartmentId(departmentData.departmentId);
            const conflictingAppointments = appointments.filter(appointment => {
                return this.isAppointmentOutsideOperatingHours(appointment, departmentData.operatingHours);
            });
            if (conflictingAppointments.length > 0) {
                console.log(`Found ${conflictingAppointments.length} appointments outside operating hours`, {
                    departmentId: departmentData.departmentId,
                });
                for (const appointment of conflictingAppointments) {
                    await this.handleOperatingHoursConflict(appointment, {
                        departmentId: departmentData.departmentId,
                        departmentName: departmentData.departmentName,
                        newHours: departmentData.operatingHours,
                        changedAt: new Date(),
                        changedBy: departmentData.createdBy,
                    });
                }
            }
        }
        catch (error) {
            console.error('Failed to validate appointments against operating hours', {
                departmentId: departmentData.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Check department capacity compliance
     */
    async checkDepartmentCapacityCompliance(departmentData) {
        try {
            if (!departmentData.capacity)
                return;
            const today = new Date();
            const todayAppointments = await this.appointmentRepository.findByDepartmentAndDate(departmentData.departmentId, today);
            if (todayAppointments.length > departmentData.capacity.maxAppointmentsPerDay) {
                console.warn('Department exceeds daily capacity limit', {
                    departmentId: departmentData.departmentId,
                    currentAppointments: todayAppointments.length,
                    maxCapacity: departmentData.capacity.maxAppointmentsPerDay,
                });
                // Handle overload scenario
                await this.handleDepartmentOverload(departmentData.departmentId, todayAppointments);
            }
        }
        catch (error) {
            console.error('Failed to check department capacity compliance', {
                departmentId: departmentData.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * ❌ REMOVED: setupDefaultAppointmentTypes
     * DEPRECATED: Department appointment types belong to Department Service
     *
     * This functionality should be handled by Department Service:
     * - Create default appointment types for new departments
     * - Manage department-specific appointment configurations
     * - Update appointment type settings
     */
    /**
     * Check if appointment is outside operating hours
     */
    isAppointmentOutsideOperatingHours(appointment, operatingHours) {
        const appointmentDate = new Date(appointment.appointmentDate);
        // Fix: Use toLocaleDateString to get day name, then get day of week
        const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const dayHours = operatingHours[dayOfWeek];
        if (!dayHours || dayHours.open === dayHours.close) {
            return true; // Department closed on this day
        }
        const [appointmentHour, appointmentMinute] = appointment.appointmentTime.split(':').map(Number);
        const [openHour, openMinute] = dayHours.open.split(':').map(Number);
        const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
        const appointmentTime = appointmentHour * 60 + appointmentMinute;
        const openTime = openHour * 60 + openMinute;
        const closeTime = closeHour * 60 + closeMinute;
        return appointmentTime < openTime || appointmentTime >= closeTime;
    }
    /**
     * Handle operating hours conflict
     */
    async handleOperatingHoursConflict(appointment, hoursData) {
        try {
            // Update appointment through aggregate
            const appointmentAggregate = await this.appointmentRepository.findByIdString(appointment.id);
            if (!appointmentAggregate) {
                console.warn('Appointment not found for operating hours conflict', { appointmentId: appointment.id });
                return;
            }
            appointmentAggregate.markForReschedule('operating_hours_change', hoursData);
            await this.appointmentRepository.save(appointmentAggregate);
            // Add to rescheduling queue
            await this.queueRepository.addToReschedulingQueue({
                appointmentId: appointment.id,
                priority: 'high',
                reason: 'operating_hours_change',
                conflictDetails: hoursData,
                addedAt: new Date(),
            });
            // Send notification to patient
            await this.reminderService.sendRescheduleNotification(appointment.id, appointment.patientId, new Date(appointment.startTime), 'Department operating hours have changed');
        }
        catch (error) {
            console.error('Failed to handle operating hours conflict', {
                appointmentId: appointment.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Find appointments conflicting with new operating hours
     */
    async findAppointmentsConflictingWithHours(departmentId, newHours) {
        try {
            const appointments = await this.appointmentRepository.findByDepartmentId(departmentId);
            return appointments.filter(appointment => {
                return this.isAppointmentOutsideOperatingHours(appointment, newHours);
            });
        }
        catch (error) {
            console.error('Failed to find appointments conflicting with operating hours', {
                departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    /**
     * Update department appointment availability
     * NOTE: This violates bounded context - Department Service should handle this
     * TODO: Move to Department Service or implement proper service communication
     */
    async updateDepartmentAppointmentAvailability(departmentId, newHours) {
        // DEPRECATED: This method violates bounded context
        // Department Service should handle availability updates
        console.warn('updateDepartmentAppointmentAvailability is deprecated - violates bounded context');
        // For now, just log the event
        console.log('Department availability updated (logged only)', {
            departmentId,
            newHours,
            timestamp: new Date()
        });
    }
    /**
     * Notify patients about operating hours changes
     */
    async notifyPatientsAboutOperatingHoursChanges(appointments, hoursData) {
        try {
            for (const appointment of appointments) {
                await this.reminderService.sendOperatingHoursChangeNotification(hoursData.departmentId, hoursData.newHours, appointments.map(apt => apt.patientId));
            }
        }
        catch (error) {
            console.error('Failed to notify patients about operating hours changes', {
                appointmentsCount: appointments.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Find appointments exceeding capacity
     */
    async findAppointmentsExceedingCapacity(departmentId, newCapacity) {
        try {
            const today = new Date();
            const todayAppointments = await this.appointmentRepository.findByDepartmentAndDate(departmentId, today);
            if (todayAppointments.length > newCapacity.maxAppointmentsPerDay) {
                // Return excess appointments (last ones scheduled)
                return todayAppointments.slice(newCapacity.maxAppointmentsPerDay);
            }
            return [];
        }
        catch (error) {
            console.error('Failed to find appointments exceeding capacity', {
                departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    /**
     * Handle capacity conflict
     * FIXED: Use proper aggregate pattern
     */
    async handleCapacityConflict(appointment, capacityData) {
        try {
            // FIXED: Use proper aggregate pattern instead of direct update
            const appointmentAggregate = await this.appointmentRepository.findByIdString(appointment.id);
            if (!appointmentAggregate) {
                console.warn('Appointment not found for capacity conflict handling', { appointmentId: appointment.id });
                return;
            }
            // Update appointment status through aggregate
            appointmentAggregate.markForReschedule('capacity_limit_exceeded', capacityData);
            await this.appointmentRepository.save(appointmentAggregate);
            // Add to rescheduling queue
            await this.queueRepository.addToReschedulingQueue({
                appointmentId: appointment.id,
                priority: 'medium',
                reason: 'capacity_limit_exceeded',
                conflictDetails: capacityData,
                addedAt: new Date(),
            });
            // Send notification to patient
            await this.reminderService.sendRescheduleNotification(appointment.id, appointment.patientId, new Date(appointment.startTime), 'Department capacity limits have been updated');
        }
        catch (error) {
            console.error('Failed to handle capacity conflict', {
                appointmentId: appointment.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Update department capacity settings
     * DEPRECATED: Department capacity belongs to Department Service
     */
    async updateDepartmentCapacitySettings(departmentId, newCapacity) {
        // DEPRECATED: Department capacity management is out of scope for Appointment Service
        console.warn('updateDepartmentCapacitySettings is deprecated - violates bounded context');
        console.log('Department capacity updated (logged only)', {
            departmentId,
            newCapacity,
            timestamp: new Date()
        });
    }
    /**
     * Process waitlist for increased capacity
     * DEPRECATED: Waitlist management belongs to Waitlist Service
     */
    async processWaitlistForIncreasedCapacity(capacityData) {
        // DEPRECATED: Waitlist management is out of scope for Appointment Service
        console.warn('processWaitlistForIncreasedCapacity is deprecated - violates bounded context');
        console.log('Capacity increase processed (logged only)', {
            departmentId: capacityData.departmentId,
            previousCapacity: capacityData.previousCapacity,
            newCapacity: capacityData.newCapacity,
            timestamp: new Date()
        });
    }
    /**
     * Schedule appointment from waitlist
     * DEPRECATED: Waitlist management belongs to Waitlist Service
     */
    async scheduleFromWaitlist(waitlistEntry, timeSlot) {
        // DEPRECATED: Waitlist scheduling is out of scope for Appointment Service
        console.warn('scheduleFromWaitlist is deprecated - violates bounded context');
        console.log('Waitlist entry processed (logged only)', {
            waitlistEntryId: waitlistEntry.id,
            timeSlot: timeSlot,
            timestamp: new Date()
        });
    }
    /**
     * Handle facility resource update
     * DEPRECATED: Resource management belongs to Resource Management Service
     */
    async handleFacilityResourceUpdate(resourceData) {
        try {
            console.warn('handleFacilityResourceUpdate is deprecated - violates bounded context');
            console.log('Facility resource update received - delegated to Resource Management Service', {
                departmentId: resourceData.departmentId,
                resourceId: resourceData.resourceId,
                action: resourceData.action,
            });
        }
        catch (error) {
            console.error('Failed to handle facility resource update', {
                departmentId: resourceData.departmentId,
                resourceId: resourceData.resourceId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Handle equipment resource update
     * DEPRECATED: Resource management belongs to Resource Management Service
     */
    async handleEquipmentResourceUpdate(resourceData) {
        try {
            console.warn('handleEquipmentResourceUpdate is deprecated - violates bounded context');
            console.log('Equipment resource update received - delegated to Resource Management Service', {
                departmentId: resourceData.departmentId,
                resourceId: resourceData.resourceId,
                action: resourceData.action,
            });
        }
        catch (error) {
            console.error('Failed to handle equipment resource update', {
                departmentId: resourceData.departmentId,
                resourceId: resourceData.resourceId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Handle bed resource update
     */
    async handleBedResourceUpdate(resourceData) {
        try {
            console.log('Handling bed resource update', {
                departmentId: resourceData.departmentId,
                resourceId: resourceData.resourceId,
                action: resourceData.action,
            });
            // Bed management is out of scope - delegated to Resource Management Service
            if (resourceData.resourceType === 'bed') {
                console.warn('Bed resource management is deprecated - violates bounded context');
            }
        }
        catch (error) {
            console.error('Failed to handle bed resource update', {
                departmentId: resourceData.departmentId,
                resourceId: resourceData.resourceId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Handle resource conflict
     * FIXED: Use proper aggregate pattern and method calls
     */
    async handleResourceConflict(appointment, resourceData) {
        try {
            // FIXED: Use proper aggregate pattern instead of direct update
            const appointmentAggregate = await this.appointmentRepository.findByIdString(appointment.id);
            if (!appointmentAggregate) {
                console.warn('Appointment not found for resource conflict handling', { appointmentId: appointment.id });
                return;
            }
            // Update appointment status through aggregate
            appointmentAggregate.markForReschedule('resource_unavailable', resourceData);
            await this.appointmentRepository.save(appointmentAggregate);
            // Add to rescheduling queue
            await this.queueRepository.addToReschedulingQueue({
                appointmentId: appointment.id,
                priority: 'high',
                reason: 'resource_unavailable',
                conflictDetails: resourceData,
                addedAt: new Date(),
            });
            // FIXED: Use proper method signature for reminder service
            await this.reminderService.sendRescheduleNotification(appointment.id, appointment.patientId, new Date(), // Reschedule time - will be determined later
            'capacity_limit_exceeded');
        }
        catch (error) {
            console.error('Failed to handle resource conflict', {
                appointmentId: appointment.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Handle department overload
     * FIXED: Use proper aggregate pattern and remove violating method calls
     */
    async handleDepartmentOverload(departmentId, appointments) {
        try {
            // FIXED: Remove getDepartmentCapacity() - this belongs to Department Service
            // For now, use a reasonable default or get from configuration
            const maxCapacity = 50; // TODO: Get from Department Service via event/HTTP call
            const excessAppointments = appointments.slice(maxCapacity);
            for (const appointment of excessAppointments) {
                // FIXED: Use proper aggregate pattern instead of direct update
                const appointmentAggregate = await this.appointmentRepository.findByIdString(appointment.id);
                if (!appointmentAggregate) {
                    console.warn('Appointment not found for overload handling', { appointmentId: appointment.id });
                    continue;
                }
                // Update appointment status through aggregate
                appointmentAggregate.markForReschedule('department_overload', { departmentId });
                await this.appointmentRepository.save(appointmentAggregate);
                await this.queueRepository.addToReschedulingQueue({
                    appointmentId: appointment.id,
                    priority: 'medium',
                    reason: 'department_overload',
                    addedAt: new Date(),
                });
            }
        }
        catch (error) {
            console.error('Failed to handle department overload', {
                departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * ❌ REMOVED: updateStaffAppointmentPermissions
     * DEPRECATED: Staff permissions belong to Provider/Staff Service
     *
     * This functionality should be handled by Provider Staff Service:
     * - Manage staff appointment permissions
     * - Update staff credentials and access rights
     * - Handle staff authorization for appointments
     */
    /**
     * Update staff appointment availability
     * THUỘC Appointment Service: Quản lý real-time availability cho appointments
     */
    async updateStaffAppointmentAvailability(staffData) {
        try {
            // Update staff availability based on new department assignment
            // This affects appointment scheduling for this staff member
            console.log('Staff appointment availability updated', {
                staffId: staffData.staffId,
                departmentId: staffData.departmentId,
                assignmentType: staffData.assignmentType,
                updatedAt: staffData.assignedAt
            });
            // Note: Actual availability is managed through appointment queries
            // This just logs the availability change for audit trail
        }
        catch (error) {
            console.error('Failed to update staff appointment availability', {
                staffId: staffData.staffId,
                departmentId: staffData.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Process pending appointments for staff
     * FIXED: Remove violating method calls and use proper alternatives
     */
    async processPendingAppointmentsForStaff(staffData) {
        try {
            // FIXED: Remove findPendingByDepartment() - use proper appointment queries
            // Get appointments that could be assigned to this staff
            const pendingAppointments = await this.appointmentRepository.findByDepartmentId(staffData.departmentId, new Date(), // From today
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            );
            // Filter for appointments without assigned doctors or with specific requirements
            const unassignedAppointments = pendingAppointments.filter(apt => !apt.doctorId || apt.doctorId === '');
            for (const appointment of unassignedAppointments) {
                // Check if this staff member is suitable for the appointment
                if (await this.isStaffSuitableForAppointment(staffData, appointment)) {
                    await this.assignAppointmentToStaff(appointment, staffData);
                }
            }
        }
        catch (error) {
            console.error('Failed to process pending appointments for staff', {
                staffId: staffData.staffId,
                departmentId: staffData.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Check if staff is suitable for appointment
     * FIXED: Use proper method signature for checkStaffAvailability
     */
    async isStaffSuitableForAppointment(staffData, appointment) {
        try {
            // Check if staff role matches appointment requirements
            if (appointment.requiredRole && !staffData.staffRole.includes(appointment.requiredRole)) {
                return false;
            }
            // FIXED: Use proper method signature with endTime parameter
            const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
            const endTime = new Date(appointmentDateTime.getTime() + (appointment.durationMinutes || 30) * 60 * 1000);
            const isAvailable = await this.appointmentRepository.checkStaffAvailability(staffData.staffId, appointmentDateTime, endTime);
            return isAvailable;
        }
        catch (error) {
            console.error('Failed to check staff suitability for appointment', {
                staffId: staffData.staffId,
                appointmentId: appointment.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    /**
     * Assign appointment to staff
     * FIXED: Use proper aggregate pattern and method calls
     */
    async assignAppointmentToStaff(appointment, staffData) {
        try {
            // FIXED: Use proper aggregate pattern instead of direct update
            const appointmentAggregate = await this.appointmentRepository.findByIdString(appointment.id);
            if (!appointmentAggregate) {
                console.warn('Appointment not found for staff assignment', { appointmentId: appointment.id });
                return;
            }
            // Update appointment through aggregate
            appointmentAggregate.assignToStaff(staffData.staffId, staffData.assignedBy);
            await this.appointmentRepository.save(appointmentAggregate);
            // FIXED: Use proper method signature for reminder service
            await this.reminderService.sendStaffAssignmentNotification(appointment.id, staffData.staffId, 'assigned');
        }
        catch (error) {
            console.error('Failed to assign appointment to staff', {
                appointmentId: appointment.id,
                staffId: staffData.staffId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
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
            console.log('Department event consumer disconnected successfully');
        }
        catch (error) {
            console.error('Error disconnecting department event consumer', {
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
exports.DepartmentEventConsumer = DepartmentEventConsumer;
//# sourceMappingURL=DepartmentEventConsumer.js.map