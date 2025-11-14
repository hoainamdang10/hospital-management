"use strict";
/**
 * SupabaseTemplateRepository - Template Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Manages notification templates with Vietnamese healthcare focus
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseTemplateRepository = void 0;
const NotificationTemplate_1 = require("../../domain/value-objects/NotificationTemplate");
/**
 * Template Repository for Supabase
 */
class SupabaseTemplateRepository {
    constructor(supabase) {
        this.supabase = supabase;
    }
    /**
     * Get template by ID
     */
    async findById(templateId) {
        try {
            const { data, error } = await this.supabase
                .from('notification_templates')
                .select('*')
                .eq('template_id', templateId)
                .eq('is_deleted', false)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw new Error(`Supabase error: ${error.message}`);
            }
            return data ? this.mapToValueObject(data) : null;
        }
        catch (error) {
            throw new Error(`Failed to find template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get template by type and language (using database function)
     */
    async findByTypeAndLanguage(templateType, language = 'vi') {
        try {
            const { data, error } = await this.supabase
                .rpc('get_active_template', {
                p_template_type: templateType,
                p_language: language
            });
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
            if (!data || data.length === 0)
                return null;
            return this.mapToValueObject(data[0]);
        }
        catch (error) {
            throw new Error(`Failed to find template by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Find templates by criteria
     */
    async findByCriteria(criteria) {
        try {
            let query = this.supabase.from('notification_templates').select('*').eq('is_deleted', false);
            if (criteria.templateType)
                query = query.eq('template_type', criteria.templateType);
            if (criteria.language)
                query = query.eq('language', criteria.language);
            if (criteria.category)
                query = query.eq('category', criteria.category);
            if (criteria.isActive !== undefined)
                query = query.eq('is_active', criteria.isActive);
            if (criteria.isApproved !== undefined)
                query = query.eq('is_approved', criteria.isApproved);
            if (criteria.tags && criteria.tags.length > 0) {
                query = query.contains('tags', criteria.tags);
            }
            // Pagination
            if (criteria.limit) {
                const offset = criteria.offset || 0;
                query = query.range(offset, offset + criteria.limit - 1);
            }
            query = query.order('usage_count', { ascending: false });
            const { data, error } = await query;
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
            return (data || []).map(record => this.mapToValueObject(record));
        }
        catch (error) {
            throw new Error(`Failed to find templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get all active Vietnamese healthcare templates
     */
    async getVietnameseHealthcareTemplates() {
        const { data, error } = await this.supabase
            .from('notification_templates')
            .select('*')
            .eq('language', 'vi')
            .eq('is_vietnamese_healthcare_compliant', true)
            .eq('is_active', true)
            .eq('is_approved', true)
            .eq('is_deleted', false)
            .order('usage_count', { ascending: false });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map(record => this.mapToValueObject(record));
    }
    /**
     * Save template
     */
    async save(template) {
        try {
            const record = this.mapToRecord(template);
            const { error } = await this.supabase
                .from('notification_templates')
                .insert(record);
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
        }
        catch (error) {
            throw new Error(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Update template
     */
    async update(template) {
        try {
            const record = this.mapToRecord(template);
            const { template_id, created_at, created_by, ...updateData } = record;
            const { error } = await this.supabase
                .from('notification_templates')
                .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
                .eq('template_id', template_id);
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
        }
        catch (error) {
            throw new Error(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Delete template (soft delete)
     */
    async delete(templateId) {
        const { error } = await this.supabase
            .from('notification_templates')
            .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: 'system',
            is_active: false
        })
            .eq('template_id', templateId);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    /**
     * Increment template usage (using database function)
     */
    async incrementUsage(templateId, success) {
        const { error } = await this.supabase
            .rpc('increment_template_usage', {
            p_template_id: templateId,
            p_success: success
        });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    /**
     * Get template usage statistics
     */
    async getUsageStatistics(templateId) {
        let query = this.supabase
            .from('notification_templates')
            .select('template_id, template_type, usage_count, success_count, failure_count, avg_success_rate, last_used_at')
            .eq('is_deleted', false)
            .order('usage_count', { ascending: false });
        if (templateId) {
            query = query.eq('template_id', templateId);
        }
        const { data, error } = await query.limit(100);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return data || [];
    }
    /**
     * Get most used templates
     */
    async getMostUsed(limit = 10) {
        const { data, error } = await this.supabase
            .from('notification_templates')
            .select('*')
            .eq('is_active', true)
            .eq('is_deleted', false)
            .order('usage_count', { ascending: false })
            .limit(limit);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map(record => this.mapToValueObject(record));
    }
    /**
     * Get best performing templates
     */
    async getBestPerforming(limit = 10) {
        const { data, error } = await this.supabase
            .from('notification_templates')
            .select('*')
            .eq('is_active', true)
            .eq('is_deleted', false)
            .gte('usage_count', 10) // At least 10 uses for statistical significance
            .order('avg_success_rate', { ascending: false })
            .limit(limit);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map(record => this.mapToValueObject(record));
    }
    /**
     * Search templates by name or description
     */
    async search(searchTerm, language, limit = 20) {
        let query = this.supabase
            .from('notification_templates')
            .select('*')
            .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,template_type.ilike.%${searchTerm}%`)
            .eq('is_active', true)
            .eq('is_deleted', false);
        if (language)
            query = query.eq('language', language);
        const { data, error } = await query.order('usage_count', { ascending: false }).limit(limit);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map(record => this.mapToValueObject(record));
    }
    // ==================== Helper Methods ====================
    mapToRecord(template) {
        const content = template.getContent();
        const metadata = template.getMetadata();
        return {
            template_id: template.getTemplateId(),
            template_type: template.getTemplateType(),
            name: template.getName(),
            description: template.getDescription(),
            language: template.getLanguage(),
            subject_template: content.subject || '',
            body_template: content.body,
            html_template: null, // HTML stored in body with formatting
            sms_template: template.getContentForChannel('SMS')?.body,
            push_template: template.getContentForChannel('PUSH')?.body,
            supported_channels: ['EMAIL', 'SMS', 'PUSH'], // Default channels
            placeholders: template.getPlaceholders(),
            required_placeholders: template.getPlaceholders().filter(p => p.required).map(p => p.key),
            priority: template.getPriority(),
            category: metadata.version || 'general', // Use version as fallback
            is_active: template.isActive(),
            tags: metadata.tags || [],
            created_at: new Date().toISOString(),
            created_by: metadata.createdBy || 'system'
        };
    }
    mapToValueObject(record) {
        return NotificationTemplate_1.NotificationTemplate.create({
            templateId: record.template_id,
            templateType: record.template_type,
            name: record.name,
            description: record.description,
            language: record.language,
            priority: record.priority,
            content: {
                subject: record.subject_template,
                body: record.body_template,
                footer: undefined,
                attachments: []
            },
            placeholders: record.placeholders || [],
            createdBy: record.created_by || 'system',
            tags: record.tags || []
        });
    }
}
exports.SupabaseTemplateRepository = SupabaseTemplateRepository;
//# sourceMappingURL=SupabaseTemplateRepository.js.map