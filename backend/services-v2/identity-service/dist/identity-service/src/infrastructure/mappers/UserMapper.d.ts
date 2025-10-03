/**
 * User Mapper - Infrastructure Layer
 * Maps between Domain entities and Database records
 * Implements Clean Architecture - Infrastructure knows about both Domain and Database
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
import { User } from '../../domain/aggregates/User';
/**
 * Database record interface for user_profiles table
 */
export interface UserRecord {
    id: string;
    email: string;
    username?: string;
    full_name: string;
    phone_number?: string;
    avatar_url?: string;
    role_type: string;
    is_active: boolean;
    is_verified: boolean;
    citizen_id?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    subscription_tier?: string;
    subscription_expires_at?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}
/**
 * User Mapper
 * Responsible for mapping between User aggregate and database records
 */
export declare class UserMapper {
    /**
     * Map from database record to User aggregate
     */
    static toDomain(record: UserRecord): User;
    /**
     * Map from User aggregate to database record
     */
    static toPersistence(user: User): Partial<UserRecord>;
    /**
     * Map from User aggregate to database record for insert
     */
    static toInsert(user: User): UserRecord;
    /**
     * Map from User aggregate to database record for update
     */
    static toUpdate(user: User): Partial<UserRecord>;
}
//# sourceMappingURL=UserMapper.d.ts.map