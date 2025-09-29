// Appointment Notification Templates
// Hospital Management System - Vietnamese Language Support

import { NotificationTemplate, AppointmentReminderData, AppointmentNotificationData } from '../types/notification.types';

// =====================================================
// VIETNAMESE APPOINTMENT TEMPLATES
// =====================================================

export const APPOINTMENT_TEMPLATES_VI = {
  // Appointment Reminder Templates
  REMINDER_24H: {
    subject: 'Nhắc nhở lịch khám - Bệnh viện ABC',
    content: `
Kính chào {{patientName}},

Đây là lời nhắc về lịch khám của quý khách:

📅 Ngày khám: {{appointmentDate}}
🕐 Giờ khám: {{appointmentTime}}
👨‍⚕️ Bác sĩ: {{doctorName}}
🏥 Khoa: {{department}}
📍 Địa điểm: {{location}}
🔢 Mã lịch khám: {{appointmentId}}

Vui lòng đến đúng giờ và mang theo:
- Thẻ bảo hiểm y tế (nếu có)
- Giấy tờ tùy thân
- Kết quả xét nghiệm cũ (nếu có)

Nếu cần thay đổi lịch hẹn, vui lòng liên hệ: 1900-xxxx

Trân trọng,
Bệnh viện ABC
    `.trim()
  },

  REMINDER_2H: {
    subject: 'Sắp đến giờ khám - Bệnh viện ABC',
    content: `
Kính chào {{patientName}},

Lịch khám của quý khách sẽ bắt đầu trong 2 giờ nữa:

🕐 Giờ khám: {{appointmentTime}}
👨‍⚕️ Bác sĩ: {{doctorName}}
📍 Địa điểm: {{location}}

Vui lòng chuẩn bị và đến đúng giờ.

Bệnh viện ABC
    `.trim()
  },

  REMINDER_30M: {
    subject: 'Chuẩn bị khám bệnh - Bệnh viện ABC',
    content: `
Kính chào {{patientName}},

Lịch khám của quý khách sẽ bắt đầu trong 30 phút nữa:

🕐 Giờ khám: {{appointmentTime}}
👨‍⚕️ Bác sĩ: {{doctorName}}
📍 Địa điểm: {{location}}

Vui lòng có mặt tại bệnh viện ngay bây giờ.

Bệnh viện ABC
    `.trim()
  },

  // Appointment Status Templates
  APPOINTMENT_CREATED: {
    subject: 'Xác nhận đặt lịch khám - Bệnh viện ABC',
    content: `
Kính chào {{patientName}},

Lịch khám của quý khách đã được đặt thành công:

📅 Ngày khám: {{appointmentDate}}
🕐 Giờ khám: {{appointmentTime}}
👨‍⚕️ Bác sĩ: {{doctorName}}
🏥 Khoa: {{department}}
📍 Địa điểm: {{location}}
🔢 Mã lịch khám: {{appointmentId}}

Vui lòng đến đúng giờ và mang theo giấy tờ cần thiết.

Để hủy hoặc thay đổi lịch hẹn, vui lòng liên hệ: 1900-xxxx

Trân trọng,
Bệnh viện ABC
    `.trim()
  },

  APPOINTMENT_UPDATED: {
    subject: 'Thay đổi lịch khám - Bệnh viện ABC',
    content: `
Kính chào {{patientName}},

Lịch khám của quý khách đã được cập nhật:

📅 Ngày khám: {{appointmentDate}}
🕐 Giờ khám: {{appointmentTime}}
👨‍⚕️ Bác sĩ: {{doctorName}}
🏥 Khoa: {{department}}
📍 Địa điểm: {{location}}
🔢 Mã lịch khám: {{appointmentId}}

{{#if changes}}
Những thay đổi:
{{#each changes}}
- {{this}}
{{/each}}
{{/if}}

Vui lòng ghi nhớ thông tin mới và đến đúng giờ.

Trân trọng,
Bệnh viện ABC
    `.trim()
  },

  APPOINTMENT_CANCELLED: {
    subject: 'Hủy lịch khám - Bệnh viện ABC',
    content: `
Kính chào {{patientName}},

Lịch khám của quý khách đã được hủy:

📅 Ngày khám: {{appointmentDate}}
🕐 Giờ khám: {{appointmentTime}}
👨‍⚕️ Bác sĩ: {{doctorName}}
🔢 Mã lịch khám: {{appointmentId}}

{{#if reason}}
Lý do hủy: {{reason}}
{{/if}}

Để đặt lịch khám mới, vui lòng liên hệ: 1900-xxxx

Trân trọng,
Bệnh viện ABC
    `.trim()
  }
};

// =====================================================
// ENGLISH APPOINTMENT TEMPLATES
// =====================================================

export const APPOINTMENT_TEMPLATES_EN = {
  REMINDER_24H: {
    subject: 'Appointment Reminder - ABC Hospital',
    content: `
Dear {{patientName}},

This is a reminder about your upcoming appointment:

📅 Date: {{appointmentDate}}
🕐 Time: {{appointmentTime}}
👨‍⚕️ Doctor: {{doctorName}}
🏥 Department: {{department}}
📍 Location: {{location}}
🔢 Appointment ID: {{appointmentId}}

Please arrive on time and bring:
- Health insurance card (if applicable)
- ID documents
- Previous test results (if any)

To reschedule, please call: 1900-xxxx

Best regards,
ABC Hospital
    `.trim()
  },

  APPOINTMENT_CREATED: {
    subject: 'Appointment Confirmation - ABC Hospital',
    content: `
Dear {{patientName}},

Your appointment has been successfully scheduled:

📅 Date: {{appointmentDate}}
🕐 Time: {{appointmentTime}}
👨‍⚕️ Doctor: {{doctorName}}
🏥 Department: {{department}}
📍 Location: {{location}}
🔢 Appointment ID: {{appointmentId}}

Please arrive on time with necessary documents.

To cancel or reschedule, please call: 1900-xxxx

Best regards,
ABC Hospital
    `.trim()
  }
};

// =====================================================
// TEMPLATE RENDERING FUNCTIONS
// =====================================================

export class AppointmentTemplateRenderer {
  
  static renderReminderTemplate(
    data: AppointmentReminderData,
    language: 'vi' | 'en' = 'vi'
  ): { subject: string; content: string } {
    const templates = language === 'vi' ? APPOINTMENT_TEMPLATES_VI : APPOINTMENT_TEMPLATES_EN;
    
    let template;
    switch (data.reminderType) {
      case '24h':
        template = templates.REMINDER_24H;
        break;
      case '2h':
        template = templates.REMINDER_2H || templates.REMINDER_24H;
        break;
      case '30m':
        template = templates.REMINDER_30M || templates.REMINDER_24H;
        break;
      default:
        template = templates.REMINDER_24H;
    }
    
    return {
      subject: this.interpolateTemplate(template.subject, data),
      content: this.interpolateTemplate(template.content, data)
    };
  }
  
  static renderAppointmentTemplate(
    type: 'created' | 'updated' | 'cancelled',
    data: AppointmentNotificationData,
    language: 'vi' | 'en' = 'vi'
  ): { subject: string; content: string } {
    const templates = language === 'vi' ? APPOINTMENT_TEMPLATES_VI : APPOINTMENT_TEMPLATES_EN;
    
    let template;
    switch (type) {
      case 'created':
        template = templates.APPOINTMENT_CREATED;
        break;
      case 'updated':
        template = templates.APPOINTMENT_UPDATED;
        break;
      case 'cancelled':
        template = templates.APPOINTMENT_CANCELLED;
        break;
      default:
        template = templates.APPOINTMENT_CREATED;
    }
    
    return {
      subject: this.interpolateTemplate(template.subject, data),
      content: this.interpolateTemplate(template.content, data)
    };
  }
  
  private static interpolateTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}

// =====================================================
// TEMPLATE REGISTRY
// =====================================================

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'appointment_reminder_24h_vi',
    name: 'Nhắc nhở lịch khám 24h',
    type: 'appointment_reminder',
    language: 'vi',
    subject: APPOINTMENT_TEMPLATES_VI.REMINDER_24H.subject,
    content: APPOINTMENT_TEMPLATES_VI.REMINDER_24H.content,
    variables: ['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'department', 'location', 'appointmentId'],
    isActive: true
  },
  {
    id: 'appointment_created_vi',
    name: 'Xác nhận đặt lịch khám',
    type: 'appointment_created',
    language: 'vi',
    subject: APPOINTMENT_TEMPLATES_VI.APPOINTMENT_CREATED.subject,
    content: APPOINTMENT_TEMPLATES_VI.APPOINTMENT_CREATED.content,
    variables: ['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'department', 'location', 'appointmentId'],
    isActive: true
  },
  {
    id: 'appointment_updated_vi',
    name: 'Thay đổi lịch khám',
    type: 'appointment_updated',
    language: 'vi',
    subject: APPOINTMENT_TEMPLATES_VI.APPOINTMENT_UPDATED.subject,
    content: APPOINTMENT_TEMPLATES_VI.APPOINTMENT_UPDATED.content,
    variables: ['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'department', 'location', 'appointmentId', 'changes'],
    isActive: true
  },
  {
    id: 'appointment_cancelled_vi',
    name: 'Hủy lịch khám',
    type: 'appointment_cancelled',
    language: 'vi',
    subject: APPOINTMENT_TEMPLATES_VI.APPOINTMENT_CANCELLED.subject,
    content: APPOINTMENT_TEMPLATES_VI.APPOINTMENT_CANCELLED.content,
    variables: ['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'appointmentId', 'reason'],
    isActive: true
  }
];
