/**
 * Test Patient Factory
 * Creates patient test data for integration tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
export interface TestPatientData {
    patientId: string;
    userId: string;
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
    primaryPhone: string;
    email: string;
    address: {
        street: string;
        ward: string;
        district: string;
        city: string;
        country: string;
    };
}
/**
 * Test Patient Factory Class
 * Creates patient test data directly in database
 */
export declare class TestPatientFactory {
    private supabaseClient;
    private createdPatientIds;
    constructor(supabaseClient: SupabaseClient);
    /**
     * Create a test patient directly in database
     * Uses JSONB structure matching the actual schema
     */
    createTestPatient(data: {
        userId: string;
        fullName?: string;
        dateOfBirth?: string;
        gender?: 'male' | 'female' | 'other';
        nationalId?: string;
        primaryPhone?: string;
        email?: string;
        address?: {
            street?: string;
            ward?: string;
            district?: string;
            city?: string;
            country?: string;
        };
    }): Promise<TestPatientData>;
    /**
     * Create emergency contact for patient
     */
    createEmergencyContact(data: {
        patientId: string;
        fullName?: string;
        relationship?: string;
        phoneNumber?: string;
        isPrimary?: boolean;
    }): Promise<string>;
    /**
     * Update patient's basic medical info
     * Medical history is stored in JSONB field, not separate table
     */
    updateMedicalInfo(data: {
        patientId: string;
        bloodType?: string;
        allergies?: string[];
        chronicConditions?: string[];
        currentMedications?: string[];
    }): Promise<void>;
    /**
     * Create insurance info for patient
     */
    createInsuranceInfo(data: {
        patientId: string;
        insuranceType?: 'BHYT' | 'BHTN' | 'Private';
        insuranceNumber?: string;
        provider?: string;
        validFrom?: string;
        validTo?: string;
    }): Promise<string>;
    /**
     * Cleanup all created patients
     */
    cleanup(): Promise<void>;
    /**
     * Generate random patient ID
     */
    private generatePatientId;
    /**
     * Generate random Vietnamese national ID (CCCD)
     */
    private generateNationalId;
    /**
     * Generate random Vietnamese phone number
     */
    private generatePhoneNumber;
    /**
     * Generate random email
     */
    private generateEmail;
    /**
     * Generate random insurance number
     */
    private generateInsuranceNumber;
}
//# sourceMappingURL=test-patient-factory.d.ts.map