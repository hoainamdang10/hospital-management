/**
 * Global Teardown for Integration Tests
 * Cleans up test user pool after all tests complete
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createTestSupabaseClient } from './helpers/integrationHelpers';
import { cleanupTestUserPool, TestUserPool } from './helpers/test-user-pool';

export default async function globalTeardown() {
  console.log('\n🧹 Global Teardown: Cleaning up test user pool...');

  try {
    const userPool = (global as any).__TEST_USER_POOL__ as TestUserPool;

    if (userPool) {
      const supabaseClient = createTestSupabaseClient();
      await cleanupTestUserPool(supabaseClient, userPool);
      console.log('✅ Global Teardown: Test user pool cleaned up\n');
    } else {
      console.log('ℹ️  No test user pool to clean up\n');
    }
  } catch (error) {
    console.warn('⚠️  Global Teardown warning:', error);
  }
}

