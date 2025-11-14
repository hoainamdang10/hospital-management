/**
 * NotificationTemplate - Domain Value Object
 * Represents notification templates with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
export type TemplateType = 'APPOINTMENT_REMINDER' | 'APPOINTMENT_CONFIRMATION' | 'APPOINTMENT_CANCELLED' | 'APPOINTMENT_CANCELLATION' | 'TEST_RESULT_READY' | 'TEST_RESULTS_READY' | 'FOLLOW_UP_REQUIRED' | 'MEDICATION_REMINDER' | 'EMERGENCY_ALERT' | 'BILLING_INVOICE' | 'INVOICE_GENERATED' | 'PAYMENT_CONFIRMATION' | 'PAYMENT_REMINDER' | 'WELCOME_MESSAGE' | 'USER_WELCOME' | 'PASSWORD_RESET' | 'ACCOUNT_VERIFICATION' | 'ACCOUNT_ACTIVATED' | 'ROLE_CHANGED' | 'STAFF_INVITATION' | 'PATIENT_REGISTERED' | 'PATIENT_WELCOME' | 'PATIENT_UPDATED' | 'PATIENT_DEACTIVATED' | 'CONSENT_GRANTED' | 'SYSTEM_MAINTENANCE';
export type TemplatePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export interface TemplateContent {
    subject?: string;
    body: string;
    footer?: string;
    attachments?: string[];
}
export interface TemplateMetadata {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    approvedBy?: string;
    approvalDate?: Date;
    isActive: boolean;
    tags: string[];
}
export interface PlaceholderDefinition {
    key: string;
    description: string;
    required: boolean;
    type: 'string' | 'number' | 'date' | 'boolean';
    format?: string;
    validation?: RegExp;
}
export declare class NotificationTemplate {
    private readonly templateId;
    private readonly templateType;
    private readonly name;
    private readonly description;
    private readonly language;
    private readonly priority;
    private readonly content;
    private readonly placeholders;
    private readonly metadata;
    private readonly channelSpecific;
    private constructor();
    /**
     * Create NotificationTemplate with validation
     */
    static create(data: {
        templateId: string;
        templateType: TemplateType;
        name: string;
        description: string;
        language: 'vi' | 'en';
        priority: TemplatePriority;
        content: TemplateContent;
        placeholders: PlaceholderDefinition[];
        createdBy: string;
        tags?: string[];
        channelSpecific?: Map<string, TemplateContent>;
    }): NotificationTemplate;
    /**
     * Validate placeholders in content
     */
    private static validatePlaceholders;
    /**
     * Create Vietnamese appointment reminder template
     */
    static createAppointmentReminder(): NotificationTemplate;
    /**
     * Create Vietnamese test result notification template
     */
    static createTestResultReady(): NotificationTemplate;
    /**
     * Apply placeholders to generate final content
     */
    applyPlaceholders(values: Record<string, any>, channelType?: string): TemplateContent;
    /**
     * Replace placeholders in text
     */
    private replacePlaceholders;
    /**
     * Format value according to placeholder definition
     */
    private formatValue;
    /**
     * Format date according to Vietnamese standards
     */
    private formatDate;
    /**
     * Format number according to Vietnamese standards
     */
    private formatNumber;
    getTemplateId(): string;
    getTemplateType(): TemplateType;
    getName(): string;
    getDescription(): string;
    getLanguage(): 'vi' | 'en';
    getPriority(): TemplatePriority;
    getContent(): TemplateContent;
    getPlaceholders(): PlaceholderDefinition[];
    getMetadata(): TemplateMetadata;
    /**
     * Check if template is active
     */
    isActive(): boolean;
    /**
     * Check if template is approved
     */
    isApproved(): boolean;
    /**
     * Get content for specific channel
     */
    getContentForChannel(channelType: string): TemplateContent;
    /**
     * Check if template supports specific channel
     */
    supportsChannel(channelType: string): boolean;
    /**
     * Equality comparison
     */
    equals(other: NotificationTemplate): boolean;
    /**
     * String representation
     */
    toString(): string;
    /**
     * JSON serialization
     */
    toJSON(): object;
}
//# sourceMappingURL=NotificationTemplate.d.ts.map