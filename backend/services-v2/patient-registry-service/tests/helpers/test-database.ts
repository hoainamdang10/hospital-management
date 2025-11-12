/**
 * Test Database Helper
 * Provides utilities for setting up and cleaning up test database
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';

/**
 * Test Database Helper Class
 * Manages test database lifecycle for integration tests
 */
export class TestDatabase {
  private supabaseClient: SupabaseClient;
  private testDataIds: {
    patients: string[];
    emergencyContacts: string[];
    medicalHistory: string[];
    insuranceInfo: string[];
  };

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.testDataIds = {
      patients: [],
      emergencyContacts: [],
      medicalHistory: [],
      insuranceInfo: []
    };
  }

  /**
   * Get Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabaseClient;
  }

  /**
   * Setup test database
   * Called before test suite runs
   */
  async setup(): Promise<void> {
    console.log('🔧 Setting up test database...');

    // Verify connection using schema-qualified table name
    const { error } = await this.supabaseClient
      .schema('patient_schema')
      .from('patients') // Correct table name
      .select('patient_id')
      .limit(1);

    if (error) {
      throw new Error(`Failed to connect to test database: ${error.message}`);
    }

    console.log('✅ Test database connected');
  }

  /**
   * Cleanup all test data
   * Called after each test or test suite
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    try {
      // Delete in reverse order of dependencies

      // 1. Delete insurance info
      if (this.testDataIds.insuranceInfo.length > 0) {
        await this.supabaseClient
          .schema('patient_schema')
          .from('insurance_info')
          .delete()
          .in('id', this.testDataIds.insuranceInfo);
      }

      // 2. Delete medical history
      if (this.testDataIds.medicalHistory.length > 0) {
        await this.supabaseClient
          .schema('patient_schema')
          .from('medical_history')
          .delete()
          .in('id', this.testDataIds.medicalHistory);
      }

      // 3. Delete emergency contacts
      if (this.testDataIds.emergencyContacts.length > 0) {
        await this.supabaseClient
          .schema('patient_schema')
          .from('emergency_contacts')
          .delete()
          .in('id', this.testDataIds.emergencyContacts);
      }

      // 4. Delete patients
      if (this.testDataIds.patients.length > 0) {
        await this.supabaseClient
          .schema('patient_schema')
          .from('patients') // Correct table name
          .delete()
          .in('patient_id', this.testDataIds.patients);
      }

      // Reset tracking arrays
      this.testDataIds = {
        patients: [],
        emergencyContacts: [],
        medicalHistory: [],
        insuranceInfo: []
      };

      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
      throw error;
    }
  }

  /**
   * Track patient ID for cleanup
   */
  trackPatient(patientId: string): void {
    this.testDataIds.patients.push(patientId);
  }

  /**
   * Track emergency contact ID for cleanup
   */
  trackEmergencyContact(contactId: string): void {
    this.testDataIds.emergencyContacts.push(contactId);
  }

  /**
   * Track medical history ID for cleanup
   */
  trackMedicalHistory(historyId: string): void {
    this.testDataIds.medicalHistory.push(historyId);
  }

  /**
   * Track insurance info ID for cleanup
   */
  trackInsuranceInfo(insuranceId: string): void {
    this.testDataIds.insuranceInfo.push(insuranceId);
  }

  /**
   * Delete all test patients matching pattern
   */
  async cleanupTestPatients(pattern: string = 'TEST%'): Promise<void> {
    try {
      // Note: national_id is in personal_info JSONB, need to use JSONB query
      const { error } = await this.supabaseClient
        .schema('patient_schema')
        .from('patients') // Correct table name
        .delete()
        .like('personal_info->>nationalId', pattern);

      if (error) {
        console.warn(`⚠️  Could not cleanup test patients: ${error.message}`);
      } else {
        console.log('✅ Test patients cleaned up');
      }
    } catch (error) {
      console.warn('⚠️  Error cleaning up test patients:', error);
    }
  }

  /**
   * Verify patient exists in database
   */
  async verifyPatientExists(patientId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .schema('patient_schema')
        .from('patients') // Correct table name
        .select('patient_id')
        .eq('patient_id', patientId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get patient from database
   */
  async getPatient(patientId: string): Promise<any> {
    const { data, error } = await this.supabaseClient
      .schema('patient_schema')
      .from('patients') // Correct table name
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (error) {
      throw new Error(`Failed to get patient: ${error.message}`);
    }

    return data;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
    console.log('✅ Test database connection closed');
  }
}

/**
 * Create singleton instance for tests
 */
let testDatabaseInstance: TestDatabase | null = null;

export function getTestDatabase(): TestDatabase {
  if (!testDatabaseInstance) {
    testDatabaseInstance = new TestDatabase();
  }
  return testDatabaseInstance;
}

/**
 * Reset test database instance
 */
export function resetTestDatabase(): void {
  testDatabaseInstance = null;
}

