/**
 * Integration Tests for Verify-First Registration Flow
 * Tests complete flow: Register → Verify Email → User Created
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RegisterUserUseCase } from '../../src/application/use-cases/RegisterUserUseCase';
import { VerifyEmailUseCase } from '../../src/application/use-cases/VerifyEmailUseCase';
import { SupabaseUserRepository } from '../../src/infrastructure/repositories/SupabaseUserRepository';
import { SupabasePendingRegistrationRepository } from '../../src/infrastructure/repositories/SupabasePendingRegistrationRepository';
import { CircuitBreakerFactory } from '../../src/infrastructure/resilience/CircuitBreaker';
import { ILogger } from '../../src/application/services/ILogger';
import { IEmailService } from '../../src/application/services/IEmailService';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

describe('Verify-First Registration Flow - Integration Tests', () => {
  let supabaseClient: SupabaseClient;
  let userRepository: SupabaseUserRepository;
  let pendingRegistrationRepository: SupabasePendingRegistrationRepository;
  let registerUseCase: RegisterUserUseCase;
  let verifyEmailUseCase: VerifyEmailUseCase;
  let mockEmailService: jest.Mocked<IEmailService>;
  let logger: ILogger;

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test@123456';
  const testUserData = {
    email: testEmail,
    password: testPassword,
    fullName: 'Integration Test User',
    phoneNumber: '0901234567',
    roleType: 'PATIENT'
  };

  let capturedVerificationToken: string | null = null;

  beforeAll(async () => {
    // Initialize Supabase client
    supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'auth_schema'
        }
      }
    ) as any; // Type assertion to bypass schema type mismatch

    // Initialize logger
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn()
    };

    // Initialize repositories
    userRepository = new SupabaseUserRepository(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      logger
    );

    pendingRegistrationRepository = new SupabasePendingRegistrationRepository({
      supabase: supabaseClient,
      logger: logger,
      circuitBreaker: CircuitBreakerFactory.getBreaker('test-pending-registration')
    });

    // Mock email service to capture verification token
    mockEmailService = {
      sendVerificationEmail: jest.fn().mockImplementation(async ({ verificationUrl }) => {
        // Extract token from URL
        const url = new URL(verificationUrl);
        capturedVerificationToken = url.searchParams.get('token');
      }),
      sendVerificationSuccessEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn()
    } as any;

    // Initialize use cases
    registerUseCase = new RegisterUserUseCase(
      userRepository,
      pendingRegistrationRepository, // Fixed: pendingRegistrationRepository should be 2nd parameter
      logger,
      CircuitBreakerFactory.getBreaker('test-register'),
      mockEmailService,
      process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'test-secret',
      'http://localhost:3000'
    );

    verifyEmailUseCase = new VerifyEmailUseCase(
      userRepository,
      pendingRegistrationRepository,
      mockEmailService,
      logger,
      CircuitBreakerFactory.getBreaker('test-verify'),
      process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterAll(async () => {
    // Cleanup: Delete test user if exists
    try {
      const { data: users } = await supabaseClient
        .from('user_profiles')
        .select('user_id')
        .eq('email', testEmail);

      if (users && users.length > 0) {
        const userId = users[0].user_id;
        
        // Delete from auth.users
        await supabaseClient.auth.admin.deleteUser(userId);
        
        // Delete from user_profiles
        await supabaseClient
          .from('user_profiles')
          .delete()
          .eq('user_id', userId);
      }

      // Cleanup pending registrations
      await supabaseClient
        .from('pending_registrations')
        .delete()
        .eq('email', testEmail);

    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Complete Registration Flow', () => {
    it('should complete full verify-first flow: register → verify → user created', async () => {
      // Step 1: Register user (creates pending registration)
      const registerResult = await registerUseCase.execute(testUserData);

      expect(registerResult.success).toBe(true);
      expect(registerResult.pendingRegistrationId).toBeDefined();
      expect(registerResult.email).toBe(testEmail);
      expect(registerResult.requiresEmailVerification).toBe(true);

      // Verify email was sent
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(capturedVerificationToken).toBeDefined();

      // Step 2: Verify pending registration exists in database
      const { data: pendingData } = await supabaseClient
        .from('pending_registrations')
        .select('*')
        .eq('email', testEmail)
        .single();

      expect(pendingData).toBeDefined();
      expect(pendingData.email).toBe(testEmail);
      expect(pendingData.is_used).toBe(false);

      // Step 3: Verify user does NOT exist yet
      const { data: userData } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('email', testEmail);

      expect(userData).toEqual([]);

      // Step 4: Verify email (creates user)
      const verifyResult = await verifyEmailUseCase.execute({
        token: capturedVerificationToken!
      });

      expect(verifyResult.success).toBe(true);
      expect(verifyResult.userId).toBeDefined();
      expect(verifyResult.email).toBe(testEmail);

      // Step 5: Verify user now exists in database
      const { data: createdUser } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('email', testEmail)
        .single();

      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(testEmail);
      expect(createdUser.full_name).toBe(testUserData.fullName);
      expect(createdUser.phone_number).toBe(testUserData.phoneNumber);
      expect(createdUser.is_verified).toBe(true); // Email already verified

      // Step 6: Verify pending registration was deleted
      const { data: deletedPending } = await supabaseClient
        .from('pending_registrations')
        .select('*')
        .eq('email', testEmail);

      expect(deletedPending).toEqual([]);

      // Step 7: Verify welcome email was sent
      expect(mockEmailService.sendVerificationSuccessEmail).toHaveBeenCalledTimes(1);
    }, 30000); // 30 second timeout for integration test
  });

  describe('Error Scenarios', () => {
    it('should prevent duplicate pending registration', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      const userData = { ...testUserData, email };

      // First registration
      const result1 = await registerUseCase.execute(userData);
      expect(result1.success).toBe(true);

      // Second registration (should fail)
      const result2 = await registerUseCase.execute(userData);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('PENDING_REGISTRATION_EXISTS');

      // Cleanup
      await supabaseClient
        .from('pending_registrations')
        .delete()
        .eq('email', email);
    }, 30000);

    it('should reject expired token', async () => {
      const email = `expired-${Date.now()}@example.com`;
      const userData = { ...testUserData, email };

      // Register
      await registerUseCase.execute(userData);

      // Wait a bit to ensure DB write completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the pending registration data
      const { data: originalData } = await supabaseClient
        .from('pending_registrations')
        .select('*')
        .eq('email', email)
        .single();

      // Delete the original
      await supabaseClient
        .from('pending_registrations')
        .delete()
        .eq('email', email);

      // Create new pending_registration with expired dates
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      const createdDate = new Date(Date.now() - 2000); // 2 seconds ago

      await supabaseClient
        .from('pending_registrations')
        .insert({
          ...originalData,
          created_at: createdDate.toISOString(),
          expires_at: expiredDate.toISOString()
        });

      // Wait a bit to ensure DB insert completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to verify (should fail because pending_registration is expired)
      const verifyResult = await verifyEmailUseCase.execute({
        token: capturedVerificationToken!
      });

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.error).toBe('TOKEN_EXPIRED');

      // Cleanup
      await supabaseClient
        .from('pending_registrations')
        .delete()
        .eq('email', email);
    }, 30000);
  });
});

