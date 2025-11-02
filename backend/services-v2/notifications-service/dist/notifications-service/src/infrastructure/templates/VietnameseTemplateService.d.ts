/**
 * VietnameseTemplateService - Complete Template Service Implementation
 * Vietnamese healthcare notification template service with database integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
import { ITemplateService, TemplateType, TemplateSearchCriteria, TemplateValidationResult, TemplateUsageStatistics, TemplatePerformanceMetrics } from '../../domain/services/ITemplateService';
import { NotificationTemplate } from '../../domain/value-objects/NotificationTemplate';
import { NotificationContent } from '../../domain/value-objects/NotificationContent';
import { SupabaseTemplateRepository } from '../persistence/SupabaseTemplateRepository';
/**
 * Vietnamese Template Service
 * Manages templates with database integration and Vietnamese text processing
 */
export declare class VietnameseTemplateService implements ITemplateService {
    private readonly templateRepository;
    constructor(templateRepository: SupabaseTemplateRepository);
    /**
     * Get template by ID
     */
    getTemplate(templateId: string): Promise<NotificationTemplate | null>;
    /**
     * Get template by type and language (using database function)
     */
    getTemplateByType(templateType: TemplateType, language?: 'vi' | 'en'): Promise<NotificationTemplate | null>;
    /**
     * Get all templates matching criteria
     */
    getTemplates(criteria?: TemplateSearchCriteria): Promise<NotificationTemplate[]>;
    /**
     * Get active templates for specific type
     */
    getActiveTemplates(templateType?: TemplateType, language?: 'vi' | 'en'): Promise<NotificationTemplate[]>;
    /**
     * Get Vietnamese healthcare templates
     */
    getVietnameseHealthcareTemplates(): Promise<NotificationTemplate[]>;
    /**
     * Create new template
     */
    createTemplate(template: NotificationTemplate): Promise<void>;
    /**
     * Update existing template
     */
    updateTemplate(template: NotificationTemplate): Promise<void>;
    /**
     * Delete template (soft delete)
     */
    deleteTemplate(templateId: string): Promise<void>;
    /**
     * Activate template
     */
    activateTemplate(templateId: string): Promise<void>;
    /**
     * Deactivate template
     */
    deactivateTemplate(templateId: string): Promise<void>;
    /**
     * Approve template for production use
     */
    approveTemplate(templateId: string, _approvedBy: string): Promise<void>;
    /**
     * Apply template with placeholders to generate content
     */
    applyTemplate(templateId: string, placeholderValues: Record<string, any>, channelType?: string): Promise<NotificationContent>;
    /**
     * Apply template by type with placeholders
     */
    applyTemplateByType(templateType: TemplateType, placeholderValues: Record<string, any>, language?: 'vi' | 'en', channelType?: string): Promise<NotificationContent>;
    /**
     * Internal: Apply template and replace placeholders
     */
    private applyTemplateInternal;
    /**
     * Replace placeholders in text
     */
    private replacePlaceholders;
    /**
     * Validate template content and structure
     */
    validateTemplate(template: NotificationTemplate): Promise<TemplateValidationResult>;
    /**
     * Validate placeholder values against template requirements
     */
    validatePlaceholderValues(templateId: string, placeholderValues: Record<string, any>): Promise<TemplateValidationResult>;
    /**
     * Preview template with sample data
     */
    previewTemplate(templateId: string, sampleData?: Record<string, any>, channelType?: string): Promise<NotificationContent>;
    /**
     * Generate sample data for template
     */
    private generateSampleData;
    /**
     * Get template usage statistics
     */
    getTemplateUsageStatistics(templateId?: string, _dateRange?: {
        start: Date;
        end: Date;
    }): Promise<TemplateUsageStatistics[]>;
    /**
     * Get template performance metrics
     */
    getTemplatePerformanceMetrics(templateId: string, _dateRange?: {
        start: Date;
        end: Date;
    }): Promise<TemplatePerformanceMetrics>;
    /**
     * Get most used templates
     */
    getMostUsedTemplates(limit?: number, _dateRange?: {
        start: Date;
        end: Date;
    }): Promise<TemplateUsageStatistics[]>;
    /**
     * Get best performing templates
     */
    getBestPerformingTemplates(limit?: number, _dateRange?: {
        start: Date;
        end: Date;
    }): Promise<TemplatePerformanceMetrics[]>;
    getTemplateAnalytics(templateId: string, _dateRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalUsage: number;
        successRate: number;
        failureReasons: Record<string, number>;
        channelBreakdown: Record<string, number>;
        recipientTypeBreakdown: Record<string, number>;
        timeDistribution: Record<string, number>;
        averageDeliveryTime: number;
        costAnalysis: {
            totalCost: number;
            costPerDelivery: number;
            costByChannel: Record<string, number>;
        };
    }>;
    /**
     * Check if text contains Vietnamese characters
     */
    private hasVietnameseCharacters;
    /**
     * Extract placeholders from template content
     */
    extractPlaceholders(content: string): Promise<string[]>;
    /**
     * Suggest placeholders for template type
     */
    suggestPlaceholders(templateType: TemplateType, _language?: 'vi' | 'en'): Promise<Array<{
        key: string;
        description: string;
        required: boolean;
        type: string;
        example: any;
    }>>;
    cloneTemplate(_sourceTemplateId: string, _newTemplateId: string, _modifications?: any): Promise<NotificationTemplate>;
    createTemplateVersion(_templateId: string, _changes: any, _versionNotes?: string): Promise<NotificationTemplate>;
    getTemplateVersions(_templateId: string): Promise<NotificationTemplate[]>;
    rollbackTemplate(_templateId: string, _targetVersion: string): Promise<void>;
    testTemplate(_templateId: string, _testData: any, _channels: string[]): Promise<any>;
    getTemplateRecommendations(_recipientType: string, _context?: any): Promise<NotificationTemplate[]>;
    optimizeTemplateForChannel(_templateId: string, _channelType: string): Promise<NotificationTemplate>;
    getTemplateComplianceStatus(_templateId: string): Promise<any>;
    generateTemplateFromSample(_sampleContent: string, _templateType: TemplateType, _language: 'vi' | 'en'): Promise<NotificationTemplate>;
    exportTemplate(_templateId: string): Promise<object>;
    importTemplate(_templateData: object): Promise<NotificationTemplate>;
    bulkUpdateTemplates(_templateIds: string[], _updates: any): Promise<void>;
    searchTemplatesByContent(_searchQuery: string, _language?: 'vi' | 'en', _limit?: number): Promise<NotificationTemplate[]>;
    getTemplateHealthCheck(): Promise<any>;
    cleanupUnusedTemplates(_unusedForDays: number): Promise<number>;
    getTemplateDependencies(_templateId: string): Promise<string[]>;
    validateTemplateDependencies(_templateId: string): Promise<any>;
}
//# sourceMappingURL=VietnameseTemplateService.d.ts.map