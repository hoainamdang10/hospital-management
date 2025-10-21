/**
 * Test User Factory
 * Creates verified users for integration tests, bypassing email verification
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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
export class TestUserFactory {
  private createdUserIds: string[] = [];

  constructor(private supabaseClient: SupabaseClient) {}

  /**
   * Create a verified user directly in database
   * Bypasses email verification flow for testing
   */
  async createVerifiedUser(data: {
    email: string;
    password: string;
    fullName: string;
    roleType?: 'admin' | 'doctor' | 'nurse' | 'patient' | 'receptionist';
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    citizenId?: string;
  }): Promise<TestUserData> {
    const {
      email,
      password,
      fullName,
      roleType = 'patient', // Lowercase
      phoneNumber = '0912345678',
      address = '123 Test Street, Hanoi',
      dateOfBirth = '1990-01-01',
      gender = 'male',
      citizenId = '001234567890'
    } = data;

    try {
      // 1. Create user in auth.users (Supabase Auth)
      console.log(`🔧 Creating auth user for ${email}...`);
      const { data: authUser, error: authError } = await this.supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: fullName,
          role_type: roleType
        }
      });

      if (authError || !authUser.user) {
        throw new Error(`Failed to create auth user: ${authError?.message || 'User object is null'}`);
      }

      const userId = authUser.user.id;
      console.log(`✅ Auth user created: ${userId}`);

      // 2. Create user profile in auth_schema.user_profiles
      const { error: profileError } = await this.supabaseClient
        .schema('auth_schema')
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          phone_number: phoneNumber,
          address,
          date_of_birth: dateOfBirth,
          gender,
          citizen_id: citizenId,
          role_type: roleType, // Role is stored in user_profiles
          is_verified: true, // Force verified (not is_email_verified)
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn(`⚠️  Failed to create user profile: ${profileError.message}`);
        // Continue anyway, profile might be created by trigger
      } else {
        console.log(`✅ User profile created for ${email}`);
      }

      // 3. Assign role in auth_schema.user_roles (optional, for compatibility)
      const { error: roleError } = await this.supabaseClient
        .schema('auth_schema')
        .from('user_roles')
        .insert({
          id: uuidv4(),
          user_id: userId,
          role_name: roleType, // Use role_name instead of role_type
          assigned_at: new Date().toISOString() // Use assigned_at instead of created_at
        });

      if (roleError) {
        console.warn(`⚠️  Failed to assign role: ${roleError.message}`);
      } else {
        console.log(`✅ Role ${roleType} assigned to ${email}`);
      }

      // Track for cleanup
      this.createdUserIds.push(userId);

      return {
        userId,
        email,
        fullName,
        roleType,
        isEmailVerified: true,
        isActive: true
      };
    } catch (error) {
      console.error(`❌ Error creating verified user:`, error);
      throw error;
    }
  }

  /**
   * Create a verified patient user
   */
  async createVerifiedPatient(data: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<TestUserData> {
    return this.createVerifiedUser({
      ...data,
      roleType: 'patient' // Lowercase
    });
  }

  /**
   * Create a verified doctor user
   */
  async createVerifiedDoctor(data: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<TestUserData> {
    return this.createVerifiedUser({
      ...data,
      roleType: 'doctor' // Lowercase
    });
  }

  /**
   * Create a verified admin user
   */
  async createVerifiedAdmin(data: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<TestUserData> {
    return this.createVerifiedUser({
      ...data,
      roleType: 'admin' // Lowercase
    });
  }

  /**
   * Login user and get access token
   */
  async loginUser(email: string, password: string): Promise<string> {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      throw new Error(`Failed to login user: ${error?.message || 'No session'}`);
    }

    return data.session.access_token;
  }

  /**
   * Cleanup all created users
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test users...');

    for (const userId of this.createdUserIds) {
      try {
        // Delete user roles
        await this.supabaseClient
          .schema('auth_schema')
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // Delete user profile
        await this.supabaseClient
          .schema('auth_schema')
          .from('user_profiles')
          .delete()
          .eq('id', userId);

        // Delete from auth.users
        await this.supabaseClient.auth.admin.deleteUser(userId);

        console.log(`✅ Deleted test user: ${userId}`);
      } catch (error) {
        console.warn(`⚠️  Error deleting test user ${userId}:`, error);
      }
    }

    this.createdUserIds = [];
    console.log('✅ Test users cleaned up');
  }

  /**
   * Get created user IDs
   */
  getCreatedUserIds(): string[] {
    return [...this.createdUserIds];
  }
}

/**
 * Generate random email for testing
 */
export function generateTestEmail(): string {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `test-${randomString}@hospital.test`;
}

/**
 * Generate random password for testing
 */
export function generateTestPassword(): string {
  return `TestPass123!${Math.random().toString(36).substring(2, 6)}`;
}

