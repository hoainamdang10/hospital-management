/**
 * NotificationContent - Domain Value Object
 * Represents final notification content after template processing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
export type ContentType = 'TEXT' | 'HTML' | 'MARKDOWN' | 'JSON';
export interface ContentMetadata {
    characterCount: number;
    wordCount: number;
    hasVietnameseText: boolean;
    hasHtml: boolean;
    hasLinks: boolean;
    hasAttachments: boolean;
    estimatedReadTime: number;
    contentHash: string;
}
export interface AttachmentInfo {
    filename: string;
    mimeType: string;
    size: number;
    url?: string;
    isInline: boolean;
    description?: string;
}
export declare class NotificationContent {
    private readonly subject;
    private readonly body;
    private readonly footer;
    private readonly contentType;
    private readonly language;
    private readonly attachments;
    private readonly metadata;
    private readonly createdAt;
    private constructor();
    /**
     * Create NotificationContent with validation
     */
    static create(data: {
        subject?: string;
        body: string;
        footer?: string;
        contentType?: ContentType;
        language?: 'vi' | 'en';
        attachments?: AttachmentInfo[];
    }): NotificationContent;
    /**
     * Validate content based on type
     */
    private static validateContent;
    /**
     * Validate HTML content
     */
    private static isValidHtml;
    /**
     * Generate content metadata
     */
    private static generateMetadata;
    /**
     * Generate simple hash for content
     */
    private static generateHash;
    /**
     * Get subject
     */
    getSubject(): string | undefined;
    /**
     * Get body
     */
    getBody(): string;
    /**
     * Get footer
     */
    getFooter(): string | undefined;
    /**
     * Get full content (subject + body + footer)
     */
    getFullContent(): string;
    /**
     * Get content type
     */
    getContentType(): ContentType;
    /**
     * Get language
     */
    getLanguage(): 'vi' | 'en';
    /**
     * Get attachments
     */
    getAttachments(): AttachmentInfo[];
    /**
     * Get metadata
     */
    getMetadata(): ContentMetadata;
    /**
     * Get creation date
     */
    getCreatedAt(): Date;
    /**
     * Check if content is in Vietnamese
     */
    isVietnamese(): boolean;
    /**
     * Check if content has HTML
     */
    hasHtml(): boolean;
    /**
     * Check if content has links
     */
    hasLinks(): boolean;
    /**
     * Check if content has attachments
     */
    hasAttachments(): boolean;
    /**
     * Get character count
     */
    getCharacterCount(): number;
    /**
     * Get word count
     */
    getWordCount(): number;
    /**
     * Get estimated read time in seconds
     */
    getEstimatedReadTime(): number;
    /**
     * Get content hash for deduplication
     */
    getContentHash(): string;
    /**
     * Truncate content for specific channel
     */
    truncateForChannel(maxLength: number, preserveWords?: boolean): NotificationContent;
    /**
     * Convert to plain text (remove HTML tags)
     */
    toPlainText(): NotificationContent;
    /**
     * Add attachment
     */
    withAttachment(attachment: AttachmentInfo): NotificationContent;
    /**
     * Remove attachment
     */
    withoutAttachment(filename: string): NotificationContent;
    /**
     * Validate content for specific channel
     */
    validateForChannel(channelType: string, maxLength?: number): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get preview text (first few words)
     */
    getPreview(maxWords?: number): string;
    /**
     * Equality comparison
     */
    equals(other: NotificationContent): boolean;
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
    static fromJSON(json: any): NotificationContent;
}
//# sourceMappingURL=NotificationContent.d.ts.map