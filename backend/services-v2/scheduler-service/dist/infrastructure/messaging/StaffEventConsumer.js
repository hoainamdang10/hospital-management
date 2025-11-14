"use strict";
/**
 * Staff Event Consumer - Infrastructure Layer
 * Consumes staff events from Provider Staff Service
 * Handles staff availability changes, schedule updates, and shift assignments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffEventConsumer = void 0;
const Logger_1 = require("../observability/Logger");
/**
 * StaffEventConsumer - Handles staff events for scheduling
 */
class StaffEventConsumer {
    constructor(config, scheduleRepository, createScheduleUseCase, updateScheduleUseCase, cancelScheduleUseCase) {
        this.config = config;
        this.scheduleRepository = scheduleRepository;
        this.createScheduleUseCase = createScheduleUseCase;
        this.updateScheduleUseCase = updateScheduleUseCase;
        this.cancelScheduleUseCase = cancelScheduleUseCase;
        this.isConnected = false;
        this.logger = Logger_1.Logger.getInstance();
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        try {
            this.logger.info('Connecting to RabbitMQ for Staff events', {
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
                this.logger.info('Queue bound to routing key', {
                    queueName: this.config.queueName,
                    routingKey,
                });
            }
            // Start consuming
            await this.channel.consume(this.config.queueName, this.handleMessage.bind(this), { noAck: false });
            this.isConnected = true;
            this.logger.info('Staff event consumer connected successfully');
            // Handle connection errors
            this.connection.on('error', (error) => {
                this.logger.error('RabbitMQ connection error', {
                    error: error.message,
                });
                this.isConnected = false;
            });
            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed');
                this.isConnected = false;
            });
        }
        catch (error) {
            this.logger.error('Failed to connect to RabbitMQ', {
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
            this.logger.debug('Received staff event', {
                routingKey,
                eventId: event.eventId,
            });
            // Route to appropriate handler
            switch (routingKey) {
                case 'availability.staff.changed':
                    await this.handleStaffAvailabilityChanged(event.payload);
                    break;
                case 'shift.staff.assigned':
                    await this.handleStaffShiftAssigned(event.payload);
                    break;
                case 'shift.staff.cancelled':
                    await this.handleStaffShiftCancelled(event.payload);
                    break;
                case 'schedule.staff.updated':
                    await this.handleStaffScheduleUpdated(event.payload);
                    break;
                default:
                    this.logger.warn('Unhandled routing key', { routingKey });
                    break;
            }
            // Acknowledge message
            this.channel.ack(msg);
        }
        catch (error) {
            this.logger.error('Error processing staff event', {
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
        this.logger.info('Processing staff availability change', {
            staffId: data.staffId,
            availabilityType: data.availabilityType,
            startDate: data.startDate,
            endDate: data.endDate,
            isTemporary: data.isTemporary,
        });
        try {
            // Create or update availability schedule
            const scheduleId = `staff-availability-${data.staffId}-${data.startDate.getTime()}`;
            if (data.availabilityType === 'unavailable' || data.availabilityType === 'off_duty') {
                // Create unavailability schedule
                await this.createScheduleUseCase.execute({
                    id: scheduleId,
                    name: `Staff Unavailability - ${data.staffName}`,
                    description: data.reason || `Staff ${data.availabilityType}`,
                    cronExpression: this.generateCronForDateRange(data.startDate, data.endDate),
                    timezone: 'Asia/Ho_Chi_Minh',
                    isActive: true,
                    ownerService: 'staff-service',
                    topicOrCommand: 'staff.unavailability',
                    payload: {
                        staffId: data.staffId,
                        staffName: data.staffName,
                        availabilityType: data.availabilityType,
                        startDate: data.startDate.toISOString(),
                        endDate: data.endDate?.toISOString(),
                        reason: data.reason,
                        departmentId: data.departmentId,
                    },
                    metadata: {
                        eventType: 'staff_availability_changed',
                        changedBy: data.changedBy,
                        changedAt: data.changedAt.toISOString(),
                        isTemporary: data.isTemporary,
                    },
                });
                this.logger.info('Created unavailability schedule for staff', {
                    staffId: data.staffId,
                    scheduleId,
                    availabilityType: data.availabilityType,
                });
            }
            else if (data.availabilityType === 'available') {
                // Cancel any existing unavailability schedules
                const existingSchedules = await this.scheduleRepository.findByOwnerServiceAndTopic('staff-service', 'staff.unavailability');
                for (const schedule of existingSchedules) {
                    if (schedule.payload?.staffId === data.staffId) {
                        await this.cancelScheduleUseCase.execute(schedule.id);
                        this.logger.info('Cancelled unavailability schedule for staff', {
                            staffId: data.staffId,
                            scheduleId: schedule.id,
                        });
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to process staff availability change', {
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
        this.logger.info('Processing staff shift assignment', {
            staffId: data.staffId,
            shiftId: data.shiftId,
            shiftType: data.shiftType,
            date: data.date,
            departmentId: data.departmentId,
        });
        try {
            const scheduleId = `staff-shift-${data.shiftId}`;
            if (data.isRecurring && data.recurrencePattern) {
                // Create recurring shift schedule
                const cronExpression = this.generateCronForRecurrence(data.date, data.startTime, data.recurrencePattern);
                await this.createScheduleUseCase.execute({
                    id: scheduleId,
                    name: `Staff Shift - ${data.staffName}`,
                    description: `${data.shiftType} shift at ${data.departmentName}`,
                    cronExpression,
                    timezone: 'Asia/Ho_Chi_Minh',
                    isActive: true,
                    ownerService: 'staff-service',
                    topicOrCommand: 'staff.shift.reminder',
                    payload: {
                        staffId: data.staffId,
                        staffName: data.staffName,
                        shiftId: data.shiftId,
                        shiftType: data.shiftType,
                        departmentId: data.departmentId,
                        departmentName: data.departmentName,
                        startTime: data.startTime,
                        endTime: data.endTime,
                        assignedBy: data.assignedBy,
                    },
                    metadata: {
                        eventType: 'staff_shift_assigned',
                        assignedAt: data.assignedAt.toISOString(),
                        isRecurring: data.isRecurring,
                        recurrencePattern: data.recurrencePattern,
                    },
                });
            }
            else {
                // Create one-time shift schedule
                const cronExpression = this.generateCronForOneTime(data.date, data.startTime);
                await this.createScheduleUseCase.execute({
                    id: scheduleId,
                    name: `Staff Shift - ${data.staffName}`,
                    description: `${data.shiftType} shift at ${data.departmentName}`,
                    cronExpression,
                    timezone: 'Asia/Ho_Chi_Minh',
                    isActive: true,
                    ownerService: 'staff-service',
                    topicOrCommand: 'staff.shift.reminder',
                    payload: {
                        staffId: data.staffId,
                        staffName: data.staffName,
                        shiftId: data.shiftId,
                        shiftType: data.shiftType,
                        departmentId: data.departmentId,
                        departmentName: data.departmentName,
                        date: data.date.toISOString(),
                        startTime: data.startTime,
                        endTime: data.endTime,
                        assignedBy: data.assignedBy,
                    },
                    metadata: {
                        eventType: 'staff_shift_assigned',
                        assignedAt: data.assignedAt.toISOString(),
                        isRecurring: false,
                    },
                });
            }
            this.logger.info('Created shift schedule for staff', {
                staffId: data.staffId,
                shiftId: data.shiftId,
                scheduleId,
                isRecurring: data.isRecurring,
            });
        }
        catch (error) {
            this.logger.error('Failed to process staff shift assignment', {
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
        this.logger.info('Processing staff shift cancellation', {
            staffId: data.staffId,
            shiftId: data.shiftId,
            date: data.date,
            cancelledBy: data.cancelledBy,
            reason: data.reason,
        });
        try {
            // Cancel the shift schedule
            const scheduleId = `staff-shift-${data.shiftId}`;
            if (data.isRecurring && data.affectedDates && data.affectedDates.length > 0) {
                // For recurring shifts, we might need to handle specific dates
                // For now, cancel the entire recurring schedule
                await this.cancelScheduleUseCase.execute(scheduleId);
                this.logger.info('Cancelled recurring shift schedule', {
                    staffId: data.staffId,
                    shiftId: data.shiftId,
                    scheduleId,
                });
            }
            else {
                // Cancel one-time shift schedule
                await this.cancelScheduleUseCase.execute(scheduleId);
                this.logger.info('Cancelled one-time shift schedule', {
                    staffId: data.staffId,
                    shiftId: data.shiftId,
                    scheduleId,
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to process staff shift cancellation', {
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
        this.logger.info('Processing staff schedule update', {
            staffId: data.staffId,
            scheduleId: data.scheduleId,
            scheduleType: data.scheduleType,
            startDate: data.startDate,
            endDate: data.endDate,
        });
        try {
            // Update existing schedule or create new one
            const cronExpression = this.generateCronForShiftPattern(data.shiftPattern);
            try {
                // Try to update existing schedule
                await this.updateScheduleUseCase.execute(data.scheduleId, {
                    name: `Staff Schedule - ${data.staffName}`,
                    description: `${data.scheduleType} schedule`,
                    cronExpression,
                    isActive: true,
                    payload: {
                        staffId: data.staffId,
                        staffName: data.staffName,
                        scheduleType: data.scheduleType,
                        shiftPattern: data.shiftPattern,
                        departmentId: data.departmentId,
                    },
                    metadata: {
                        eventType: 'staff_schedule_updated',
                        updatedBy: data.updatedBy,
                        updatedAt: data.updatedAt.toISOString(),
                        reason: data.reason,
                    },
                });
                this.logger.info('Updated staff schedule', {
                    staffId: data.staffId,
                    scheduleId: data.scheduleId,
                });
            }
            catch (updateError) {
                // If schedule doesn't exist, create new one
                await this.createScheduleUseCase.execute({
                    id: data.scheduleId,
                    name: `Staff Schedule - ${data.staffName}`,
                    description: `${data.scheduleType} schedule`,
                    cronExpression,
                    timezone: 'Asia/Ho_Chi_Minh',
                    isActive: true,
                    ownerService: 'staff-service',
                    topicOrCommand: 'staff.schedule.notification',
                    payload: {
                        staffId: data.staffId,
                        staffName: data.staffName,
                        scheduleType: data.scheduleType,
                        shiftPattern: data.shiftPattern,
                        departmentId: data.departmentId,
                    },
                    metadata: {
                        eventType: 'staff_schedule_updated',
                        updatedBy: data.updatedBy,
                        updatedAt: data.updatedAt.toISOString(),
                        reason: data.reason,
                    },
                });
                this.logger.info('Created new staff schedule', {
                    staffId: data.staffId,
                    scheduleId: data.scheduleId,
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to process staff schedule update', {
                staffId: data.staffId,
                scheduleId: data.scheduleId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Generate cron expression for date range
     */
    generateCronForDateRange(startDate, endDate) {
        if (!endDate) {
            // One-time event
            return `${startDate.getMinutes()} ${startDate.getHours()} ${startDate.getDate()} ${startDate.getMonth() + 1} *`;
        }
        // For date ranges, we'll create a daily schedule
        return `${startDate.getMinutes()} ${startDate.getHours()} * ${startDate.getMonth() + 1} *`;
    }
    /**
     * Generate cron expression for one-time event
     */
    generateCronForOneTime(date, time) {
        const [hours, minutes] = time.split(':').map(Number);
        return `${minutes} ${hours} ${date.getDate()} ${date.getMonth() + 1} *`;
    }
    /**
     * Generate cron expression for recurrence pattern
     */
    generateCronForRecurrence(startDate, time, pattern) {
        const [hours, minutes] = time.split(':').map(Number);
        switch (pattern.frequency) {
            case 'daily':
                return `${minutes} ${hours} * * *`;
            case 'weekly':
                return `${minutes} ${hours} * * ${startDate.getDay()}`;
            case 'monthly':
                return `${minutes} ${hours} ${startDate.getDate()} * *`;
            default:
                return `${minutes} ${hours} * * *`;
        }
    }
    /**
     * Generate cron expression for shift pattern
     */
    generateCronForShiftPattern(shiftPattern) {
        // For complex shift patterns, create multiple cron expressions
        // For simplicity, we'll use a daily pattern
        const firstDay = Object.keys(shiftPattern)[0];
        if (firstDay && shiftPattern[firstDay]) {
            const [hours, minutes] = shiftPattern[firstDay].start.split(':').map(Number);
            return `${minutes} ${hours} * * *`;
        }
        // Default to 9 AM if no pattern found
        return '0 9 * * *';
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
            this.logger.info('Staff event consumer disconnected successfully');
        }
        catch (error) {
            this.logger.error('Error disconnecting staff event consumer', {
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