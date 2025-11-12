/**
 * Test Database Helper
 * Provides utilities for setting up and cleaning up test database
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * Test Database Helper Class
 * Manages test database lifecycle for integration tests
 */
export declare class TestDatabase {
    private supabaseClient;
    private testDataIds;
    constructor();
    /**
     * Get Supabase client instance
     */
    getClient(): SupabaseClient;
    /**
     * Setup test database
     * Called before test suite runs
     */
    setup(): Promise<void>;
    /**
     * Cleanup all test data
     * Called after each test or test suite
     */
    cleanup(): Promise<void>;
    /**
     * Track patient ID for cleanup
     */
    trackPatient(patientId: string): void;
    /**
     * Track emergency contact ID for cleanup
     */
    trackEmergencyContact(contactId: string): void;
    /**
     * Track medical history ID for cleanup
     */
    trackMedicalHistory(historyId: string): void;
    /**
     * Track insurance info ID for cleanup
     */
    trackInsuranceInfo(insuranceId: string): void;
    /**
     * Delete all test patients matching pattern
     */
    cleanupTestPatients(pattern?: string): Promise<void>;
    /**
     * Verify patient exists in database
     */
    verifyPatientExists(patientId: string): Promise<boolean>;
    /**
     * Get patient from database
     */
    getPatient(patientId: string): Promise<any>;
    /**
     * Close database connection
     */
    close(): Promise<void>;
}
export declare function getTestDatabase(): TestDatabase;
/**
 * Reset test database instance
 */
export declare function resetTestDatabase(): void;
//# sourceMappingURL=test-database.d.ts.map