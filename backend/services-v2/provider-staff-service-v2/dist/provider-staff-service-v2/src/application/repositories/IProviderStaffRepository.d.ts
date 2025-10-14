/**
 * IProviderStaffRepository Interface
 * Application layer defines the contract, infrastructure implements it
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
export interface IProviderStaffRepository {
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
}
//# sourceMappingURL=IProviderStaffRepository.d.ts.map