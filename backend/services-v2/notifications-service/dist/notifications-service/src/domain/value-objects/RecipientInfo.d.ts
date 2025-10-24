/**
 * RecipientInfo - Domain Value Object
 * Represents notification recipient information with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
export type RecipientType = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'FAMILY' | 'EXTERNAL';
export interface ContactInfo {
    email?: string;
    phoneNumber?: string;
    pushToken?: string;
    address?: string;
}
export interface PreferenceSettings {
    preferredChannels: string[];
    timezone: string;
    language: 'vi' | 'en';
    quietHours?: {
        start: string;
        end: string;
    };
    optOut: {
        marketing: boolean;
        reminders: boolean;
        emergency: boolean;
    };
}
export interface HealthcareContext {
    patientId?: string;
    doctorId?: string;
    departmentId?: string;
    relationshipToPatient?: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'GUARDIAN' | 'OTHER';
    emergencyContact: boolean;
    hipaaAuthorized: boolean;
}
export declare class RecipientInfo {
    private readonly recipientId;
    private readonly recipientType;
    private readonly fullName;
    private readonly contactInfo;
    private readonly preferences;
    private readonly healthcareContext;
    private readonly isActive;
    private constructor();
    /**
     * Create RecipientInfo with validation
     */
    static create(data: {
        recipientId: string;
        recipientType: RecipientType;
        fullName: string;
        contactInfo: ContactInfo;
        preferences?: Partial<PreferenceSettings>;
        healthcareContext?: Partial<HealthcareContext>;
        isActive?: boolean;
    }): RecipientInfo;
    /**
     * Validate Vietnamese name format
     */
    private static isValidVietnameseName;
    /**
     * Validate contact information
     */
    private static validateContactInfo;
    /**
     * Validate email format
     */
    private static isValidEmail;
    /**
     * Validate Vietnamese phone number
     */
    private static isValidVietnamesePhoneNumber;
    /**
     * Get recipient ID
     */
    getRecipientId(): string;
    /**
     * Get recipient type
     */
    getRecipientType(): RecipientType;
    /**
     * Get full name
     */
    getFullName(): string;
    /**
     * Get contact information
     */
    getContactInfo(): ContactInfo;
    /**
     * Get preferences
     */
    getPreferences(): PreferenceSettings;
    /**
     * Get healthcare context
     */
    getHealthcareContext(): HealthcareContext;
    /**
     * Check if recipient is active
     */
    isActiveRecipient(): boolean;
    /**
     * Check if recipient is HIPAA authorized
     */
    isHipaaAuthorized(): boolean;
    /**
     * Check if recipient is emergency contact
     */
    isEmergencyContact(): boolean;
    /**
     * Get preferred language
     */
    getPreferredLanguage(): 'vi' | 'en';
    /**
     * Get preferred channels in order
     */
    getPreferredChannels(): string[];
    /**
     * Check if recipient has opted out of specific notification type
     */
    hasOptedOut(notificationType: 'marketing' | 'reminders' | 'emergency'): boolean;
    /**
     * Check if current time is within quiet hours
     */
    isInQuietHours(currentTime?: Date): boolean;
    /**
     * Get contact info for specific channel
     */
    getContactForChannel(channelType: string): string | undefined;
    /**
     * Check if recipient can receive notifications on specific channel
     */
    canReceiveOnChannel(channelType: string): boolean;
    /**
     * Get Vietnamese recipient type name
     */
    getVietnameseTypeName(): string;
    /**
     * Get display name with type
     */
    getDisplayName(): string;
    /**
     * Create copy with updated preferences
     */
    withPreferences(preferences: Partial<PreferenceSettings>): RecipientInfo;
    /**
     * Create copy with updated contact info
     */
    withContactInfo(contactInfo: Partial<ContactInfo>): RecipientInfo;
    /**
     * Deactivate recipient
     */
    deactivate(): RecipientInfo;
    /**
     * Equality comparison
     */
    equals(other: RecipientInfo): boolean;
    /**
     * String representation
     */
    toString(): string;
    /**
     * JSON serialization
     */
    toJSON(): object;
    /**
     * Create from JSON
     */
    static fromJSON(json: any): RecipientInfo;
}
//# sourceMappingURL=RecipientInfo.d.ts.map