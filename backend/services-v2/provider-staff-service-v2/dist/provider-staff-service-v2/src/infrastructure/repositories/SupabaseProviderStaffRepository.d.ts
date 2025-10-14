/**
 * Supabase Provider Staff Repository Implementation
 * Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IProviderStaffRepository } from '../../application/repositories/IProviderStaffRepository';
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
export declare class SupabaseProviderStaffRepository implements IProviderStaffRepository {
    private supabaseClient;
    private readonly tableName;
    private readonly schemaName;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Find staff by ID
     */
    findById(staffId: StaffId): Promise<ProviderStaff | null>;
    /**
     * Save new staff member
     */
    save(staff: ProviderStaff): Promise<void>;
    /**
     * Update existing staff member
     */
    update(staff: ProviderStaff): Promise<void>;
    /**
     * Delete staff member
     */
    delete(staffId: StaffId): Promise<void>;
    /**
     * Find all staff members
     */
    findAll(): Promise<ProviderStaff[]>;
    /**
     * Find staff by type
     */
    findByType(staffType: string): Promise<ProviderStaff[]>;
    /**
     * Check if staff exists
     */
    exists(staffId: StaffId): Promise<boolean>;
    /**
     * Convert persistence data to domain model
     */
    private toDomain;
}
//# sourceMappingURL=SupabaseProviderStaffRepository.d.ts.map