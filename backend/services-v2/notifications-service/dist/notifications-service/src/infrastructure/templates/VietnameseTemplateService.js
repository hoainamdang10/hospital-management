"use strict";
/**
 * VietnameseTemplateService - Infrastructure Template Service
 * Vietnamese healthcare notification template service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VietnameseTemplateService = void 0;
const NotificationTemplate_1 = require("../../domain/value-objects/NotificationTemplate");
const NotificationContent_1 = require("../../domain/value-objects/NotificationContent");
class VietnameseTemplateService {
    constructor() {
        this.templates = new Map();
        this.templateUsage = new Map();
        this.initializeDefaultTemplates();
    }
    /**
     * Initialize default Vietnamese healthcare templates
     */
    initializeDefaultTemplates() {
        const defaultTemplates = [
            {
                templateId: 'appointment-reminder',
                templateType: 'APPOINTMENT_REMINDER',
                name: 'Nhắc nhở lịch hẹn khám',
                description: 'Template nhắc nhở bệnh nhân về lịch hẹn khám sắp tới',
                category: 'APPOINTMENT',
                channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
                content: {
                    subject: 'Nhắc nhở lịch hẹn khám - {{patientName}}',
                    body: `Kính chào {{patientName}},

Chúng tôi xin nhắc nhở về lịch hẹn khám của quý khách:

📅 Ngày khám: {{appointmentDate}}
🕐 Giờ khám: {{appointmentTime}}
👨‍⚕️ Bác sĩ: {{doctorName}}
🏥 Phòng khám: {{roomNumber}}
📍 Địa chỉ: {{hospitalAddress}}

Vui lòng có mặt trước 15 phút để làm thủ tục.

Nếu cần thay đổi lịch hẹn, vui lòng liên hệ: {{contactPhone}}

Trân trọng,
{{hospitalName}}`,
                    smsBody: 'Nhắc nhở: Lịch hẹn khám {{appointmentDate}} {{appointmentTime}} với BS {{doctorName}} tại {{hospitalName}}. LH: {{contactPhone}}',
                    pushTitle: 'Nhắc nhở lịch hẹn khám',
                    pushBody: 'Bạn có lịch hẹn khám vào {{appointmentDate}} lúc {{appointmentTime}}'
                },
                placeholders: ['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'roomNumber', 'hospitalAddress', 'contactPhone', 'hospitalName'],
                metadata: {
                    version: '1.0.0',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    priority: 'HIGH',
                    tags: ['appointment', 'reminder', 'healthcare']
                }
            },
            {
                templateId: 'test-results-ready',
                templateType: 'TEST_RESULTS_READY',
                name: 'Thông báo kết quả xét nghiệm',
                description: 'Template thông báo kết quả xét nghiệm đã có',
                category: 'MEDICAL_RECORDS',
                channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
                content: {
                    subject: 'Kết quả xét nghiệm đã có - {{patientName}}',
                    body: `Kính chào {{patientName}},

Kết quả xét nghiệm của quý khách đã có:

🔬 Loại xét nghiệm: {{testType}}
📅 Ngày lấy mẫu: {{sampleDate}}
📋 Mã xét nghiệm: {{testCode}}

Quý khách có thể:
• Xem kết quả trực tuyến tại: {{onlinePortalUrl}}
• Nhận kết quả tại quầy lễ tân
• Đặt lịch tư vấn với bác sĩ: {{consultationBookingUrl}}

{{#if requiresConsultation}}
⚠️ Lưu ý: Kết quả này cần được bác sĩ tư vấn thêm.
{{/if}}

Mọi thắc mắc xin liên hệ: {{contactPhone}}

Trân trọng,
{{hospitalName}}`,
                    smsBody: 'Kết quả xét nghiệm {{testType}} đã có. Xem tại {{onlinePortalUrl}} hoặc LH {{contactPhone}}',
                    pushTitle: 'Kết quả xét nghiệm đã có',
                    pushBody: 'Kết quả {{testType}} của bạn đã sẵn sàng'
                },
                placeholders: ['patientName', 'testType', 'sampleDate', 'testCode', 'onlinePortalUrl', 'consultationBookingUrl', 'requiresConsultation', 'contactPhone', 'hospitalName'],
                metadata: {
                    version: '1.0.0',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    priority: 'NORMAL',
                    tags: ['test-results', 'medical-records', 'healthcare']
                }
            },
            {
                templateId: 'payment-reminder',
                templateType: 'PAYMENT_REMINDER',
                name: 'Nhắc nhở thanh toán',
                description: 'Template nhắc nhở thanh toán viện phí',
                category: 'BILLING',
                channels: ['EMAIL', 'SMS', 'IN_APP'],
                content: {
                    subject: 'Nhắc nhở thanh toán viện phí - {{patientName}}',
                    body: `Kính chào {{patientName}},

Chúng tôi xin nhắc nhở về khoản viện phí chưa thanh toán:

🧾 Mã hóa đơn: {{invoiceNumber}}
💰 Số tiền: {{amount}} VNĐ
📅 Ngày khám: {{serviceDate}}
⏰ Hạn thanh toán: {{dueDate}}

Chi tiết dịch vụ:
{{#each services}}
• {{name}}: {{amount}} VNĐ
{{/each}}

Quý khách có thể thanh toán qua:
• Trực tiếp tại quầy thu ngân
• Chuyển khoản: {{bankAccount}}
• Thanh toán online: {{paymentUrl}}

{{#if insuranceCoverage}}
💳 Bảo hiểm chi trả: {{insuranceAmount}} VNĐ
💵 Số tiền cần thanh toán: {{finalAmount}} VNĐ
{{/if}}

Mọi thắc mắc xin liên hệ: {{contactPhone}}

Trân trọng,
{{hospitalName}}`,
                    smsBody: 'Nhắc nhở thanh toán hóa đơn {{invoiceNumber}}: {{amount}}đ. Hạn {{dueDate}}. Thanh toán: {{paymentUrl}}',
                    pushTitle: 'Nhắc nhở thanh toán',
                    pushBody: 'Bạn có hóa đơn {{amount}}đ cần thanh toán trước {{dueDate}}'
                },
                placeholders: ['patientName', 'invoiceNumber', 'amount', 'serviceDate', 'dueDate', 'services', 'bankAccount', 'paymentUrl', 'insuranceCoverage', 'insuranceAmount', 'finalAmount', 'contactPhone', 'hospitalName'],
                metadata: {
                    version: '1.0.0',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    priority: 'NORMAL',
                    tags: ['payment', 'billing', 'reminder']
                }
            },
            {
                templateId: 'emergency-alert',
                templateType: 'EMERGENCY_ALERT',
                name: 'Cảnh báo khẩn cấp',
                description: 'Template cảnh báo khẩn cấp cho bệnh nhân và gia đình',
                category: 'EMERGENCY',
                channels: ['SMS', 'VOICE', 'PUSH'],
                content: {
                    subject: 'KHẨN CẤP - {{alertType}}',
                    body: `🚨 CẢNH BÁO KHẨN CẤP 🚨

{{alertMessage}}

Bệnh nhân: {{patientName}}
Thời gian: {{alertTime}}
Địa điểm: {{location}}

Hành động cần thiết:
{{actionRequired}}

Liên hệ ngay: {{emergencyPhone}}

{{hospitalName}}`,
                    smsBody: '🚨 KHẨN CẤP: {{alertMessage}}. BN: {{patientName}}. LH ngay: {{emergencyPhone}}',
                    pushTitle: '🚨 CẢNH BÁO KHẨN CẤP',
                    pushBody: '{{alertMessage}} - {{patientName}}'
                },
                placeholders: ['alertType', 'alertMessage', 'patientName', 'alertTime', 'location', 'actionRequired', 'emergencyPhone', 'hospitalName'],
                metadata: {
                    version: '1.0.0',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    priority: 'URGENT',
                    tags: ['emergency', 'alert', 'urgent']
                }
            },
            {
                templateId: 'medication-reminder',
                templateType: 'MEDICATION_REMINDER',
                name: 'Nhắc nhở uống thuốc',
                description: 'Template nhắc nhở bệnh nhân uống thuốc đúng giờ',
                category: 'MEDICATION',
                channels: ['SMS', 'PUSH', 'IN_APP'],
                content: {
                    subject: 'Nhắc nhở uống thuốc - {{patientName}}',
                    body: `💊 Nhắc nhở uống thuốc

Kính chào {{patientName}},

Đã đến giờ uống thuốc:

💊 Tên thuốc: {{medicationName}}
📊 Liều lượng: {{dosage}}
🕐 Thời gian: {{medicationTime}}
🍽️ {{mealInstruction}}

Lưu ý:
{{#if sideEffects}}
⚠️ Tác dụng phụ có thể gặp: {{sideEffects}}
{{/if}}
{{#if specialInstructions}}
📝 Hướng dẫn đặc biệt: {{specialInstructions}}
{{/if}}

Nếu có bất thường, liên hệ ngay: {{doctorPhone}}

Chúc sức khỏe!
{{hospitalName}}`,
                    smsBody: '💊 Nhắc nhở: Uống {{medicationName}} {{dosage}} lúc {{medicationTime}}. {{mealInstruction}}',
                    pushTitle: '💊 Nhắc nhở uống thuốc',
                    pushBody: 'Đã đến giờ uống {{medicationName}} - {{dosage}}'
                },
                placeholders: ['patientName', 'medicationName', 'dosage', 'medicationTime', 'mealInstruction', 'sideEffects', 'specialInstructions', 'doctorPhone', 'hospitalName'],
                metadata: {
                    version: '1.0.0',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    priority: 'HIGH',
                    tags: ['medication', 'reminder', 'healthcare']
                }
            }
        ];
        defaultTemplates.forEach(template => {
            this.templates.set(template.templateId, template);
        });
    }
    /**
     * Apply template to create notification content
     */
    async applyTemplate(request) {
        try {
            const template = this.templates.get(request.templateId);
            if (!template) {
                throw new Error(`Không tìm thấy template: ${request.templateId}`);
            }
            if (!template.metadata.isActive) {
                throw new Error(`Template ${request.templateId} đã bị vô hiệu hóa`);
            }
            // Validate required placeholders
            const missingPlaceholders = template.placeholders.filter(placeholder => !(placeholder in request.templateData));
            if (missingPlaceholders.length > 0) {
                throw new Error(`Thiếu dữ liệu template: ${missingPlaceholders.join(', ')}`);
            }
            // Apply template data to content
            const processedContent = this.processTemplate(template.content, request.templateData);
            // Create notification template
            const notificationTemplate = NotificationTemplate_1.NotificationTemplate.create({
                templateId: template.templateId,
                templateType: template.templateType,
                name: template.name,
                category: template.category,
                content: processedContent,
                channels: template.channels,
                priority: template.metadata.priority,
                metadata: {
                    version: template.metadata.version,
                    tags: template.metadata.tags,
                    appliedAt: new Date(),
                    templateData: request.templateData
                }
            });
            // Create notification content
            const notificationContent = NotificationContent_1.NotificationContent.create({
                subject: processedContent.subject,
                body: processedContent.body,
                contentType: 'text/html',
                language: 'vi',
                attachments: request.attachments || [],
                metadata: {
                    templateId: template.templateId,
                    templateVersion: template.metadata.version,
                    generatedAt: new Date()
                }
            });
            // Track usage
            this.templateUsage.set(template.templateId, (this.templateUsage.get(template.templateId) || 0) + 1);
            return {
                template: notificationTemplate,
                content: notificationContent,
                channelContent: {
                    EMAIL: {
                        subject: processedContent.subject,
                        body: processedContent.body
                    },
                    SMS: {
                        body: processedContent.smsBody || this.truncateForSMS(processedContent.body)
                    },
                    PUSH: {
                        title: processedContent.pushTitle || processedContent.subject,
                        body: processedContent.pushBody || this.truncateForPush(processedContent.body)
                    },
                    IN_APP: {
                        title: processedContent.subject,
                        body: processedContent.body
                    }
                },
                metadata: {
                    templateId: template.templateId,
                    templateVersion: template.metadata.version,
                    processedAt: new Date(),
                    placeholdersUsed: template.placeholders.filter(p => p in request.templateData)
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi áp dụng template: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Process template with data
     */
    processTemplate(content, data) {
        const processedContent = {};
        Object.entries(content).forEach(([key, value]) => {
            if (typeof value === 'string') {
                processedContent[key] = this.replacePlaceholders(value, data);
            }
            else {
                processedContent[key] = value;
            }
        });
        return processedContent;
    }
    /**
     * Replace placeholders in text
     */
    replacePlaceholders(text, data) {
        let result = text;
        // Simple placeholder replacement {{placeholder}}
        Object.entries(data).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            const stringValue = this.formatValue(value);
            result = result.replace(new RegExp(placeholder, 'g'), stringValue);
        });
        // Handle conditional blocks {{#if condition}}...{{/if}}
        result = this.processConditionals(result, data);
        // Handle loops {{#each array}}...{{/each}}
        result = this.processLoops(result, data);
        return result;
    }
    /**
     * Format value for display
     */
    formatValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (value instanceof Date) {
            return value.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        if (typeof value === 'number') {
            return value.toLocaleString('vi-VN');
        }
        return String(value);
    }
    /**
     * Process conditional blocks
     */
    processConditionals(text, data) {
        const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
        return text.replace(conditionalRegex, (match, condition, content) => {
            const value = data[condition];
            return value ? content : '';
        });
    }
    /**
     * Process loop blocks
     */
    processLoops(text, data) {
        const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
        return text.replace(loopRegex, (match, arrayName, template) => {
            const array = data[arrayName];
            if (!Array.isArray(array)) {
                return '';
            }
            return array.map(item => {
                let itemContent = template;
                Object.entries(item).forEach(([key, value]) => {
                    const placeholder = `{{${key}}}`;
                    itemContent = itemContent.replace(new RegExp(placeholder, 'g'), this.formatValue(value));
                });
                return itemContent;
            }).join('');
        });
    }
    /**
     * Truncate content for SMS
     */
    truncateForSMS(content) {
        const maxLength = 160;
        const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim();
        if (cleanContent.length <= maxLength) {
            return cleanContent;
        }
        return cleanContent.substring(0, maxLength - 3) + '...';
    }
    /**
     * Truncate content for push notification
     */
    truncateForPush(content) {
        const maxLength = 100;
        const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, ' ').trim();
        if (cleanContent.length <= maxLength) {
            return cleanContent;
        }
        return cleanContent.substring(0, maxLength - 3) + '...';
    }
    /**
     * Get template by ID
     */
    async getTemplate(templateId) {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                return null;
            }
            return NotificationTemplate_1.NotificationTemplate.create({
                templateId: template.templateId,
                templateType: template.templateType,
                name: template.name,
                category: template.category,
                content: template.content,
                channels: template.channels,
                priority: template.metadata.priority,
                metadata: template.metadata
            });
        }
        catch (error) {
            throw new Error(`Lỗi khi lấy template: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Get templates by type
     */
    async getTemplatesByType(templateType) {
        try {
            const matchingTemplates = Array.from(this.templates.values())
                .filter(template => template.templateType === templateType && template.metadata.isActive);
            return matchingTemplates.map(template => NotificationTemplate_1.NotificationTemplate.create({
                templateId: template.templateId,
                templateType: template.templateType,
                name: template.name,
                category: template.category,
                content: template.content,
                channels: template.channels,
                priority: template.metadata.priority,
                metadata: template.metadata
            }));
        }
        catch (error) {
            throw new Error(`Lỗi khi lấy templates theo loại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Get template analytics
     */
    async getTemplateAnalytics(dateRange) {
        try {
            const totalTemplates = this.templates.size;
            const activeTemplates = Array.from(this.templates.values()).filter(t => t.metadata.isActive).length;
            // Calculate usage statistics
            const usageStats = {};
            this.templateUsage.forEach((count, templateId) => {
                usageStats[templateId] = count;
            });
            // Get most used templates
            const mostUsedTemplates = Object.entries(usageStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([templateId, count]) => ({
                templateId,
                templateName: this.templates.get(templateId)?.name || 'Unknown',
                usageCount: count
            }));
            // Calculate performance metrics
            const performanceMetrics = {
                averageProcessingTime: 50, // Mock value
                successRate: 98.5, // Mock value
                errorRate: 1.5 // Mock value
            };
            return {
                totalTemplates,
                activeTemplates,
                inactiveTemplates: totalTemplates - activeTemplates,
                usageStats,
                mostUsedTemplates,
                performanceMetrics,
                categoryBreakdown: this.getCategoryBreakdown(),
                channelSupport: this.getChannelSupport()
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi lấy analytics template: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Get category breakdown
     */
    getCategoryBreakdown() {
        const breakdown = {};
        this.templates.forEach(template => {
            if (template.metadata.isActive) {
                breakdown[template.category] = (breakdown[template.category] || 0) + 1;
            }
        });
        return breakdown;
    }
    /**
     * Get channel support
     */
    getChannelSupport() {
        const support = {};
        this.templates.forEach(template => {
            if (template.metadata.isActive) {
                template.channels.forEach(channel => {
                    support[channel] = (support[channel] || 0) + 1;
                });
            }
        });
        return support;
    }
}
exports.VietnameseTemplateService = VietnameseTemplateService;
//# sourceMappingURL=VietnameseTemplateService.js.map