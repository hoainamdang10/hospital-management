"use strict";
/**
 * Department Event Consumer - Infrastructure Layer
 * Consumes department events from Department Service
 * Handles department-level automation, resource scheduling, and operational tasks
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentEventConsumer = void 0;
const Logger_1 = require("../observability/Logger");
/**
 * DepartmentEventConsumer - Handles department events for operational automation
 */
class DepartmentEventConsumer {
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
            this.logger.info('Connecting to RabbitMQ for Department events', {
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
            this.logger.info('Department event consumer connected successfully');
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
            this.logger.debug('Received department event', {
                routingKey,
                eventId: event.eventId,
            });
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
                default:
                    this.logger.warn('Unhandled routing key', { routingKey });
                    break;
            }
            // Acknowledge message
            this.channel.ack(msg);
        }
        catch (error) {
            this.logger.error('Error processing department event', {
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
        this.logger.info('Processing department creation', {
            departmentId: data.departmentId,
            departmentCode: data.departmentCode,
            departmentName: data.departmentName,
            departmentType: data.departmentType,
        });
        try {
            // Create department-specific automation schedules
            // 1. Daily operational summary
            const summaryScheduleId = `dept-summary-${data.departmentId}`;
            await this.createScheduleUseCase.execute({
                id: summaryScheduleId,
                name: `Daily Operational Summary - ${data.departmentName}`,
                description: `Daily operational summary for ${data.departmentName}`,
                cronExpression: '0 18 * * *', // 6 PM daily
                timezone: 'Asia/Ho_Chi_Minh',
                isActive: true,
                ownerService: 'scheduler-service',
                topicOrCommand: 'department.summary.daily',
                payload: {
                    departmentId: data.departmentId,
                    departmentCode: data.departmentCode,
                    departmentName: data.departmentName,
                    departmentType: data.departmentType,
                    headOfDepartmentId: data.headOfDepartmentId,
                    headOfDepartmentName: data.headOfDepartmentName,
                },
                metadata: {
                    eventType: 'department_daily_summary',
                    createdAt: data.createdAt.toISOString(),
                    createdBy: data.createdBy,
                },
            });
            // 2. Weekly department report
            const weeklyReportScheduleId = `dept-weekly-${data.departmentId}`;
            await this.createScheduleUseCase.execute({
                id: weeklyReportScheduleId,
                name: `Weekly Department Report - ${data.departmentName}`,
                description: `Weekly performance report for ${data.departmentName}`,
                cronExpression: '0 9 * * 1', // 9 AM every Monday
                timezone: 'Asia/Ho_Chi_Minh',
                isActive: true,
                ownerService: 'scheduler-service',
                topicOrCommand: 'department.report.weekly',
                payload: {
                    departmentId: data.departmentId,
                    departmentCode: data.departmentCode,
                    departmentName: data.departmentName,
                    departmentType: data.departmentType,
                    headOfDepartmentId: data.headOfDepartmentId,
                },
                metadata: {
                    eventType: 'department_weekly_report',
                    createdAt: data.createdAt.toISOString(),
                    createdBy: data.createdBy,
                },
            });
            // 3. Monthly resource utilization report
            const monthlyReportScheduleId = `dept-monthly-${data.departmentId}`;
            await this.createScheduleUseCase.execute({
                id: monthlyReportScheduleId,
                name: `Monthly Resource Report - ${data.departmentName}`,
                description: `Monthly resource utilization report for ${data.departmentName}`,
                cronExpression: '0 8 1 * *', // 8 AM on 1st of every month
                timezone: 'Asia/Ho_Chi_Minh',
                isActive: true,
                ownerService: 'scheduler-service',
                topicOrCommand: 'department.report.monthly',
                payload: {
                    departmentId: data.departmentId,
                    departmentCode: data.departmentCode,
                    departmentName: data.departmentName,
                    departmentType: data.departmentType,
                    headOfDepartmentId: data.headOfDepartmentId,
                },
                metadata: {
                    eventType: 'department_monthly_report',
                    createdAt: data.createdAt.toISOString(),
                    createdBy: data.createdBy,
                },
            });
            // 4. If department has operating hours, create opening/closing reminders
            if (data.operatingHours) {
                await this.createOperatingHoursSchedules(data);
            }
            this.logger.info('Created department automation schedules', {
                departmentId: data.departmentId,
                schedules: [summaryScheduleId, weeklyReportScheduleId, monthlyReportScheduleId],
            });
        }
        catch (error) {
            this.logger.error('Failed to process department creation', {
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
        this.logger.info('Processing department staff assignment', {
            departmentId: data.departmentId,
            staffId: data.staffId,
            staffName: data.staffName,
            staffRole: data.staffRole,
            assignmentType: data.assignmentType,
        });
        try {
            // Create onboarding schedule for new staff assignments
            if (data.assignmentType === 'primary' || data.assignmentType === 'secondary') {
                const onboardingScheduleId = `staff-onboarding-${data.staffId}-${data.departmentId}`;
                // Schedule onboarding reminders for the next 30 days
                const onboardingDates = [
                    { days: 1, type: 'welcome_reminder' },
                    { days: 7, type: 'first_week_check' },
                    { days: 30, type: 'monthly_review' }
                ];
                for (const onboarding of onboardingDates) {
                    const scheduleDate = new Date(data.assignedAt.getTime() + (onboarding.days * 24 * 60 * 60 * 1000));
                    const scheduleId = `${onboardingScheduleId}-${onboarding.type}`;
                    await this.createScheduleUseCase.execute({
                        id: scheduleId,
                        name: `Staff Onboarding - ${onboarding.type}`,
                        description: `${onboarding.type} for ${data.staffName} in ${data.departmentName}`,
                        cronExpression: this.generateCronForOneTime(scheduleDate),
                        timezone: 'Asia/Ho_Chi_Minh',
                        isActive: true,
                        ownerService: 'scheduler-service',
                        topicOrCommand: 'department.staff.onboarding',
                        payload: {
                            departmentId: data.departmentId,
                            departmentCode: data.departmentCode,
                            departmentName: data.departmentName,
                            staffId: data.staffId,
                            staffName: data.staffName,
                            staffEmail: data.staffEmail,
                            staffRole: data.staffRole,
                            assignmentType: data.assignmentType,
                            onboardingType: onboarding.type,
                            assignedAt: data.assignedAt.toISOString(),
                            assignedBy: data.assignedBy,
                        },
                        metadata: {
                            eventType: 'staff_onboarding_reminder',
                            onboardingType: onboarding.type,
                            onboardingDays: onboarding.days,
                        },
                    });
                    this.logger.info('Created staff onboarding schedule', {
                        staffId: data.staffId,
                        departmentId: data.departmentId,
                        scheduleId,
                        onboardingType: onboarding.type,
                        scheduleDate: scheduleDate,
                    });
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to process department staff assignment', {
                staffId: data.staffId,
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle department resource updated event
     */
    async handleDepartmentResourceUpdated(data) {
        this.logger.info('Processing department resource update', {
            departmentId: data.departmentId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            resourceName: data.resourceName,
            action: data.action,
        });
        try {
            // Create resource monitoring schedules based on action
            if (data.action === 'added' || data.action === 'updated') {
                // Schedule regular resource utilization monitoring
                const monitoringScheduleId = `resource-monitoring-${data.resourceId}`;
                await this.createScheduleUseCase.execute({
                    id: monitoringScheduleId,
                    name: `Resource Utilization Monitoring - ${data.resourceName}`,
                    description: `Monitor utilization of ${data.resourceName} in ${data.departmentName}`,
                    cronExpression: '0 */4 * * *', // Every 4 hours
                    timezone: 'Asia/Ho_Chi_Minh',
                    isActive: true,
                    ownerService: 'scheduler-service',
                    topicOrCommand: 'department.resource.monitoring',
                    payload: {
                        departmentId: data.departmentId,
                        departmentCode: data.departmentCode,
                        departmentName: data.departmentName,
                        resourceType: data.resourceType,
                        resourceId: data.resourceId,
                        resourceName: data.resourceName,
                        action: data.action,
                        details: data.details,
                    },
                    metadata: {
                        eventType: 'resource_utilization_monitoring',
                        monitoringInterval: '4hours',
                        updatedAt: data.updatedAt.toISOString(),
                        updatedBy: data.updatedBy,
                    },
                });
                this.logger.info('Created resource monitoring schedule', {
                    resourceId: data.resourceId,
                    departmentId: data.departmentId,
                    scheduleId: monitoringScheduleId,
                });
            }
            else if (data.action === 'maintenance') {
                // Schedule maintenance follow-up
                const maintenanceScheduleId = `resource-maintenance-${data.resourceId}`;
                const followUpDate = new Date(data.updatedAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days later
                await this.createScheduleUseCase.execute({
                    id: maintenanceScheduleId,
                    name: `Resource Maintenance Follow-up - ${data.resourceName}`,
                    description: `Follow-up on maintenance of ${data.resourceName}`,
                    cronExpression: this.generateCronForOneTime(followUpDate),
                    timezone: 'Asia/Ho_Chi_Minh',
                    isActive: true,
                    ownerService: 'scheduler-service',
                    topicOrCommand: 'department.resource.maintenance_followup',
                    payload: {
                        departmentId: data.departmentId,
                        departmentCode: data.departmentCode,
                        departmentName: data.departmentName,
                        resourceType: data.resourceType,
                        resourceId: data.resourceId,
                        resourceName: data.resourceName,
                        action: data.action,
                        details: data.details,
                    },
                    metadata: {
                        eventType: 'resource_maintenance_followup',
                        followUpDays: 7,
                        updatedAt: data.updatedAt.toISOString(),
                        updatedBy: data.updatedBy,
                    },
                });
                this.logger.info('Created resource maintenance follow-up schedule', {
                    resourceId: data.resourceId,
                    departmentId: data.departmentId,
                    scheduleId: maintenanceScheduleId,
                    followUpDate: followUpDate,
                });
            }
            else if (data.action === 'removed') {
                // Cancel existing monitoring schedules for removed resource
                const existingSchedules = await this.scheduleRepository.findByOwnerServiceAndTopic('scheduler-service', 'department.resource.monitoring');
                for (const schedule of existingSchedules) {
                    if (schedule.payload?.resourceId === data.resourceId) {
                        await this.cancelScheduleUseCase.execute(schedule.id);
                        this.logger.info('Cancelled resource monitoring schedule', {
                            resourceId: data.resourceId,
                            scheduleId: schedule.id,
                        });
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to process department resource update', {
                resourceId: data.resourceId,
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle department operational hours changed event
     */
    async handleDepartmentOperationalHoursChanged(data) {
        this.logger.info('Processing department operational hours change', {
            departmentId: data.departmentId,
            departmentName: data.departmentName,
            changedAt: data.changedAt,
            reason: data.reason,
        });
        try {
            // Cancel existing opening/closing schedules
            const existingSchedules = await this.scheduleRepository.findByOwnerServiceAndTopic('scheduler-service', 'department.operational_hours');
            for (const schedule of existingSchedules) {
                if (schedule.payload?.departmentId === data.departmentId) {
                    await this.cancelScheduleUseCase.execute(schedule.id);
                    this.logger.info('Cancelled operational hours schedule', {
                        departmentId: data.departmentId,
                        scheduleId: schedule.id,
                    });
                }
            }
            // Create new opening/closing schedules based on new hours
            await this.createOperatingHoursSchedules({
                departmentId: data.departmentId,
                departmentCode: '', // Will be filled by existing data
                departmentName: data.departmentName,
                departmentType: 'clinical', // Default
                operatingHours: data.newHours,
                createdAt: data.changedAt,
                createdBy: data.changedBy,
            });
            this.logger.info('Updated operational hours schedules', {
                departmentId: data.departmentId,
                newHours: data.newHours,
            });
        }
        catch (error) {
            this.logger.error('Failed to process department operational hours change', {
                departmentId: data.departmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Create operating hours schedules
     */
    async createOperatingHoursSchedules(data) {
        if (!data.operatingHours)
            return;
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        for (const day of days) {
            const hours = data.operatingHours[day];
            if (hours && hours.open !== hours.close) {
                // Create opening reminder
                const [openHour, openMinute] = hours.open.split(':').map(Number);
                const openingScheduleId = `dept-opening-${data.departmentId}-${day}`;
                await this.createScheduleUseCase.execute({
                    id: openingScheduleId,
                    name: `Department Opening Reminder - ${data.departmentName}`,
                    description: `Daily opening reminder for ${data.departmentName}`,
                    cronExpression: `${openMinute} ${openHour} * * ${this.getDayNumber(day)}`,
                    timezone: 'Asia/Ho_Chi_Minh',
                    isActive: true,
                    ownerService: 'scheduler-service',
                    topicOrCommand: 'department.operational_hours',
                    payload: {
                        departmentId: data.departmentId,
                        departmentCode: data.departmentCode,
                        departmentName: data.departmentName,
                        day: day,
                        action: 'opening',
                        time: hours.open,
                    },
                    metadata: {
                        eventType: 'department_opening_reminder',
                        day: day,
                        time: hours.open,
                    },
                });
                // Create closing reminder
                const [closeHour, closeMinute] = hours.close.split(':').map(Number);
                const closingScheduleId = `dept-closing-${data.departmentId}-${day}`;
                await this.createScheduleUseCase.execute({
                    id: closingScheduleId,
                    name: `Department Closing Reminder - ${data.departmentName}`,
                    description: `Daily closing reminder for ${data.departmentName}`,
                    cronExpression: `${closeMinute} ${closeHour} * * ${this.getDayNumber(day)}`,
                    timezone: 'Asia/Ho_Chi_Minh',
                    isActive: true,
                    ownerService: 'scheduler-service',
                    topicOrCommand: 'department.operational_hours',
                    payload: {
                        departmentId: data.departmentId,
                        departmentCode: data.departmentCode,
                        departmentName: data.departmentName,
                        day: day,
                        action: 'closing',
                        time: hours.close,
                    },
                    metadata: {
                        eventType: 'department_closing_reminder',
                        day: day,
                        time: hours.close,
                    },
                });
                this.logger.info('Created operational hours schedules', {
                    departmentId: data.departmentId,
                    day: day,
                    openingSchedule: openingScheduleId,
                    closingSchedule: closingScheduleId,
                });
            }
        }
    }
    /**
     * Get day number for cron expression
     */
    getDayNumber(day) {
        const dayMap = {
            'sunday': 0,
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
        };
        return dayMap[day] || 1;
    }
    /**
     * Generate cron expression for one-time event
     */
    generateCronForOneTime(date) {
        return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
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
            this.logger.info('Department event consumer disconnected successfully');
        }
        catch (error) {
            this.logger.error('Error disconnecting department event consumer', {
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