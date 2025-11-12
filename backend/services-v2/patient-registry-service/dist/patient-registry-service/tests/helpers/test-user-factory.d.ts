/**
 * Test User Factory
 * Creates verified users for integration tests, bypassing email verification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
export interface TestUserData {
    userId: string;
    email: string;
    fullName: string;
    roleType: 'admin' | 'doctor' | 'nurse' | 'patient' | 'receptionist';
    isEmailVerified: boolean;
    isActive: boolean;
}
/**
 * Test User Factory Class
 * Creates verified users directly in database for integration tests
 */
export declare class TestUserFactory {
    private supabaseClient;
    private createdUserIds;
    constructor(supabaseClient: SupabaseClient);
    /**
     * Create a verified user directly in database
     * Bypasses email verification flow for testing
     */
    createVerifiedUser(data: {
        email: string;
        password: string;
        fullName: string;
        roleType?: 'admin' | 'doctor' | 'nurse' | 'patient' | 'receptionist';
        phoneNumber?: string;
        address?: string;
        dateOfBirth?: string;
        gender?: 'male' | 'female' | 'other';
        citizenId?: string;
    }): Promise<TestUserData>;
    /**
     * Create a verified patient user
     */
    createVerifiedPatient(data: {
        email: string;
        password: string;
        fullName: string;
    }): Promise<TestUserData>;
    /**
     * Create a verified doctor user
     */
    createVerifiedDoctor(data: {
        email: string;
        password: string;
        fullName: string;
    }): Promise<TestUserData>;
    /**
     * Create a verified admin user
     */
    createVerifiedAdmin(data: {
        email: string;
        password: string;
        fullName: string;
    }): Promise<TestUserData>;
    /**
     * Login user and get access token
     */
    loginUser(email: string, password: string): Promise<string>;
    /**
     * Cleanup all created users
     */
    cleanup(): Promise<void>;
    /**
     * Get created user IDs
     */
    getCreatedUserIds(): string[];
}
/**
 * Generate random email for testing
 */
export declare function generateTestEmail(): string;
/**
 * Generate random password for testing
 */
export declare function generateTestPassword(): string;
//# sourceMappingURL=test-user-factory.d.ts.map