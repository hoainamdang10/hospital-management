"use strict";
/**
 * Inbox Repository - Idempotent Event Processing
 * Prevents duplicate event processing using inbox pattern
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, Idempotency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Inbox Repository
 * Stores processed events to ensure idempotency
 */
class InboxRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.table = 'inbox_events';
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            db: { schema: 'appointments_schema' },
            global: { headers: { 'X-Client-Info': 'appointments-inbox' } }
        });
    }
    /**
     * Check if event already processed
     */
    async exists(eventId) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select('id')
            .eq('event_id', eventId)
            .maybeSingle();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Inbox exists check failed: ${error.message}`);
        }
        return data !== null;
    }
    /**
     * Save processed event
     */
    async save(event) {
        const { error } = await this.supabase.from(this.table).insert({
            event_id: event.eventId,
            event_type: event.eventType,
            source_service: event.sourceService,
            payload_json: event.payloadJson,
            processed_at: event.processedAt || new Date().toISOString()
        });
        if (error) {
            // Ignore duplicate key violations (idempotency)
            if (error.code === '23505') {
                console.debug(`[InboxRepository] Duplicate event ${event.eventId}, ignoring`);
                return;
            }
            throw new Error(`Inbox save failed: ${error.message}`);
        }
        console.debug(`[InboxRepository] ✓ Event ${event.eventId} saved to inbox`);
    }
    /**
     * Get recent events by type (for monitoring/debugging)
     */
    async getRecentByType(eventType, limit = 10) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select('*')
            .eq('event_type', eventType)
            .order('processed_at', { ascending: false })
            .limit(limit);
        if (error) {
            throw new Error(`Inbox query failed: ${error.message}`);
        }
        return (data || []).map(this.mapToInboxEvent);
    }
    /**
     * Get recent events by source service
     */
    async getRecentBySource(sourceService, limit = 10) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select('*')
            .eq('source_service', sourceService)
            .order('processed_at', { ascending: false })
            .limit(limit);
        if (error) {
            throw new Error(`Inbox query failed: ${error.message}`);
        }
        return (data || []).map(this.mapToInboxEvent);
    }
    /**
     * Cleanup old events (retention policy: 30 days)
     */
    async cleanup(retentionDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const { data, error } = await this.supabase
            .from(this.table)
            .delete()
            .lt('created_at', cutoffDate.toISOString())
            .select('id');
        if (error) {
            throw new Error(`Inbox cleanup failed: ${error.message}`);
        }
        const deletedCount = data?.length || 0;
        console.log(`[InboxRepository] ✓ Cleaned up ${deletedCount} old inbox events`);
        return deletedCount;
    }
    /**
     * Get sync statistics (monitoring)
     */
    async getStats() {
        // Total events
        const { count: totalEvents } = await this.supabase
            .from(this.table)
            .select('id', { count: 'exact', head: true });
        // Events by type
        const { data: typeData } = await this.supabase
            .from(this.table)
            .select('event_type');
        const eventsByType = {};
        (typeData || []).forEach((row) => {
            eventsByType[row.event_type] = (eventsByType[row.event_type] || 0) + 1;
        });
        // Events by source
        const { data: sourceData } = await this.supabase
            .from(this.table)
            .select('source_service');
        const eventsBySource = {};
        (sourceData || []).forEach((row) => {
            eventsBySource[row.source_service] = (eventsBySource[row.source_service] || 0) + 1;
        });
        // Last processed
        const { data: lastData } = await this.supabase
            .from(this.table)
            .select('processed_at')
            .order('processed_at', { ascending: false })
            .limit(1)
            .single();
        return {
            totalEvents: totalEvents || 0,
            eventsByType,
            eventsBySource,
            lastProcessedAt: lastData?.processed_at ? new Date(lastData.processed_at) : null
        };
    }
    /**
     * Map database row to InboxEvent
     */
    mapToInboxEvent(row) {
        return {
            id: row.id,
            eventId: row.event_id,
            eventType: row.event_type,
            sourceService: row.source_service,
            payloadJson: row.payload_json,
            processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
            createdAt: row.created_at ? new Date(row.created_at) : undefined
        };
    }
}
exports.InboxRepository = InboxRepository;
//# sourceMappingURL=InboxRepository.js.map