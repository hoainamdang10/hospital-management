/**
 * ITemplateService - Domain Service Interface
 * Service interface for notification template management and processing
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { NotificationTemplate, TemplateType, TemplatePriority } from '../value-objects/NotificationTemplate';
import { NotificationContent } from '../value-objects/NotificationContent';

export interface TemplateSearchCriteria {
  templateType?: TemplateType;
  language?: 'vi' | 'en';
  priority?: TemplatePriority;
  isActive?: boolean;
  isApproved?: boolean;
  tags?: string[];
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  nameContains?: string;
  limit?: number;
  offset?: number;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface TemplateUsageStatistics {
  templateId: string;
  templateType: TemplateType;
  usageCount: number;
  successRate: number;
  averageDeliveryTime: number;
  lastUsed: Date;
  popularChannels: string[];
  commonRecipientTypes: string[];
}

export interface TemplatePerformanceMetrics {
  templateId: string;
  deliverySuccessRate: number;
  averageProcessingTime: number;
  channelPerformance: Record<string, {
    successRate: number;
    averageDeliveryTime: number;
    failureReasons: string[];
  }>;
  recipientEngagement: {
    openRate?: number;
    clickRate?: number;
    responseRate?: number;
  };
}

export interface ITemplateService {
  /**
   * Get template by ID
   */
  getTemplate(templateId: string): Promise<NotificationTemplate | null>;

  /**
   * Get template by type and language
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
   * Delete template
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
  approveTemplate(templateId: string, approvedBy: string): Promise<void>;

  /**
   * Apply template with placeholders to generate content
   */
  applyTemplate(
    templateId: string,
    placeholderValues: Record<string, any>,
    channelType?: string
  ): Promise<NotificationContent>;

  /**
   * Apply template by type with placeholders
   */
  applyTemplateByType(
    templateType: TemplateType,
    placeholderValues: Record<string, any>,
    language?: 'vi' | 'en',
    channelType?: string
  ): Promise<NotificationContent>;

  /**
   * Validate template content and structure
   */
  validateTemplate(template: NotificationTemplate): Promise<TemplateValidationResult>;

  /**
   * Validate placeholder values against template requirements
   */
  validatePlaceholderValues(
    templateId: string,
    placeholderValues: Record<string, any>
  ): Promise<TemplateValidationResult>;

  /**
   * Preview template with sample data
   */
  previewTemplate(
    templateId: string,
    sampleData?: Record<string, any>,
    channelType?: string
  ): Promise<NotificationContent>;

  /**
   * Get template usage statistics
   */
  getTemplateUsageStatistics(
    templateId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TemplateUsageStatistics[]>;

  /**
   * Get template performance metrics
   */
  getTemplatePerformanceMetrics(
    templateId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TemplatePerformanceMetrics>;

  /**
   * Get most used templates
   */
  getMostUsedTemplates(limit?: number, dateRange?: { start: Date; end: Date }): Promise<TemplateUsageStatistics[]>;

  /**
   * Get best performing templates
   */
  getBestPerformingTemplates(limit?: number, dateRange?: { start: Date; end: Date }): Promise<TemplatePerformanceMetrics[]>;

  /**
   * Clone template with modifications
   */
  cloneTemplate(
    sourceTemplateId: string,
    newTemplateId: string,
    modifications?: Partial<{
      name: string;
      description: string;
      content: any;
      language: 'vi' | 'en';
      priority: TemplatePriority;
    }>
  ): Promise<NotificationTemplate>;

  /**
   * Create template version
   */
  createTemplateVersion(
    templateId: string,
    changes: Partial<NotificationTemplate>,
    versionNotes?: string
  ): Promise<NotificationTemplate>;

  /**
   * Get template versions
   */
  getTemplateVersions(templateId: string): Promise<NotificationTemplate[]>;

  /**
   * Rollback to previous template version
   */
  rollbackTemplate(templateId: string, targetVersion: string): Promise<void>;

  /**
   * Test template with real data
   */
  testTemplate(
    templateId: string,
    testData: Record<string, any>,
    channels: string[]
  ): Promise<{
    success: boolean;
    results: Array<{
      channel: string;
      content: NotificationContent;
      validation: TemplateValidationResult;
    }>;
  }>;

  /**
   * Get template recommendations based on usage patterns
   */
  getTemplateRecommendations(
    recipientType: string,
    context?: {
      templateType?: TemplateType;
      language?: 'vi' | 'en';
      priority?: TemplatePriority;
      channels?: string[];
    }
  ): Promise<NotificationTemplate[]>;

  /**
   * Optimize template for specific channel
   */
  optimizeTemplateForChannel(
    templateId: string,
    channelType: string
  ): Promise<NotificationTemplate>;

  /**
   * Get template compliance status (Vietnamese healthcare standards)
   */
  getTemplateComplianceStatus(templateId: string): Promise<{
    isCompliant: boolean;
    vietnameseSupport: boolean;
    hipaaCompliant: boolean;
    mohStandards: boolean;
    issues: string[];
    recommendations: string[];
  }>;

  /**
   * Generate template from sample content
   */
  generateTemplateFromSample(
    sampleContent: string,
    templateType: TemplateType,
    language: 'vi' | 'en'
  ): Promise<NotificationTemplate>;

  /**
   * Extract placeholders from content
   */
  extractPlaceholders(content: string): Promise<string[]>;

  /**
   * Suggest placeholders for template type
   */
  suggestPlaceholders(templateType: TemplateType, language?: 'vi' | 'en'): Promise<Array<{
    key: string;
    description: string;
    required: boolean;
    type: string;
    example: any;
  }>>;

  /**
   * Get template analytics
   */
  getTemplateAnalytics(
    templateId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
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
   * Export template for backup or migration
   */
  exportTemplate(templateId: string): Promise<object>;

  /**
   * Import template from backup or migration
   */
  importTemplate(templateData: object): Promise<NotificationTemplate>;

  /**
   * Bulk operations on templates
   */
  bulkUpdateTemplates(
    templateIds: string[],
    updates: Partial<{
      isActive: boolean;
      priority: TemplatePriority;
      tags: string[];
    }>
  ): Promise<void>;

  /**
   * Search templates by content
   */
  searchTemplatesByContent(
    searchQuery: string,
    language?: 'vi' | 'en',
    limit?: number
  ): Promise<NotificationTemplate[]>;

  /**
   * Get template health check
   */
  getTemplateHealthCheck(): Promise<{
    totalTemplates: number;
    activeTemplates: number;
    approvedTemplates: number;
    templatesWithIssues: number;
    recentlyUsedTemplates: number;
    unusedTemplates: number;
    averageSuccessRate: number;
  }>;

  /**
   * Cleanup unused templates
   */
  cleanupUnusedTemplates(unusedForDays: number): Promise<number>;

  /**
   * Get template dependencies (templates that reference this template)
   */
  getTemplateDependencies(templateId: string): Promise<string[]>;

  /**
   * Validate template dependencies
   */
  validateTemplateDependencies(templateId: string): Promise<{
    isValid: boolean;
    missingDependencies: string[];
    circularDependencies: string[];
  }>;
}
