"use strict";
/**
 * NotificationTemplate - Domain Value Object
 * Represents notification templates with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplate = void 0;
class NotificationTemplate {
    constructor(templateId, templateType, name, description, language, priority, content, placeholders, metadata, channelSpecific = new Map()) {
        this.templateId = templateId;
        this.templateType = templateType;
        this.name = name;
        this.description = description;
        this.language = language;
        this.priority = priority;
        this.content = content;
        this.placeholders = placeholders;
        this.metadata = metadata;
        this.channelSpecific = channelSpecific;
    }
    /**
     * Create NotificationTemplate with validation
     */
    static create(data) {
        // Validate required fields
        if (!data.templateId?.trim()) {
            throw new Error('Mã template không được để trống');
        }
        if (!data.name?.trim()) {
            throw new Error('Tên template không được để trống');
        }
        if (!data.content?.body?.trim()) {
            throw new Error('Nội dung template không được để trống');
        }
        // Validate placeholders in content
        NotificationTemplate.validatePlaceholders(data.content, data.placeholders);
        // Create metadata
        const metadata = {
            version: '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: data.createdBy,
            isActive: true,
            tags: data.tags || []
        };
        return new NotificationTemplate(data.templateId, data.templateType, data.name, data.description, data.language, data.priority, data.content, data.placeholders, metadata, data.channelSpecific || new Map());
    }
    /**
     * Validate placeholders in content
     */
    static validatePlaceholders(content, placeholders) {
        const placeholderKeys = placeholders.map(p => p.key);
        const contentText = `${content.subject || ''} ${content.body} ${content.footer || ''}`;
        // Find all placeholders in content
        const foundPlaceholders = contentText.match(/\{\{([^}]+)\}\}/g) || [];
        const foundKeys = foundPlaceholders.map(p => p.replace(/[{}]/g, ''));
        // Check for undefined placeholders
        const undefinedPlaceholders = foundKeys.filter(key => !placeholderKeys.includes(key));
        if (undefinedPlaceholders.length > 0) {
            throw new Error(`Các placeholder không được định nghĩa: ${undefinedPlaceholders.join(', ')}`);
        }
        // Check for required placeholders not used
        const requiredPlaceholders = placeholders.filter(p => p.required).map(p => p.key);
        const missingRequired = requiredPlaceholders.filter(key => !foundKeys.includes(key));
        if (missingRequired.length > 0) {
            throw new Error(`Các placeholder bắt buộc chưa được sử dụng: ${missingRequired.join(', ')}`);
        }
    }
    /**
     * Create Vietnamese appointment reminder template
     */
    static createAppointmentReminder() {
        const placeholders = [
            { key: 'patientName', description: 'Tên bệnh nhân', required: true, type: 'string' },
            { key: 'doctorName', description: 'Tên bác sĩ', required: true, type: 'string' },
            { key: 'appointmentDate', description: 'Ngày hẹn', required: true, type: 'date', format: 'dd/MM/yyyy' },
            { key: 'appointmentTime', description: 'Giờ hẹn', required: true, type: 'string' },
            { key: 'department', description: 'Khoa', required: true, type: 'string' },
            { key: 'hospitalName', description: 'Tên bệnh viện', required: true, type: 'string' },
            { key: 'hospitalAddress', description: 'Địa chỉ bệnh viện', required: false, type: 'string' }
        ];
        const content = {
            subject: 'Nhắc nhở lịch hẹn khám - {{patientName}}',
            body: `Kính chào {{patientName}},

Chúng tôi xin nhắc nhở về lịch hẹn khám của quý khách:

📅 Ngày: {{appointmentDate}}
🕐 Giờ: {{appointmentTime}}
👨‍⚕️ Bác sĩ: {{doctorName}}
🏥 Khoa: {{department}}

Địa điểm: {{hospitalName}}
{{hospitalAddress}}

Vui lòng có mặt trước giờ hẹn 15 phút để làm thủ tục.

Nếu cần thay đổi lịch hẹn, vui lòng liên hệ với chúng tôi sớm nhất có thể.

Trân trọng,
{{hospitalName}}`,
            footer: 'Tin nhắn này được gửi tự động. Vui lòng không trả lời.'
        };
        // Channel-specific content
        const channelSpecific = new Map();
        // SMS version (shorter)
        channelSpecific.set('SMS', {
            body: `Nhắc nhở: Lịch hẹn khám ngày {{appointmentDate}} lúc {{appointmentTime}} với BS {{doctorName}}, Khoa {{department}} tại {{hospitalName}}. Vui lòng có mặt trước 15 phút.`
        });
        // Push notification version
        channelSpecific.set('PUSH', {
            subject: 'Lịch hẹn khám sắp tới',
            body: `{{patientName}}, bạn có lịch hẹn với BS {{doctorName}} vào {{appointmentDate}} lúc {{appointmentTime}}.`
        });
        return NotificationTemplate.create({
            templateId: 'APPT_REMINDER_VI',
            templateType: 'APPOINTMENT_REMINDER',
            name: 'Nhắc nhở lịch hẹn khám',
            description: 'Template nhắc nhở bệnh nhân về lịch hẹn khám sắp tới',
            language: 'vi',
            priority: 'NORMAL',
            content,
            placeholders,
            createdBy: 'system',
            tags: ['appointment', 'reminder', 'vietnamese'],
            channelSpecific
        });
    }
    /**
     * Create Vietnamese test result notification template
     */
    static createTestResultReady() {
        const placeholders = [
            { key: 'patientName', description: 'Tên bệnh nhân', required: true, type: 'string' },
            { key: 'testName', description: 'Tên xét nghiệm', required: true, type: 'string' },
            { key: 'testDate', description: 'Ngày xét nghiệm', required: true, type: 'date', format: 'dd/MM/yyyy' },
            { key: 'doctorName', description: 'Tên bác sĩ', required: true, type: 'string' },
            { key: 'hospitalName', description: 'Tên bệnh viện', required: true, type: 'string' }
        ];
        const content = {
            subject: 'Kết quả xét nghiệm đã sẵn sàng - {{patientName}}',
            body: `Kính chào {{patientName}},

Kết quả xét nghiệm của quý khách đã sẵn sàng:

🔬 Xét nghiệm: {{testName}}
📅 Ngày thực hiện: {{testDate}}
👨‍⚕️ Bác sĩ chỉ định: {{doctorName}}

Quý khách có thể:
- Xem kết quả trên ứng dụng
- Đến trực tiếp bệnh viện để nhận kết quả
- Đặt lịch hẹn tư vấn với bác sĩ

Vui lòng liên hệ với chúng tôi nếu có bất kỳ thắc mắc nào.

Trân trọng,
{{hospitalName}}`,
            footer: 'Thông tin y tế là bảo mật. Vui lòng không chia sẻ với người khác.'
        };
        return NotificationTemplate.create({
            templateId: 'TEST_RESULT_VI',
            templateType: 'TEST_RESULT_READY',
            name: 'Thông báo kết quả xét nghiệm',
            description: 'Template thông báo kết quả xét nghiệm đã sẵn sàng',
            language: 'vi',
            priority: 'HIGH',
            content,
            placeholders,
            createdBy: 'system',
            tags: ['test-result', 'medical', 'vietnamese']
        });
    }
    /**
     * Apply placeholders to generate final content
     */
    applyPlaceholders(values, channelType) {
        // Validate required placeholders
        const requiredPlaceholders = this.placeholders.filter(p => p.required);
        const missingValues = requiredPlaceholders.filter(p => !(p.key in values));
        if (missingValues.length > 0) {
            throw new Error(`Thiếu giá trị cho các placeholder bắt buộc: ${missingValues.map(p => p.key).join(', ')}`);
        }
        // Get content for specific channel or default
        const sourceContent = channelType && this.channelSpecific.has(channelType)
            ? this.channelSpecific.get(channelType)
            : this.content;
        // Apply placeholders
        const processedContent = {
            subject: sourceContent.subject ? this.replacePlaceholders(sourceContent.subject, values) : undefined,
            body: this.replacePlaceholders(sourceContent.body, values),
            footer: sourceContent.footer ? this.replacePlaceholders(sourceContent.footer, values) : undefined,
            attachments: sourceContent.attachments
        };
        return processedContent;
    }
    /**
     * Replace placeholders in text
     */
    replacePlaceholders(text, values) {
        let result = text;
        for (const placeholder of this.placeholders) {
            const value = values[placeholder.key];
            if (value !== undefined) {
                const formattedValue = this.formatValue(value, placeholder);
                const regex = new RegExp(`\\{\\{${placeholder.key}\\}\\}`, 'g');
                result = result.replace(regex, formattedValue);
            }
        }
        return result;
    }
    /**
     * Format value according to placeholder definition
     */
    formatValue(value, placeholder) {
        switch (placeholder.type) {
            case 'date':
                if (value instanceof Date) {
                    return this.formatDate(value, placeholder.format);
                }
                return String(value);
            case 'number':
                if (typeof value === 'number') {
                    return this.formatNumber(value, placeholder.format);
                }
                return String(value);
            default:
                return String(value);
        }
    }
    /**
     * Format date according to Vietnamese standards
     */
    formatDate(date, format) {
        const options = {
            timeZone: 'Asia/Ho_Chi_Minh'
        };
        switch (format) {
            case 'dd/MM/yyyy':
                return date.toLocaleDateString('vi-VN', { ...options, day: '2-digit', month: '2-digit', year: 'numeric' });
            case 'dd/MM/yyyy HH:mm':
                return date.toLocaleString('vi-VN', { ...options, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            default:
                return date.toLocaleDateString('vi-VN', options);
        }
    }
    /**
     * Format number according to Vietnamese standards
     */
    formatNumber(number, format) {
        if (format === 'currency') {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(number);
        }
        return new Intl.NumberFormat('vi-VN').format(number);
    }
    // Getters
    getTemplateId() { return this.templateId; }
    getTemplateType() { return this.templateType; }
    getName() { return this.name; }
    getDescription() { return this.description; }
    getLanguage() { return this.language; }
    getPriority() { return this.priority; }
    getContent() { return { ...this.content }; }
    getPlaceholders() { return [...this.placeholders]; }
    getMetadata() { return { ...this.metadata }; }
    /**
     * Check if template is active
     */
    isActive() {
        return this.metadata.isActive;
    }
    /**
     * Check if template is approved
     */
    isApproved() {
        return !!this.metadata.approvedBy && !!this.metadata.approvalDate;
    }
    /**
     * Get content for specific channel
     */
    getContentForChannel(channelType) {
        return this.channelSpecific.get(channelType) || this.content;
    }
    /**
     * Check if template supports specific channel
     */
    supportsChannel(channelType) {
        return this.channelSpecific.has(channelType) || true; // Default content works for all channels
    }
    /**
     * Equality comparison
     */
    equals(other) {
        if (!other)
            return false;
        return this.templateId === other.templateId && this.metadata.version === other.metadata.version;
    }
    /**
     * String representation
     */
    toString() {
        return `${this.name} (${this.templateId})`;
    }
    /**
     * JSON serialization
     */
    toJSON() {
        return {
            templateId: this.templateId,
            templateType: this.templateType,
            name: this.name,
            description: this.description,
            language: this.language,
            priority: this.priority,
            content: this.content,
            placeholders: this.placeholders,
            metadata: this.metadata,
            channelSpecific: Object.fromEntries(this.channelSpecific)
        };
    }
}
exports.NotificationTemplate = NotificationTemplate;
//# sourceMappingURL=NotificationTemplate.js.map