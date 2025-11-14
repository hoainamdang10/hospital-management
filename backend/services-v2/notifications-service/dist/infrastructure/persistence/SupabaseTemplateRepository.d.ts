/**
 * SupabaseTemplateRepository - Template Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Manages notification templates with Vietnamese healthcare focus
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationTemplate, TemplateType } from '../../domain/value-objects/NotificationTemplate';
export interface TemplateSearchCriteria {
    templateType?: TemplateType;
    language?: 'vi' | 'en';
    category?: string;
    isActive?: boolean;
    isApproved?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
}
/**
 * Template Repository for Supabase
 */
export declare class SupabaseTemplateRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    /**
     * Get template by ID
     */
    findById(templateId: string): Promise<NotificationTemplate | null>;
    /**
     * Get template by type and language (using database function)
     */
    findByTypeAndLanguage(templateType: TemplateType, language?: 'vi' | 'en'): Promise<NotificationTemplate | null>;
    /**
     * Find templates by criteria
     */
    findByCriteria(criteria: TemplateSearchCriteria): Promise<NotificationTemplate[]>;
    /**
     * Get all active Vietnamese healthcare templates
     */
    getVietnameseHealthcareTemplates(): Promise<NotificationTemplate[]>;
    /**
     * Save template
     */
    save(template: NotificationTemplate): Promise<void>;
    /**
     * Update template
     */
    update(template: NotificationTemplate): Promise<void>;
    /**
     * Delete template (soft delete)
     */
    delete(templateId: string): Promise<void>;
    /**
     * Increment template usage (using database function)
     */
    incrementUsage(templateId: string, success: boolean): Promise<void>;
    /**
     * Get template usage statistics
     */
    getUsageStatistics(templateId?: string): Promise<any[]>;
    /**
     * Get most used templates
     */
    getMostUsed(limit?: number): Promise<NotificationTemplate[]>;
    /**
     * Get best performing templates
     */
    getBestPerforming(limit?: number): Promise<NotificationTemplate[]>;
    /**
     * Search templates by name or description
     */
    search(searchTerm: string, language?: 'vi' | 'en', limit?: number): Promise<NotificationTemplate[]>;
    private mapToRecord;
    private mapToValueObject;
}
//# sourceMappingURL=SupabaseTemplateRepository.d.ts.map