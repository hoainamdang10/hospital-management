/**
 * Global Setup for Integration Tests
 * Seeds test user pool once for all tests to avoid rate limiting
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { config } from 'dotenv';
import { createTestSupabaseClient } from './helpers/integrationHelpers';
import { seedTestUserPool, TestUserPool } from './helpers/test-user-pool';

// Load test environment
config({ path: '.env.test' });

export default async function globalSetup() {
  console.log('\n Global Setup: Seeding test user pool once for all tests...');

  try {
    const supabaseClient = createTestSupabaseClient();

    // Seed test pool once
    const userPool = await seedTestUserPool(supabaseClient, { sequential: true });

    // Store in global state để các tests có thể access
    (global as any).__TEST_USER_POOL__ = userPool;

    console.log(' Global Setup: Test user pool seeded successfully\n');
  } catch (error) {
    console.error(' Global Setup failed:', error);
    throw error;
  }
}

