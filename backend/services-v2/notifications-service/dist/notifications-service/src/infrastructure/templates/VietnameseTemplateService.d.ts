/**
 * VietnameseTemplateService - Infrastructure Template Service
 * Vietnamese healthcare notification template service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
import { ITemplateService, TemplateRequest, TemplateResult, TemplateAnalytics } from '../../domain/services/ITemplateService';
import { NotificationTemplate } from '../../domain/value-objects/NotificationTemplate';
export declare class VietnameseTemplateService implements ITemplateService {
    private readonly templates;
    private readonly templateUsage;
    constructor();
    /**
     * Initialize default Vietnamese healthcare templates
     */
    private initializeDefaultTemplates;
    /**
     * Apply template to create notification content
     */
    applyTemplate(request: TemplateRequest): Promise<TemplateResult>;
    /**
     * Process template with data
     */
    private processTemplate;
    /**
     * Replace placeholders in text
     */
    private replacePlaceholders;
    /**
     * Format value for display
     */
    private formatValue;
    /**
     * Process conditional blocks
     */
    private processConditionals;
    /**
     * Process loop blocks
     */
    private processLoops;
    /**
     * Truncate content for SMS
     */
    private truncateForSMS;
    /**
     * Truncate content for push notification
     */
    private truncateForPush;
    /**
     * Get template by ID
     */
    getTemplate(templateId: string): Promise<NotificationTemplate | null>;
    /**
     * Get templates by type
     */
    getTemplatesByType(templateType: string): Promise<NotificationTemplate[]>;
    /**
     * Get template analytics
     */
    getTemplateAnalytics(dateRange?: {
        start: Date;
        end: Date;
    }): Promise<TemplateAnalytics>;
    /**
     * Get category breakdown
     */
    private getCategoryBreakdown;
    /**
     * Get channel support
     */
    private getChannelSupport;
}
//# sourceMappingURL=VietnameseTemplateService.d.ts.map