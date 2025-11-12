/**
 * Integration Tests Setup
 *
 * Global setup and teardown for integration tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
declare let supabaseClient: SupabaseClient;
/**
 * Helper function to get test user token
 */
export declare function getTestUserToken(email: string, password: string): Promise<string>;
/**
 * Helper function to create test patient
 */
export declare function createTestPatient(data: any): Promise<string>;
/**
 * Helper function to delete test patient
 */
export declare function deleteTestPatient(patientId: string): Promise<void>;
export { supabaseClient };
//# sourceMappingURL=setup.d.ts.map