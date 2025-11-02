/**
 * Authentication Helper for Integration/E2E Tests
 * Creates valid JWT tokens and test users
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export interface TestUser {
  userId: string;
  email: string;
  password: string;
  role: string;
  token: string;
  fullName?: string;
}

/**
 * Create test user with valid JWT token
 * Uses Supabase admin API to create user and generate token
 */
export async function createTestUserWithToken(
  role: 'DOCTOR' | 'NURSE' | 'PATIENT' | 'ADMIN' | 'RECEPTIONIST' = 'DOCTOR',
  options: { email?: string; fullName?: string } = {}
): Promise<TestUser> {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Generate unique email
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const email = options.email || `test-${role.toLowerCase()}-${timestamp}-${random}@test.com`;
  const password = 'TestPassword123!';
  const fullName = options.fullName || `Test ${role} User`;

  try {
    // Create user via Supabase Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role_type: role.toLowerCase()
      }
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    // Sign in to get session token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError || !sessionData.session) {
      throw new Error(`Failed to sign in test user: ${sessionError?.message}`);
    }

    return {
      userId: authData.user.id,
      email,
      password,
      role,
      token: sessionData.session.access_token,
      fullName
    };
  } catch (error: any) {
    throw new Error(`Failed to create test user with token: ${error.message}`);
  }
}

/**
 * Cleanup test user after tests
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    await supabase.auth.admin.deleteUser(userId);
  } catch (error) {
    console.warn(`Could not cleanup test user ${userId}:`, error);
  }
}

/**
 * Generate mock JWT token (for unit tests where we don't need real auth)
 * WARNING: This only works if auth validation is mocked
 */
export function generateMockJWT(
  userId: string = 'test-user-123',
  role: string = 'DOCTOR',
  expiresIn: string = '1h'
): string {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'test-secret';

  return jwt.sign(
    {
      sub: userId,
      email: `test-${userId}@example.com`,
      role,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    },
    jwtSecret,
    { algorithm: 'HS256' }
  );
}

/**
 * Create Authorization header value for tests
 */
export function createAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Test user pool for common roles
 * Creates users once and reuses across tests for performance
 */
export class TestUserPool {
  private users: Map<string, TestUser> = new Map();
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get or create test user for role
   */
  async getUser(role: 'DOCTOR' | 'NURSE' | 'PATIENT' | 'ADMIN' | 'RECEPTIONIST'): Promise<TestUser> {
    if (this.users.has(role)) {
      return this.users.get(role)!;
    }

    const user = await createTestUserWithToken(role);
    this.users.set(role, user);
    return user;
  }

  /**
   * Cleanup all test users
   */
  async cleanup(): Promise<void> {
    for (const user of this.users.values()) {
      await cleanupTestUser(user.userId);
    }
    this.users.clear();
  }
}

/**
 * Reusable test user pool instance
 */
let testUserPool: TestUserPool | null = null;

/**
 * Get singleton test user pool
 */
export function getTestUserPool(): TestUserPool {
  if (!testUserPool) {
    testUserPool = new TestUserPool();
  }
  return testUserPool;
}

/**
 * Cleanup test user pool (call in afterAll)
 */
export async function cleanupTestUserPool(): Promise<void> {
  if (testUserPool) {
    await testUserPool.cleanup();
    testUserPool = null;
  }
}
