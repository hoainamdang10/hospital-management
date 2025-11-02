/**
 * Test User Pool Cache - Singleton
 * Seeds test pool once and reuses for all tests
 * Works with maxWorkers: 1 (all tests in same process)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  seedTestUserPool,
  cleanupTestUserPool,
  TestUserPool,
  refreshTestUserPoolTokens
} from './test-user-pool';

class TestUserPoolCache {
  private static instance: TestUserPoolCache;
  private userPool: TestUserPool | null = null;
  private isSeeding: boolean = false;
  private seedPromise: Promise<TestUserPool> | null = null;

  private constructor() {}

  static getInstance(): TestUserPoolCache {
    if (!TestUserPoolCache.instance) {
      TestUserPoolCache.instance = new TestUserPoolCache();
    }
    return TestUserPoolCache.instance;
  }

  /**
   * Get test user pool (seeds once if not already seeded)
   */
  async getPool(supabaseClient: SupabaseClient): Promise<TestUserPool> {
    // Return cached pool if already seeded
    if (this.userPool) {
      console.log('♻️  Reusing cached test user pool');
      this.userPool = await refreshTestUserPoolTokens(supabaseClient, this.userPool);
      return this.userPool;
    }

    // If already seeding, wait for it to complete
    if (this.isSeeding && this.seedPromise) {
      console.log('⏳ Waiting for test pool seeding to complete...');
      return this.seedPromise;
    }

    // Seed test pool
    console.log('🌱 Seeding test user pool (first time)...');
    this.isSeeding = true;
    
    this.seedPromise = (async () => {
      try {
        this.userPool = await seedTestUserPool(supabaseClient, { sequential: true });
        console.log('✅ Test user pool cached successfully');
        return this.userPool;
      } finally {
        this.isSeeding = false;
        this.seedPromise = null;
      }
    })();

    return this.seedPromise;
  }

  /**
   * Cleanup test pool (call in global teardown)
   */
  async cleanup(supabaseClient: SupabaseClient): Promise<void> {
    if (this.userPool) {
      console.log('🧹 Cleaning up cached test user pool...');
      await cleanupTestUserPool(supabaseClient, this.userPool);
      this.userPool = null;
      console.log('✅ Test user pool cleaned up');
    }
  }

  /**
   * Check if pool is cached
   */
  isCached(): boolean {
    return this.userPool !== null;
  }

  /**
   * Force reset cache (for testing purposes)
   */
  reset(): void {
    this.userPool = null;
    this.isSeeding = false;
    this.seedPromise = null;
  }
}

// Export singleton instance
export const testUserPoolCache = TestUserPoolCache.getInstance();

