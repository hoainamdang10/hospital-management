"use strict";
/**
 * RecipientInfo - Domain Value Object
 * Represents notification recipient information with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipientInfo = void 0;
class RecipientInfo {
    constructor(recipientId, recipientType, fullName, contactInfo, preferences, healthcareContext, isActive = true) {
        this.recipientId = recipientId;
        this.recipientType = recipientType;
        this.fullName = fullName;
        this.contactInfo = contactInfo;
        this.preferences = preferences;
        this.healthcareContext = healthcareContext;
        this.isActive = isActive;
    }
    /**
     * Create RecipientInfo with validation
     */
    static create(data) {
        // Validate required fields
        if (!data.recipientId?.trim()) {
            throw new Error('Mã người nhận không được để trống');
        }
        if (!data.fullName?.trim()) {
            throw new Error('Tên người nhận không được để trống');
        }
        // Validate Vietnamese name format
        if (!RecipientInfo.isValidVietnameseName(data.fullName)) {
            throw new Error('Tên người nhận không đúng định dạng tiếng Việt');
        }
        // Validate contact information
        RecipientInfo.validateContactInfo(data.contactInfo);
        // Set default preferences
        const defaultPreferences = {
            preferredChannels: ['PUSH', 'SMS', 'EMAIL'],
            timezone: 'Asia/Ho_Chi_Minh',
            language: 'vi',
            quietHours: {
                start: '22:00',
                end: '07:00'
            },
            optOut: {
                marketing: false,
                reminders: false,
                emergency: false // Cannot opt out
            }
        };
        const preferences = { ...defaultPreferences, ...data.preferences };
        // Set default healthcare context
        const defaultHealthcareContext = {
            emergencyContact: false,
            hipaaAuthorized: false
        };
        const healthcareContext = { ...defaultHealthcareContext, ...data.healthcareContext };
        return new RecipientInfo(data.recipientId, data.recipientType, data.fullName, data.contactInfo, preferences, healthcareContext, data.isActive ?? true);
    }
    /**
     * Validate Vietnamese name format
     */
    static isValidVietnameseName(name) {
        if (!name || name.trim().length < 2)
            return false;
        // Allow Vietnamese characters, spaces, and common punctuation
        const vietnameseNameRegex = /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s.'-]+$/;
        return vietnameseNameRegex.test(name.trim());
    }
    /**
     * Validate contact information
     */
    static validateContactInfo(contactInfo) {
        if (!contactInfo.email && !contactInfo.phoneNumber && !contactInfo.pushToken) {
            throw new Error('Phải có ít nhất một thông tin liên lạc (email, số điện thoại, hoặc push token)');
        }
        // Validate email format
        if (contactInfo.email && !RecipientInfo.isValidEmail(contactInfo.email)) {
            throw new Error('Địa chỉ email không đúng định dạng');
        }
        // Validate Vietnamese phone number
        if (contactInfo.phoneNumber && !RecipientInfo.isValidVietnamesePhoneNumber(contactInfo.phoneNumber)) {
            throw new Error('Số điện thoại không đúng định dạng Việt Nam');
        }
    }
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate Vietnamese phone number
     */
    static isValidVietnamesePhoneNumber(phoneNumber) {
        // Vietnamese phone number formats: 0xxxxxxxxx or +84xxxxxxxxx
        const phoneRegex = /^(\+84|0)[3-9]\d{8}$/;
        return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
    }
    /**
     * Get recipient ID
     */
    getRecipientId() {
        return this.recipientId;
    }
    /**
     * Get recipient type
     */
    getRecipientType() {
        return this.recipientType;
    }
    /**
     * Get full name
     */
    getFullName() {
        return this.fullName;
    }
    /**
     * Get contact information
     */
    getContactInfo() {
        return { ...this.contactInfo };
    }
    /**
     * Get preferences
     */
    getPreferences() {
        return { ...this.preferences };
    }
    /**
     * Get healthcare context
     */
    getHealthcareContext() {
        return { ...this.healthcareContext };
    }
    /**
     * Check if recipient is active
     */
    isActiveRecipient() {
        return this.isActive;
    }
    /**
     * Check if recipient is HIPAA authorized
     */
    isHipaaAuthorized() {
        return this.healthcareContext.hipaaAuthorized;
    }
    /**
     * Check if recipient is emergency contact
     */
    isEmergencyContact() {
        return this.healthcareContext.emergencyContact;
    }
    /**
     * Get preferred language
     */
    getPreferredLanguage() {
        return this.preferences.language;
    }
    /**
     * Get preferred channels in order
     */
    getPreferredChannels() {
        return [...this.preferences.preferredChannels];
    }
    /**
     * Check if recipient has opted out of specific notification type
     */
    hasOptedOut(notificationType) {
        return this.preferences.optOut[notificationType];
    }
    /**
     * Check if current time is within quiet hours
     */
    isInQuietHours(currentTime) {
        if (!this.preferences.quietHours)
            return false;
        const now = currentTime || new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const [startHour, startMinute] = this.preferences.quietHours.start.split(':').map(Number);
        const [endHour, endMinute] = this.preferences.quietHours.end.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        // Handle overnight quiet hours (e.g., 22:00 to 07:00)
        if (startTimeMinutes > endTimeMinutes) {
            return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
        }
        return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
    }
    /**
     * Get contact info for specific channel
     */
    getContactForChannel(channelType) {
        switch (channelType.toUpperCase()) {
            case 'EMAIL':
                return this.contactInfo.email;
            case 'SMS':
                return this.contactInfo.phoneNumber;
            case 'PUSH':
                return this.contactInfo.pushToken;
            default:
                return undefined;
        }
    }
    /**
     * Check if recipient can receive notifications on specific channel
     */
    canReceiveOnChannel(channelType) {
        const contact = this.getContactForChannel(channelType);
        return !!contact && this.isActive;
    }
    /**
     * Get Vietnamese recipient type name
     */
    getVietnameseTypeName() {
        const typeNames = {
            PATIENT: 'Bệnh nhân',
            DOCTOR: 'Bác sĩ',
            NURSE: 'Điều dưỡng',
            ADMIN: 'Quản trị viên',
            FAMILY: 'Thân nhân',
            EXTERNAL: 'Bên ngoài'
        };
        return typeNames[this.recipientType];
    }
    /**
     * Get display name with type
     */
    getDisplayName() {
        return `${this.fullName} (${this.getVietnameseTypeName()})`;
    }
    /**
     * Create copy with updated preferences
     */
    withPreferences(preferences) {
        return new RecipientInfo(this.recipientId, this.recipientType, this.fullName, this.contactInfo, { ...this.preferences, ...preferences }, this.healthcareContext, this.isActive);
    }
    /**
     * Create copy with updated contact info
     */
    withContactInfo(contactInfo) {
        return new RecipientInfo(this.recipientId, this.recipientType, this.fullName, { ...this.contactInfo, ...contactInfo }, this.preferences, this.healthcareContext, this.isActive);
    }
    /**
     * Deactivate recipient
     */
    deactivate() {
        return new RecipientInfo(this.recipientId, this.recipientType, this.fullName, this.contactInfo, this.preferences, this.healthcareContext, false);
    }
    /**
     * Equality comparison
     */
    equals(other) {
        if (!other)
            return false;
        return this.recipientId === other.recipientId;
    }
    /**
     * String representation
     */
    toString() {
        return `${this.fullName} (${this.recipientId})`;
    }
    /**
     * JSON serialization
     */
    toJSON() {
        return {
            recipientId: this.recipientId,
            recipientType: this.recipientType,
            fullName: this.fullName,
            contactInfo: this.contactInfo,
            preferences: this.preferences,
            healthcareContext: this.healthcareContext,
            isActive: this.isActive
        };
    }
    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new RecipientInfo(json.recipientId, json.recipientType, json.fullName, json.contactInfo, json.preferences, json.healthcareContext, json.isActive);
    }
}
exports.RecipientInfo = RecipientInfo;
//# sourceMappingURL=RecipientInfo.js.map