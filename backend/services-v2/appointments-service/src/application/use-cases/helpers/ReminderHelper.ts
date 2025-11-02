/**
 * Reminder Helper - Calculate reminder times
 * 
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { AppointmentPriority } from '../../../domain/aggregates/Appointment.aggregate';

export interface ReminderWindow {
  type: '24h' | '2h' | '30min';
  sendAt: Date;
  channels: ('email' | 'sms' | 'push')[];
}

export class ReminderHelper {
  /**
   * Calculate reminder windows based on appointment time and priority
   */
  static calculateReminders(
    appointmentDateTime: Date,
    priority: AppointmentPriority
  ): ReminderWindow[] {
    const policy = this.getReminderPolicy(priority);
    const reminders: ReminderWindow[] = [];
    
    for (const window of policy.windows) {
      const sendAt = new Date(appointmentDateTime);
      
      // Calculate when to send
      if (window === '24h') {
        sendAt.setHours(sendAt.getHours() - 24);
      } else if (window === '2h') {
        sendAt.setHours(sendAt.getHours() - 2);
      } else if (window === '30min') {
        sendAt.setMinutes(sendAt.getMinutes() - 30);
      }
      
      // Only schedule if in future
      if (sendAt > new Date()) {
        reminders.push({
          type: window,
          sendAt,
          channels: policy.channels
        });
      }
    }
    
    return reminders;
  }

  /**
   * Get reminder policy based on priority
   */
  private static getReminderPolicy(priority: AppointmentPriority): {
    windows: ('24h' | '2h' | '30min')[];
    channels: ('email' | 'sms' | 'push')[];
  } {
    switch (priority) {
      case AppointmentPriority.EMERGENCY:
        return {
          windows: ['30min'],
          channels: ['sms', 'push']
        };
      
      case AppointmentPriority.URGENT:
        return {
          windows: ['2h', '30min'],
          channels: ['sms', 'push']
        };
      
      case AppointmentPriority.NORMAL:
      case AppointmentPriority.LOW:
      default:
        return {
          windows: ['24h', '2h'],
          channels: ['email', 'push']
        };
    }
  }
}
