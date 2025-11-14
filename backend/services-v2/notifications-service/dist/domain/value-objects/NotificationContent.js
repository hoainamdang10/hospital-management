"use strict";
/**
 * NotificationContent - Domain Value Object
 * Represents final notification content after template processing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationContent = void 0;
class NotificationContent {
    constructor(subject, body, footer, contentType, language, attachments, metadata, createdAt = new Date()) {
        this.subject = subject;
        this.body = body;
        this.footer = footer;
        this.contentType = contentType;
        this.language = language;
        this.attachments = attachments;
        this.metadata = metadata;
        this.createdAt = createdAt;
    }
    /**
     * Create NotificationContent with validation
     */
    static create(data) {
        // Validate required fields
        if (!data.body?.trim()) {
            throw new Error('Nội dung thông báo không được để trống');
        }
        const contentType = data.contentType || 'TEXT';
        const language = data.language || 'vi';
        const attachments = data.attachments || [];
        // Validate content based on type
        NotificationContent.validateContent(data.body, contentType);
        // Generate metadata
        const metadata = NotificationContent.generateMetadata(data.subject, data.body, data.footer, attachments);
        return new NotificationContent(data.subject, data.body, data.footer, contentType, language, attachments, metadata);
    }
    /**
     * Validate content based on type
     */
    static validateContent(body, contentType) {
        switch (contentType) {
            case 'HTML':
                if (!NotificationContent.isValidHtml(body)) {
                    throw new Error('Nội dung HTML không hợp lệ');
                }
                break;
            case 'JSON':
                try {
                    JSON.parse(body);
                }
                catch {
                    throw new Error('Nội dung JSON không hợp lệ');
                }
                break;
            case 'MARKDOWN':
                // Basic markdown validation
                if (body.includes('<script>') || body.includes('<iframe>')) {
                    throw new Error('Nội dung Markdown chứa thẻ không được phép');
                }
                break;
        }
    }
    /**
     * Validate HTML content
     */
    static isValidHtml(html) {
        try {
            // Basic HTML validation - check for balanced tags
            const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
            const tags = [];
            let match;
            while ((match = tagRegex.exec(html)) !== null) {
                const tag = match[1].toLowerCase();
                const isClosing = match[0].startsWith('</');
                if (isClosing) {
                    if (tags.length === 0 || tags.pop() !== tag) {
                        return false; // Unmatched closing tag
                    }
                }
                else if (!match[0].endsWith('/>')) {
                    tags.push(tag);
                }
            }
            return tags.length === 0; // All tags should be closed
        }
        catch {
            return false;
        }
    }
    /**
     * Generate content metadata
     */
    static generateMetadata(subject, body, footer, attachments) {
        const fullText = `${subject || ''} ${body} ${footer || ''}`;
        // Character and word count
        const characterCount = fullText.length;
        const wordCount = fullText.trim().split(/\s+/).length;
        // Vietnamese text detection
        const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        const hasVietnameseText = vietnameseRegex.test(fullText);
        // HTML detection
        const hasHtml = /<[^>]*>/g.test(fullText);
        // Link detection
        const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
        const hasLinks = linkRegex.test(fullText);
        // Attachments
        const hasAttachments = attachments.length > 0;
        // Estimated read time (average 200 words per minute for Vietnamese)
        const estimatedReadTime = Math.ceil(wordCount / (hasVietnameseText ? 180 : 200)) * 60;
        // Content hash for deduplication
        const contentHash = NotificationContent.generateHash(fullText);
        return {
            characterCount,
            wordCount,
            hasVietnameseText,
            hasHtml,
            hasLinks,
            hasAttachments,
            estimatedReadTime,
            contentHash
        };
    }
    /**
     * Generate simple hash for content
     */
    static generateHash(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
    /**
     * Get subject
     */
    getSubject() {
        return this.subject;
    }
    /**
     * Get body
     */
    getBody() {
        return this.body;
    }
    /**
     * Get footer
     */
    getFooter() {
        return this.footer;
    }
    /**
     * Get full content (subject + body + footer)
     */
    getFullContent() {
        const parts = [this.subject, this.body, this.footer].filter(Boolean);
        return parts.join('\n\n');
    }
    /**
     * Get content type
     */
    getContentType() {
        return this.contentType;
    }
    /**
     * Get language
     */
    getLanguage() {
        return this.language;
    }
    /**
     * Get attachments
     */
    getAttachments() {
        return [...this.attachments];
    }
    /**
     * Get metadata
     */
    getMetadata() {
        return { ...this.metadata };
    }
    /**
     * Get creation date
     */
    getCreatedAt() {
        return new Date(this.createdAt);
    }
    /**
     * Check if content is in Vietnamese
     */
    isVietnamese() {
        return this.language === 'vi' || this.metadata.hasVietnameseText;
    }
    /**
     * Check if content has HTML
     */
    hasHtml() {
        return this.metadata.hasHtml;
    }
    /**
     * Check if content has links
     */
    hasLinks() {
        return this.metadata.hasLinks;
    }
    /**
     * Check if content has attachments
     */
    hasAttachments() {
        return this.metadata.hasAttachments;
    }
    /**
     * Get character count
     */
    getCharacterCount() {
        return this.metadata.characterCount;
    }
    /**
     * Get word count
     */
    getWordCount() {
        return this.metadata.wordCount;
    }
    /**
     * Get estimated read time in seconds
     */
    getEstimatedReadTime() {
        return this.metadata.estimatedReadTime;
    }
    /**
     * Get content hash for deduplication
     */
    getContentHash() {
        return this.metadata.contentHash;
    }
    /**
     * Truncate content for specific channel
     */
    truncateForChannel(maxLength, preserveWords = true) {
        if (this.body.length <= maxLength) {
            return this;
        }
        let truncatedBody = this.body.substring(0, maxLength);
        if (preserveWords) {
            // Find last complete word
            const lastSpaceIndex = truncatedBody.lastIndexOf(' ');
            if (lastSpaceIndex > maxLength * 0.8) { // Only if we don't lose too much content
                truncatedBody = truncatedBody.substring(0, lastSpaceIndex);
            }
        }
        // Add ellipsis
        truncatedBody += '...';
        return NotificationContent.create({
            subject: this.subject,
            body: truncatedBody,
            footer: this.footer,
            contentType: this.contentType,
            language: this.language,
            attachments: this.attachments
        });
    }
    /**
     * Convert to plain text (remove HTML tags)
     */
    toPlainText() {
        if (this.contentType === 'TEXT') {
            return this;
        }
        const plainBody = this.body.replace(/<[^>]*>/g, '').trim();
        const plainSubject = this.subject?.replace(/<[^>]*>/g, '').trim();
        const plainFooter = this.footer?.replace(/<[^>]*>/g, '').trim();
        return NotificationContent.create({
            subject: plainSubject,
            body: plainBody,
            footer: plainFooter,
            contentType: 'TEXT',
            language: this.language,
            attachments: this.attachments
        });
    }
    /**
     * Add attachment
     */
    withAttachment(attachment) {
        const newAttachments = [...this.attachments, attachment];
        return NotificationContent.create({
            subject: this.subject,
            body: this.body,
            footer: this.footer,
            contentType: this.contentType,
            language: this.language,
            attachments: newAttachments
        });
    }
    /**
     * Remove attachment
     */
    withoutAttachment(filename) {
        const newAttachments = this.attachments.filter(a => a.filename !== filename);
        return NotificationContent.create({
            subject: this.subject,
            body: this.body,
            footer: this.footer,
            contentType: this.contentType,
            language: this.language,
            attachments: newAttachments
        });
    }
    /**
     * Validate content for specific channel
     */
    validateForChannel(channelType, maxLength) {
        const errors = [];
        // Check length constraints
        if (maxLength && this.body.length > maxLength) {
            errors.push(`Nội dung vượt quá giới hạn ${maxLength} ký tự cho kênh ${channelType}`);
        }
        // Channel-specific validations
        switch (channelType.toUpperCase()) {
            case 'SMS':
                if (this.hasHtml()) {
                    errors.push('SMS không hỗ trợ nội dung HTML');
                }
                if (this.hasAttachments()) {
                    errors.push('SMS không hỗ trợ đính kèm');
                }
                break;
            case 'PUSH':
                if (!this.subject) {
                    errors.push('Push notification cần có tiêu đề');
                }
                break;
            case 'EMAIL':
                // Email supports most content types
                break;
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Get preview text (first few words)
     */
    getPreview(maxWords = 10) {
        const words = this.body.trim().split(/\s+/);
        const preview = words.slice(0, maxWords).join(' ');
        return words.length > maxWords ? `${preview}...` : preview;
    }
    /**
     * Equality comparison
     */
    equals(other) {
        if (!other)
            return false;
        return this.metadata.contentHash === other.metadata.contentHash;
    }
    /**
     * String representation
     */
    toString() {
        return this.getPreview(15);
    }
    /**
     * JSON serialization
     */
    toJSON() {
        return {
            subject: this.subject,
            body: this.body,
            footer: this.footer,
            contentType: this.contentType,
            language: this.language,
            attachments: this.attachments,
            metadata: this.metadata,
            createdAt: this.createdAt
        };
    }
    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new NotificationContent(json.subject, json.body, json.footer, json.contentType, json.language, json.attachments, json.metadata, new Date(json.createdAt));
    }
}
exports.NotificationContent = NotificationContent;
//# sourceMappingURL=NotificationContent.js.map