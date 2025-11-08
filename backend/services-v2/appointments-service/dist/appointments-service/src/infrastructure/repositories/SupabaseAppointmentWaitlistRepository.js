"use strict";
/**
 * SupabaseAppointmentWaitlistRepository - Infrastructure Layer
 * Implements waitlist persistence using Supabase
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAppointmentWaitlistRepository = void 0;
const AppointmentWaitlist_entity_1 = require("../../domain/entities/AppointmentWaitlist.entity");
/**
 * Supabase implementation of waitlist repository
 */
class SupabaseAppointmentWaitlistRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.tableName = 'appointment_waitlist';
        this.schema = 'appointments_schema';
    }
    /**
     * Map database row to domain entity
     */
    toDomain(row) {
        const props = {
            waitlistId: row.waitlist_id,
            patientId: row.patient_id,
            preferredDoctorId: row.preferred_doctor_id || undefined,
            preferredDepartmentId: row.preferred_department_id || undefined,
            preferredDate: row.preferred_date ? new Date(row.preferred_date) : undefined,
            preferredTimeSlot: row.preferred_time_slot || undefined,
            appointmentType: row.appointment_type,
            priority: row.priority,
            status: row.status,
            notes: row.notes || undefined,
            reason: row.reason || undefined,
            isFlexibleDate: row.is_flexible_date,
            isFlexibleTime: row.is_flexible_time,
            isFlexibleDoctor: row.is_flexible_doctor,
            matchedAppointmentId: row.matched_appointment_id || undefined,
            matchedAt: row.matched_at ? new Date(row.matched_at) : undefined,
            matchedBy: row.matched_by || undefined,
            cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
            cancelledBy: row.cancelled_by || undefined,
            cancellationReason: row.cancellation_reason || undefined,
            expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
            contactPhone: row.contact_phone || undefined,
            contactEmail: row.contact_email || undefined,
            preferredContactMethod: row.preferred_contact_method,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            createdBy: row.created_by || undefined
        };
        return AppointmentWaitlist_entity_1.AppointmentWaitlist.reconstitute(props);
    }
    /**
     * Map domain entity to database row
     */
    toDatabase(waitlist) {
        return {
            waitlist_id: waitlist.waitlistId,
            patient_id: waitlist.patientId,
            preferred_doctor_id: waitlist.preferredDoctorId || null,
            preferred_department_id: waitlist.preferredDepartmentId || null,
            preferred_date: waitlist.preferredDate?.toISOString().split('T')[0] || null,
            preferred_time_slot: waitlist.preferredTimeSlot || null,
            appointment_type: waitlist.appointmentType,
            priority: waitlist.priority,
            status: waitlist.status,
            notes: waitlist.notes || null,
            reason: waitlist.reason || null,
            is_flexible_date: waitlist.isFlexibleDate,
            is_flexible_time: waitlist.isFlexibleTime,
            is_flexible_doctor: waitlist.isFlexibleDoctor,
            matched_appointment_id: waitlist.matchedAppointmentId || null,
            matched_at: waitlist.matchedAt?.toISOString() || null,
            matched_by: waitlist.matchedBy || null,
            expires_at: waitlist.expiresAt?.toISOString() || null,
            contact_phone: waitlist.contactPhone || null,
            contact_email: waitlist.contactEmail || null,
            preferred_contact_method: waitlist.preferredContactMethod,
            created_at: waitlist.createdAt.toISOString(),
            updated_at: waitlist.updatedAt.toISOString()
        };
    }
    /**
     * Save new waitlist entry
     */
    async save(waitlist) {
        const row = this.toDatabase(waitlist);
        const { error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .insert(row);
        if (error) {
            throw new Error(`Failed to save waitlist entry: ${error.message}`);
        }
    }
    /**
     * Update existing waitlist entry
     */
    async update(waitlist) {
        const row = this.toDatabase(waitlist);
        const { error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .update(row)
            .eq('waitlist_id', waitlist.waitlistId);
        if (error) {
            throw new Error(`Failed to update waitlist entry: ${error.message}`);
        }
    }
    /**
     * Find waitlist entry by ID
     */
    async findById(waitlistId) {
        const { data, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('waitlist_id', waitlistId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            throw new Error(`Failed to find waitlist entry: ${error.message}`);
        }
        return data ? this.toDomain(data) : null;
    }
    /**
     * Find waitlist entries by patient ID
     */
    async findByPatientId(patientId) {
        const { data, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to find waitlist entries: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    /**
     * Find waitlist entries with filters
     */
    async findWithFilters(criteria, limit = 50, offset = 0) {
        let query = this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*');
        // Apply filters
        if (criteria.patientId) {
            query = query.eq('patient_id', criteria.patientId);
        }
        if (criteria.doctorId) {
            query = query.eq('preferred_doctor_id', criteria.doctorId);
        }
        if (criteria.departmentId) {
            query = query.eq('preferred_department_id', criteria.departmentId);
        }
        if (criteria.date) {
            query = query.eq('preferred_date', criteria.date.toISOString().split('T')[0]);
        }
        if (criteria.appointmentType) {
            query = query.eq('appointment_type', criteria.appointmentType);
        }
        if (criteria.priority) {
            query = query.eq('priority', criteria.priority);
        }
        if (criteria.status) {
            query = query.eq('status', criteria.status);
        }
        if (criteria.isExpired !== undefined) {
            if (criteria.isExpired) {
                query = query.lt('expires_at', new Date().toISOString());
            }
            else {
                query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
            }
        }
        // Order by priority and creation time
        query = query
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find waitlist entries: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    /**
     * Find waiting entries (status = WAITING, not expired)
     */
    async findWaitingEntries(limit = 100) {
        const { data, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('status', AppointmentWaitlist_entity_1.WaitlistStatus.WAITING)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to find waiting entries: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    /**
     * Find expired entries that need to be marked as expired
     */
    async findExpiredEntries(limit = 100) {
        const { data, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('status', AppointmentWaitlist_entity_1.WaitlistStatus.WAITING)
            .not('expires_at', 'is', null)
            .lt('expires_at', new Date().toISOString())
            .limit(limit);
        if (error) {
            throw new Error(`Failed to find expired entries: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    /**
     * Find matching entries for a slot
     */
    async findMatchingEntries(criteria) {
        let query = this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('status', AppointmentWaitlist_entity_1.WaitlistStatus.WAITING)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
        // Match criteria with flexibility
        if (criteria.doctorId) {
            query = query.or(`preferred_doctor_id.eq.${criteria.doctorId},is_flexible_doctor.eq.true`);
        }
        if (criteria.departmentId) {
            query = query.eq('preferred_department_id', criteria.departmentId);
        }
        if (criteria.date) {
            const dateStr = criteria.date.toISOString().split('T')[0];
            query = query.or(`preferred_date.eq.${dateStr},is_flexible_date.eq.true`);
        }
        if (criteria.timeSlot) {
            query = query.or(`preferred_time_slot.eq.${criteria.timeSlot},is_flexible_time.eq.true`);
        }
        if (criteria.appointmentType) {
            query = query.eq('appointment_type', criteria.appointmentType);
        }
        // Order by priority and creation time
        query = query
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(10);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find matching entries: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    /**
     * Delete waitlist entry
     */
    async delete(waitlistId) {
        const { error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .delete()
            .eq('waitlist_id', waitlistId);
        if (error) {
            throw new Error(`Failed to delete waitlist entry: ${error.message}`);
        }
    }
    /**
     * Count waitlist entries by criteria
     */
    async count(criteria) {
        let query = this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*', { count: 'exact', head: true });
        // Apply filters (same as findWithFilters)
        if (criteria.patientId) {
            query = query.eq('patient_id', criteria.patientId);
        }
        if (criteria.doctorId) {
            query = query.eq('preferred_doctor_id', criteria.doctorId);
        }
        if (criteria.departmentId) {
            query = query.eq('preferred_department_id', criteria.departmentId);
        }
        if (criteria.date) {
            query = query.eq('preferred_date', criteria.date.toISOString().split('T')[0]);
        }
        if (criteria.appointmentType) {
            query = query.eq('appointment_type', criteria.appointmentType);
        }
        if (criteria.priority) {
            query = query.eq('priority', criteria.priority);
        }
        if (criteria.status) {
            query = query.eq('status', criteria.status);
        }
        if (criteria.isExpired !== undefined) {
            if (criteria.isExpired) {
                query = query.lt('expires_at', new Date().toISOString());
            }
            else {
                query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
            }
        }
        const { count, error } = await query;
        if (error) {
            throw new Error(`Failed to count waitlist entries: ${error.message}`);
        }
        return count || 0;
    }
    /**
     * Get waitlist position for a patient
     * Returns position in queue based on priority and creation time
     */
    async getWaitlistPosition(waitlistId) {
        // First get the waitlist entry
        const entry = await this.findById(waitlistId);
        if (!entry) {
            throw new Error('Waitlist entry not found');
        }
        // Count entries with higher priority or same priority but earlier creation time
        const { count, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*', { count: 'exact', head: true })
            .eq('status', AppointmentWaitlist_entity_1.WaitlistStatus.WAITING)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .or(`priority.gt.${entry.priority},and(priority.eq.${entry.priority},created_at.lt.${entry.createdAt.toISOString()})`);
        if (error) {
            throw new Error(`Failed to get waitlist position: ${error.message}`);
        }
        return (count || 0) + 1; // Position is count + 1 (1-indexed)
    }
}
exports.SupabaseAppointmentWaitlistRepository = SupabaseAppointmentWaitlistRepository;
//# sourceMappingURL=SupabaseAppointmentWaitlistRepository.js.map