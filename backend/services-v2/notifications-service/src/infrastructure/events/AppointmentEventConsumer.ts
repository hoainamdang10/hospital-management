/**
 * Appointment Event Consumer - Infrastructure Layer
 * Consumes appointment events from Appointments Service
 * Handles appointment notifications, reminders, confirmations, and status updates
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from 'amqplib';
import { IInboxRepository } from '../../domain/repositories/IInboxRepository';
import { SendNotificationUseCase } from '../../application/use-cases/SendNotificationUseCase';
import { GetNotificationPreferencesUseCase } from '../../application/use-cases/GetNotificationPreferencesUseCase';

export interface AppointmentEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface AppointmentScheduledEventData {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: Date;
  appointmentTime: string;
  durationMinutes: number;
  type: string;
  priority: string;
  status: string;
  consultationFee: number;
  createdBy: string;
  scheduledAt: Date;
  notes?: string;
}

export interface AppointmentConfirmedEventData {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentTime: string;
  confirmedBy: string;
  confirmedAt: Date;
  previousStatus: string;
}

export interface AppointmentCancelledEventData {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentTime: string;
  cancelledBy: string;
  cancelledAt: Date;
  cancellationReason: string;
  refundAmount?: number;
  cancellationFee?: number;
}

export interface AppointmentCompletedEventData {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentTime: string;
  completedBy: string;
  completedAt: Date;
  outcome: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  notes?: string;
  prescriptionProvided: boolean;
  labTestsOrdered: boolean;
}

export interface AppointmentRescheduledEventData {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  oldDate: Date;
  oldTime: string;
  newDate: Date;
  newTime: string;
  rescheduledBy: string;
  rescheduledAt: Date;
  reason: string;
}

export interface AppointmentReminderEventData {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentTime: string;
  reminderType: '24_hours' | '2_hours' | '30_minutes';
  reminderSentAt: Date;
  departmentName: string;
  address?: string;
  specialInstructions?: string[];
}

export interface AppointmentNoShowEventData {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentTime: string;
  markedBy: string;
  markedAt: Date;
  noShowFee?: number;
  rescheduleOffered: boolean;
}

/**
 * AppointmentEventConsumer - Handles appointment events for notifications
 */
export class AppointmentEventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;

  constructor(
    private config: AppointmentEventConsumerConfig,
    private sendNotificationUseCase: SendNotificationUseCase,
    private getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase,
    private inboxRepo: IInboxRepository,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      console.log('Connecting to RabbitMQ for Appointment events', {
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
        await this.channel.bindQueue(
          this.config.queueName,
          this.config.exchangeName,
          routingKey,
        );
        console.log('Queue bound to routing key', {
          queueName: this.config.queueName,
          routingKey,
        });
      }

      // Start consuming
      await this.channel.consume(
        this.config.queueName,
        this.handleMessage.bind(this),
        { noAck: false },
      );

      this.isConnected = true;
      console.log('Appointment event consumer connected successfully');

      // Handle connection errors
      this.connection.on('error', (error: Error) => {
        console.error('RabbitMQ connection error', {
          error: error.message,
        });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
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
        console.error('[AppointmentEventConsumer] Missing eventId, cannot process:', event);
        this.channel?.ack(msg);
        return;
      }

      if (await this.inboxRepo.exists(eventId)) {
        console.debug(`[AppointmentEventConsumer] Duplicate event ${eventId}, skipping`);
        this.channel?.ack(msg);
        return;
      }

      console.log(`[AppointmentEventConsumer] Processing event: ${routingKey} (${eventId})`);

      // Route to appropriate handler
      switch (routingKey) {
        case 'appointment.scheduled':
          await this.handleAppointmentScheduled(event.payload as AppointmentScheduledEventData);
          break;

        case 'appointment.confirmed':
          await this.handleAppointmentConfirmed(event.payload as AppointmentConfirmedEventData);
          break;

        case 'appointment.cancelled':
          await this.handleAppointmentCancelled(event.payload as AppointmentCancelledEventData);
          break;

        case 'appointment.completed':
          await this.handleAppointmentCompleted(event.payload as AppointmentCompletedEventData);
          break;

        case 'appointment.rescheduled':
          await this.handleAppointmentRescheduled(event.payload as AppointmentRescheduledEventData);
          break;

        case 'appointment.reminder':
          await this.handleAppointmentReminder(event.payload as AppointmentReminderEventData);
          break;

        case 'appointment.no_show':
          await this.handleAppointmentNoShow(event.payload as AppointmentNoShowEventData);
          break;

        default:
          console.warn('Unhandled routing key', { routingKey });
          break;
      }

      // Store in inbox after successful processing
      await this.inboxRepo.store({
        idempotencyKey: eventId,
        eventType: 'appointment.scheduled',
        payload: event
      });

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      console.error('Error processing appointment event', {
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
   * Handle appointment scheduled event
   */
  private async handleAppointmentScheduled(data: AppointmentScheduledEventData): Promise<void> {
    console.log('Processing appointment scheduled for notifications', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
    });

    try {
      // Get patient notification preferences
      const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.patientId,
        userType: 'patient',
      });

      // Send appointment confirmation to patient
      await this.sendAppointmentConfirmationToPatient(data, patientPreferences);

      // Send appointment notification to doctor
      const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.doctorId,
        userType: 'staff',
      });

      await this.sendAppointmentNotificationToDoctor(data, doctorPreferences);

      // Send department notification if required
      if (data.priority === 'emergency' || data.priority === 'urgent') {
        await this.sendUrgentAppointmentNotification(data);
      }

      // Schedule reminder notifications
      await this.scheduleAppointmentReminders(data, patientPreferences);

    } catch (error) {
      console.error('Failed to process appointment scheduled', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle appointment confirmed event
   */
  private async handleAppointmentConfirmed(data: AppointmentConfirmedEventData): Promise<void> {
    console.log('Processing appointment confirmed for notifications', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      confirmedBy: data.confirmedBy,
      confirmedAt: data.confirmedAt,
    });

    try {
      // Send confirmation to patient
      const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.patientId,
        userType: 'patient',
      });

      await this.sendAppointmentConfirmedNotification(data, patientPreferences);

      // Send confirmation to doctor
      const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.doctorId,
        userType: 'staff',
      });

      await this.sendDoctorAppointmentConfirmedNotification(data, doctorPreferences);

    } catch (error) {
      console.error('Failed to process appointment confirmed', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle appointment cancelled event
   */
  private async handleAppointmentCancelled(data: AppointmentCancelledEventData): Promise<void> {
    console.log('Processing appointment cancelled for notifications', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      cancelledBy: data.cancelledBy,
      cancellationReason: data.cancellationReason,
    });

    try {
      // Send cancellation notification to patient
      const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.patientId,
        userType: 'patient',
      });

      await this.sendAppointmentCancelledNotification(data, patientPreferences);

      // Send cancellation notification to doctor
      const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.doctorId,
        userType: 'staff',
      });

      await this.sendDoctorAppointmentCancelledNotification(data, doctorPreferences);

      // Send refund information if applicable
      if (data.refundAmount && data.refundAmount > 0) {
        await this.sendRefundNotification(data, patientPreferences);
      }

    } catch (error) {
      console.error('Failed to process appointment cancelled', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle appointment completed event
   */
  private async handleAppointmentCompleted(data: AppointmentCompletedEventData): Promise<void> {
    console.log('Processing appointment completed for notifications', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      completedBy: data.completedBy,
      outcome: data.outcome,
      followUpRequired: data.followUpRequired,
    });

    try {
      // Send completion notification to patient
      const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.patientId,
        userType: 'patient',
      });

      await this.sendAppointmentCompletedNotification(data, patientPreferences);

      // Send follow-up notification if required
      if (data.followUpRequired && data.followUpDate) {
        await this.sendFollowUpNotification(data, patientPreferences);
      }

      // Send prescription notification if provided
      if (data.prescriptionProvided) {
        await this.sendPrescriptionNotification(data, patientPreferences);
      }

      // Send lab test notification if ordered
      if (data.labTestsOrdered) {
        await this.sendLabTestNotification(data, patientPreferences);
      }

    } catch (error) {
      console.error('Failed to process appointment completed', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle appointment rescheduled event
   */
  private async handleAppointmentRescheduled(data: AppointmentRescheduledEventData): Promise<void> {
    console.log('Processing appointment rescheduled for notifications', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      oldDate: data.oldDate,
      oldTime: data.oldTime,
      newDate: data.newDate,
      newTime: data.newTime,
      rescheduledBy: data.rescheduledBy,
    });

    try {
      // Send reschedule notification to patient
      const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.patientId,
        userType: 'patient',
      });

      await this.sendAppointmentRescheduledNotification(data, patientPreferences);

      // Send reschedule notification to doctor
      const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.doctorId,
        userType: 'staff',
      });

      await this.sendDoctorAppointmentRescheduledNotification(data, doctorPreferences);

      // Update reminder schedules for new time
      await this.updateReminderSchedules(data, patientPreferences);

    } catch (error) {
      console.error('Failed to process appointment rescheduled', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle appointment reminder event
   */
  private async handleAppointmentReminder(data: AppointmentReminderEventData): Promise<void> {
    console.log('Processing appointment reminder for notifications', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      reminderType: data.reminderType,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
    });

    try {
      // Get patient notification preferences
      const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.patientId,
        userType: 'patient',
      });

      // Send reminder notification to patient
      await this.sendAppointmentReminderNotification(data, patientPreferences);

      // Send reminder to doctor for specific reminder types
      if (data.reminderType === '2_hours' || data.reminderType === '30_minutes') {
        const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
          userId: data.doctorId,
          userType: 'staff',
        });

        await this.sendDoctorReminderNotification(data, doctorPreferences);
      }

    } catch (error) {
      console.error('Failed to process appointment reminder', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle appointment no-show event
   */
  private async handleAppointmentNoShow(data: AppointmentNoShowEventData): Promise<void> {
    console.log('Processing appointment no-show for notifications', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      markedBy: data.markedBy,
      noShowFee: data.noShowFee,
    });

    try {
      // Send no-show notification to patient
      const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.patientId,
        userType: 'patient',
      });

      await this.sendNoShowNotification(data, patientPreferences);

      // Send no-show notification to doctor
      const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
        userId: data.doctorId,
        userType: 'staff',
      });

      await this.sendDoctorNoShowNotification(data, doctorPreferences);

      // Send reschedule offer if applicable
      if (data.rescheduleOffered) {
        await this.sendRescheduleOffer(data, patientPreferences);
      }

    } catch (error) {
      console.error('Failed to process appointment no-show', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send appointment confirmation to patient
   */
  private async sendAppointmentConfirmationToPatient(
    data: AppointmentScheduledEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'appointment_confirmation',
        title: 'Xác nhận lịch hẹn thành công',
        content: this.generateAppointmentConfirmationContent(data),
        channels: this.getEnabledChannels(preferences, ['email', 'sms', 'in_app']),
        priority: this.mapPriority(data.priority),
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          doctorName: data.doctorName,
          departmentName: data.departmentName,
          consultationFee: data.consultationFee,
        },
        templateData: {
          patientName: data.patientName,
          doctorName: data.doctorName,
          departmentName: data.departmentName,
          appointmentDate: this.formatDate(data.appointmentDate),
          appointmentTime: data.appointmentTime,
          consultationFee: data.consultationFee,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
      console.log('Sent appointment confirmation to patient', {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
      });

    } catch (error) {
      console.error('Failed to send appointment confirmation to patient', {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send appointment notification to doctor
   */
  private async sendAppointmentNotificationToDoctor(
    data: AppointmentScheduledEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.doctorId,
        recipientType: 'staff',
        type: 'new_appointment',
        title: 'Lịch hẹn mới',
        content: this.generateDoctorAppointmentContent(data),
        channels: this.getEnabledChannels(preferences, ['in_app', 'email']),
        priority: this.mapPriority(data.priority),
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientName: data.patientName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          departmentName: data.departmentName,
        },
        templateData: {
          doctorName: data.doctorName,
          patientName: data.patientName,
          appointmentDate: this.formatDate(data.appointmentDate),
          appointmentTime: data.appointmentTime,
          departmentName: data.departmentName,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
      console.log('Sent appointment notification to doctor', {
        appointmentId: data.appointmentId,
        doctorId: data.doctorId,
      });

    } catch (error) {
      console.error('Failed to send appointment notification to doctor', {
        appointmentId: data.appointmentId,
        doctorId: data.doctorId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send urgent appointment notification
   */
  private async sendUrgentAppointmentNotification(data: AppointmentScheduledEventData): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.departmentId,
        recipientType: 'department',
        type: 'urgent_appointment',
        title: 'Lịch hẹn khẩn cấp',
        content: `Lịch hẹn khẩn cấp đã được đặt cho bệnh nhân ${data.patientName} với bác sĩ ${data.doctorName} vào lúc ${this.formatDate(data.appointmentDate)} ${data.appointmentTime}`,
        channels: ['in_app', 'email'],
        priority: 'urgent',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          doctorId: data.doctorId,
          urgency: data.priority,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
      console.log('Sent urgent appointment notification', {
        appointmentId: data.appointmentId,
        departmentId: data.departmentId,
      });

    } catch (error) {
      console.error('Failed to send urgent appointment notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Schedule appointment reminders
   */
  private async scheduleAppointmentReminders(
    data: AppointmentScheduledEventData,
    preferences: any
  ): Promise<void> {
    try {
      const appointmentDateTime = new Date(`${data.appointmentDate.toISOString().split('T')[0]}T${data.appointmentTime}`);
      
      // Calculate reminder times
      const reminderTimes = [
        {
          type: '24_hours',
          scheduledAt: new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000)),
        },
        {
          type: '2_hours',
          scheduledAt: new Date(appointmentDateTime.getTime() - (2 * 60 * 60 * 1000)),
        },
        {
          type: '30_minutes',
          scheduledAt: new Date(appointmentDateTime.getTime() - (30 * 60 * 1000)),
        },
      ];

      for (const reminder of reminderTimes) {
        if (reminder.scheduledAt > new Date()) {
          const notificationData = {
            recipientId: data.patientId,
            recipientType: 'patient',
            type: 'appointment_reminder',
            title: 'Nhắc nhở lịch hẹn',
            content: this.generateReminderContent(data, reminder.type),
            channels: this.getEnabledChannels(preferences, ['sms', 'email', 'in_app']),
            priority: 'normal',
            scheduledAt: reminder.scheduledAt,
            metadata: {
              appointmentId: data.appointmentId,
              reminderType: reminder.type,
              appointmentDate: data.appointmentDate,
              appointmentTime: data.appointmentTime,
            },
            templateData: {
              patientName: data.patientName,
              doctorName: data.doctorName,
              appointmentDate: this.formatDate(data.appointmentDate),
              appointmentTime: data.appointmentTime,
              reminderType: reminder.type,
            },
          };

          await this.sendNotificationUseCase.execute(notificationData);
        }
      }

      console.log('Scheduled appointment reminders', {
        appointmentId: data.appointmentId,
        remindersCount: reminderTimes.length,
      });

    } catch (error) {
      console.error('Failed to schedule appointment reminders', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate appointment confirmation content
   */
  private generateAppointmentConfirmationContent(data: AppointmentScheduledEventData): string {
    return `
      Kính gửi ${data.patientName},
      
      Lịch hẹn của bạn đã được xác nhận:
      - Bác sĩ: ${data.doctorName}
      - Khoa: ${data.departmentName}
      - Thời gian: ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}
      - Phí khám: ${data.consultationFee.toLocaleString('vi-VN')} VNĐ
      
      Vui lòng đến trước 15 phút để hoàn tất thủ tục.
      
      Trân trọng,
      Bệnh viện
    `.trim();
  }

  /**
   * Generate doctor appointment content
   */
  private generateDoctorAppointmentContent(data: AppointmentScheduledEventData): string {
    return `
      Bác sĩ ${data.doctorName},
      
      Bạn có lịch hẹn mới:
      - Bệnh nhân: ${data.patientName}
      - Khoa: ${data.departmentName}
      - Thời gian: ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}
      - Mức độ ưu tiên: ${data.priority}
      
      Vui lòng kiểm tra thông tin chi tiết trong hệ thống.
    `.trim();
  }

  /**
   * Generate reminder content
   */
  private generateReminderContent(data: AppointmentScheduledEventData, reminderType: string): string {
    const timeText = {
      '24_hours': 'ngày mai',
      '2_hours': 'sau 2 giờ',
      '30_minutes': 'sau 30 phút',
    }[reminderType] || 'sắp tới';

    return `
      Nhắc nhở: Bạn có lịch hẹn ${timeText}
      
      - Bác sĩ: ${data.doctorName}
      - Khoa: ${data.departmentName}
      - Thời gian: ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}
      
      Vui lòng đến đúng giờ.
    `.trim();
  }

  /**
   * Get enabled channels based on preferences
   */
  private getEnabledChannels(preferences: any, defaultChannels: string[]): string[] {
    if (!preferences || !preferences.channels) {
      return defaultChannels;
    }

    return defaultChannels.filter(channel => 
      preferences.channels[channel] !== false
    );
  }

  /**
   * Map priority from appointment system to notification system
   */
  private mapPriority(appointmentPriority: string): string {
    const priorityMap: { [key: string]: string } = {
      'emergency': 'urgent',
      'urgent': 'high',
      'high': 'high',
      'normal': 'normal',
      'low': 'low',
    };

    return priorityMap[appointmentPriority] || 'normal';
  }

  /**
   * Format date for Vietnamese locale
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Send appointment confirmed notification
   */
  private async sendAppointmentConfirmedNotification(
    data: AppointmentConfirmedEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'appointment_confirmed',
        title: 'Lịch hẹn đã được xác nhận',
        content: `Lịch hẹn của bạn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã được xác nhận.`,
        channels: this.getEnabledChannels(preferences, ['email', 'sms', 'in_app']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          confirmedBy: data.confirmedBy,
          confirmedAt: data.confirmedAt,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send appointment confirmed notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send doctor appointment confirmed notification
   */
  private async sendDoctorAppointmentConfirmedNotification(
    data: AppointmentConfirmedEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.doctorId,
        recipientType: 'staff',
        type: 'appointment_confirmed',
        title: 'Lịch hẹn đã được xác nhận',
        content: `Lịch hẹn với bệnh nhân ${data.patientName} vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã được xác nhận.`,
        channels: this.getEnabledChannels(preferences, ['in_app', 'email']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          confirmedBy: data.confirmedBy,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send doctor appointment confirmed notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send appointment cancelled notification
   */
  private async sendAppointmentCancelledNotification(
    data: AppointmentCancelledEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'appointment_cancelled',
        title: 'Lịch hẹn đã bị hủy',
        content: `Lịch hẹn của bạn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã bị hủy. Lý do: ${data.cancellationReason}`,
        channels: this.getEnabledChannels(preferences, ['email', 'sms', 'in_app']),
        priority: 'high',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          cancelledBy: data.cancelledBy,
          cancellationReason: data.cancellationReason,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send appointment cancelled notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send doctor appointment cancelled notification
   */
  private async sendDoctorAppointmentCancelledNotification(
    data: AppointmentCancelledEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.doctorId,
        recipientType: 'staff',
        type: 'appointment_cancelled',
        title: 'Lịch hẹn đã bị hủy',
        content: `Lịch hẹn với bệnh nhân ${data.patientName} vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã bị hủy.`,
        channels: this.getEnabledChannels(preferences, ['in_app', 'email']),
        priority: 'high',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          cancelledBy: data.cancelledBy,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send doctor appointment cancelled notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send refund notification
   */
  private async sendRefundNotification(
    data: AppointmentCancelledEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'refund_processed',
        title: 'Hoàn tiền đã được xử lý',
        content: `Hoàn tiền ${data.refundAmount?.toLocaleString('vi-VN')} VNĐ đã được xử lý cho lịch hẹn đã hủy.`,
        channels: this.getEnabledChannels(preferences, ['email', 'in_app']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          refundAmount: data.refundAmount,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send refund notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send appointment completed notification
   */
  private async sendAppointmentCompletedNotification(
    data: AppointmentCompletedEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'appointment_completed',
        title: 'Lịch hẹn đã hoàn thành',
        content: `Lịch hẹn của bạn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã hoàn thành. Kết quả: ${data.outcome}`,
        channels: this.getEnabledChannels(preferences, ['email', 'in_app']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          completedBy: data.completedBy,
          outcome: data.outcome,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send appointment completed notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send follow-up notification
   */
  private async sendFollowUpNotification(
    data: AppointmentCompletedEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'follow_up_required',
        title: 'Cần tái khám',
        content: `Bạn cần tái khám vào ${this.formatDate(data.followUpDate!)}. Vui lòng đặt lịch hẹn mới.`,
        channels: this.getEnabledChannels(preferences, ['email', 'sms', 'in_app']),
        priority: 'high',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          followUpDate: data.followUpDate,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send follow-up notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send prescription notification
   */
  private async sendPrescriptionNotification(
    data: AppointmentCompletedEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'prescription_available',
        title: 'Đơn thuốc đã sẵn sàng',
        content: 'Đơn thuốc từ buổi khám của bạn đã sẵn sàng. Vui lòng đến nhà thuốc để lấy thuốc.',
        channels: this.getEnabledChannels(preferences, ['email', 'in_app']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send prescription notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send lab test notification
   */
  private async sendLabTestNotification(
    data: AppointmentCompletedEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'lab_tests_ordered',
        title: 'Đã chỉ định xét nghiệm',
        content: 'Bác sĩ đã chỉ định xét nghiệm. Vui lòng đến phòng xét nghiệm để thực hiện.',
        channels: this.getEnabledChannels(preferences, ['email', 'in_app']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send lab test notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send appointment rescheduled notification
   */
  private async sendAppointmentRescheduledNotification(
    data: AppointmentRescheduledEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'appointment_rescheduled',
        title: 'Lịch hẹn đã được dời',
        content: `Lịch hẹn của bạn đã được dời từ ${this.formatDate(data.oldDate)} lúc ${data.oldTime} sang ${this.formatDate(data.newDate)} lúc ${data.newTime}. Lý do: ${data.reason}`,
        channels: this.getEnabledChannels(preferences, ['email', 'sms', 'in_app']),
        priority: 'high',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          oldDate: data.oldDate,
          oldTime: data.oldTime,
          newDate: data.newDate,
          newTime: data.newTime,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send appointment rescheduled notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send doctor appointment rescheduled notification
   */
  private async sendDoctorAppointmentRescheduledNotification(
    data: AppointmentRescheduledEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.doctorId,
        recipientType: 'staff',
        type: 'appointment_rescheduled',
        title: 'Lịch hẹn đã được dời',
        content: `Lịch hẹn với bệnh nhân ${data.patientName} đã được dời từ ${this.formatDate(data.oldDate)} lúc ${data.oldTime} sang ${this.formatDate(data.newDate)} lúc ${data.newTime}.`,
        channels: this.getEnabledChannels(preferences, ['in_app', 'email']),
        priority: 'high',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          rescheduledBy: data.rescheduledBy,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send doctor appointment rescheduled notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update reminder schedules
   */
  private async updateReminderSchedules(
    data: AppointmentRescheduledEventData,
    preferences: any
  ): Promise<void> {
    try {
      // Cancel old reminders and create new ones
      const newAppointmentDateTime = new Date(`${data.newDate.toISOString().split('T')[0]}T${data.newTime}`);
      
      const reminderTimes = [
        {
          type: '24_hours',
          scheduledAt: new Date(newAppointmentDateTime.getTime() - (24 * 60 * 60 * 1000)),
        },
        {
          type: '2_hours',
          scheduledAt: new Date(newAppointmentDateTime.getTime() - (2 * 60 * 60 * 1000)),
        },
        {
          type: '30_minutes',
          scheduledAt: new Date(newAppointmentDateTime.getTime() - (30 * 60 * 1000)),
        },
      ];

      for (const reminder of reminderTimes) {
        if (reminder.scheduledAt > new Date()) {
          const notificationData = {
            recipientId: data.patientId,
            recipientType: 'patient',
            type: 'appointment_reminder',
            title: 'Nhắc nhở lịch hẹn (đã dời)',
            content: this.generateReminderContent({
              ...data,
              appointmentDate: data.newDate,
              appointmentTime: data.newTime,
            } as any, reminder.type),
            channels: this.getEnabledChannels(preferences, ['sms', 'email', 'in_app']),
            priority: 'normal',
            scheduledAt: reminder.scheduledAt,
            metadata: {
              appointmentId: data.appointmentId,
              reminderType: reminder.type,
              rescheduled: true,
            },
          };

          await this.sendNotificationUseCase.execute(notificationData);
        }
      }

    } catch (error) {
      console.error('Failed to update reminder schedules', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send appointment reminder notification
   */
  private async sendAppointmentReminderNotification(
    data: AppointmentReminderEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'appointment_reminder',
        title: 'Nhắc nhở lịch hẹn',
        content: this.generateReminderContent(data as any, data.reminderType),
        channels: this.getEnabledChannels(preferences, ['sms', 'email', 'in_app']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          reminderType: data.reminderType,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send appointment reminder notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send doctor reminder notification
   */
  private async sendDoctorReminderNotification(
    data: AppointmentReminderEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.doctorId,
        recipientType: 'staff',
        type: 'appointment_reminder',
        title: 'Nhắc nhở lịch hẹn',
        content: `Nhắc nhở: Bạn có lịch hẹn với bệnh nhân ${data.patientName} vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}.`,
        channels: this.getEnabledChannels(preferences, ['in_app', 'email']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          reminderType: data.reminderType,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send doctor reminder notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send no-show notification
   */
  private async sendNoShowNotification(
    data: AppointmentNoShowEventData,
    preferences: any
  ): Promise<void> {
    try {
      let content = `Bạn đã không đến lịch hẹn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}.`;
      
      if (data.noShowFee && data.noShowFee > 0) {
        content += ` Phí không đến: ${data.noShowFee.toLocaleString('vi-VN')} VNĐ.`;
      }

      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'appointment_no_show',
        title: 'Không đến lịch hẹn',
        content,
        channels: this.getEnabledChannels(preferences, ['email', 'sms', 'in_app']),
        priority: 'high',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
          noShowFee: data.noShowFee,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send no-show notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send doctor no-show notification
   */
  private async sendDoctorNoShowNotification(
    data: AppointmentNoShowEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.doctorId,
        recipientType: 'staff',
        type: 'appointment_no_show',
        title: 'Bệnh nhân không đến',
        content: `Bệnh nhân ${data.patientName} đã không đến lịch hẹn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}.`,
        channels: this.getEnabledChannels(preferences, ['in_app', 'email']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send doctor no-show notification', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send reschedule offer
   */
  private async sendRescheduleOffer(
    data: AppointmentNoShowEventData,
    preferences: any
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: 'patient',
        type: 'reschedule_offer',
        title: 'Đề nghị dời lịch hẹn',
        content: 'Chúng tôi xin lỗi vì sự bất tiện. Bạn có thể đặt lịch hẹn mới mà không tốn phí.',
        channels: this.getEnabledChannels(preferences, ['email', 'in_app']),
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: data.appointmentId,
        },
      };

      await this.sendNotificationUseCase.execute(notificationData);
    } catch (error) {
      console.error('Failed to send reschedule offer', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
      console.log('Appointment event consumer disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect Appointment event consumer:', error);
      throw error;
    }
  }

  /**
   * Check if consumer is connected
   */
  isConsumerConnected(): boolean {
    return this.isConnected && !!this.channel && !!this.connection;
  }
}
