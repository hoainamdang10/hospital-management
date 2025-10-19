/**
 * Integration Tests - Session Management Routes
 * 
 * Tests session management endpoints with REAL database operations:
 * - GET /api/v1/users/:userId/sessions - List active sessions
 * - DELETE /api/v1/users/:userId/sessions/:sessionId - Terminate specific session
 * - DELETE /api/v1/users/:userId/sessions - Terminate all sessions except current
 * 
 * @group integration
 */

import request from 'supertest';
import { Application } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createTestApp } from '../helpers/appFactory';
import {
  createTestSupabaseClient,
  createTestUser,
  cleanupTestUsers
} from '../helpers/integrationHelpers';

describe('Session Management Integration Tests', () => {
  let app: Application;
  let supabaseClient: SupabaseClient;
  let cleanup: () => Promise<void>;
  const testEmails: string[] = [];

  // Test users
  let patientUser: { userId: string; email: string; password: string; accessToken: string };
  let adminUser: { userId: string; email: string; password: string; accessToken: string };

  // Helper to generate unique test email
  const generateTestEmail = (prefix: string): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}@hospital.vn`;
  };

  // Helper to generate unique citizen ID (12 digits)
  const generateUniqueCitizenId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const combined = timestamp + random;
    return combined.slice(-12);
  };

  // Helper to create a session by logging in
  const createSession = async (email: string, password: string): Promise<string> => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email, password });

    if (!response.body.accessToken) {
      throw new Error('Failed to create session');
    }

    return response.body.accessToken;
  };

  // Helper to get all sessions from database
  const getSessionsFromDb = async (userId: string): Promise<any[]> => {
    const { data, error } = await supabaseClient
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get sessions from DB: ${error.message}`);
    }

    return data || [];
  };

  beforeAll(async () => {
    // Create Supabase client with service_role key
    supabaseClient = createTestSupabaseClient();

    // Create Express app with real dependencies
    const result = await createTestApp();
    app = result.app;
    cleanup = result.cleanup;

    // Create test patient user
    const patientEmail = generateTestEmail('patient-session');
    const patientPassword = 'PatientPassword123!';
    testEmails.push(patientEmail);

    const patient = await createTestUser(
      supabaseClient,
      patientEmail,
      patientPassword,
      'PATIENT',
      {
        fullName: 'Test Patient Session',
        phoneNumber: '0901234590',
        address: '123 Test Street, Hanoi, Vietnam',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        citizenId: generateUniqueCitizenId()
      }
    );

    // Login to get access token
    const patientToken = await createSession(patientEmail, patientPassword);

    patientUser = {
      userId: patient.userId,
      email: patientEmail,
      password: patientPassword,
      accessToken: patientToken
    };

    // DEBUG: Verify user ID matches JWT token
    const jwt = require('jsonwebtoken');
    const decodedPatient = jwt.decode(patientToken) as any;
    console.log('🔍 DEBUG - Patient User Setup:', {
      patientUserId: patient.userId,
      jwtSub: decodedPatient?.sub,
      match: patient.userId === decodedPatient?.sub
    });

    // Create test admin user
    const adminEmail = generateTestEmail('admin-session');
    const adminPassword = 'AdminPassword123!';
    testEmails.push(adminEmail);

    const admin = await createTestUser(
      supabaseClient,
      adminEmail,
      adminPassword,
      'ADMIN',
      {
        fullName: 'Test Admin Session',
        phoneNumber: '0901234591',
        address: '456 Test Street, Hanoi, Vietnam',
        dateOfBirth: '1985-05-05',
        gender: 'female',
        citizenId: generateUniqueCitizenId()
      }
    );

    // Login to get access token
    const adminToken = await createSession(adminEmail, adminPassword);

    adminUser = {
      userId: admin.userId,
      email: adminEmail,
      password: adminPassword,
      accessToken: adminToken
    };
  }, 30000);

  afterAll(async () => {
    // Cleanup test users
    await cleanupTestUsers(supabaseClient, testEmails);

    // Cleanup app
    if (cleanup) {
      await cleanup();
    }
  }, 30000);

  describe('GET /:userId/sessions - List Active Sessions', () => {
    it('should list all active sessions for authenticated user', async () => {
      // Create additional session
      await createSession(patientUser.email, patientUser.password);

      // Get sessions via API
      const response = await request(app)
        .get(`/api/v1/users/${patientUser.userId}/sessions`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessions).toBeDefined();
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeGreaterThanOrEqual(2);
      expect(response.body.totalCount).toBeGreaterThanOrEqual(2);

      // Verify session structure
      const session = response.body.sessions[0];
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('deviceInfo');
      expect(session).toHaveProperty('ipAddress');
      expect(session).toHaveProperty('lastActivity');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('isCurrent');
      expect(session).toHaveProperty('expiresAt');
    });

    it('should mark current session correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${patientUser.userId}/sessions`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Find current session
      const currentSession = response.body.sessions.find((s: any) => s.isCurrent === true);
      expect(currentSession).toBeDefined();
    });

    it('should return empty array when user has no active sessions', async () => {
      // Create a new user without logging in
      const tempEmail = generateTestEmail('temp-no-session');
      const tempPassword = 'TempPassword123!';
      testEmails.push(tempEmail);

      const tempUser = await createTestUser(
        supabaseClient,
        tempEmail,
        tempPassword,
        'PATIENT',
        {
          fullName: 'Temp User No Session',
          phoneNumber: '0901234592',
          address: '789 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1995-01-01',
          gender: 'male',
          citizenId: generateUniqueCitizenId()
        }
      );

      // Login to get token
      const tempToken = await createSession(tempEmail, tempPassword);

      // Deactivate all sessions
      await supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', tempUser.userId);

      // Try to get sessions (should return empty)
      const response = await request(app)
        .get(`/api/v1/users/${tempUser.userId}/sessions`)
        .set('Authorization', `Bearer ${tempToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessions).toEqual([]);
      expect(response.body.totalCount).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${patientUser.userId}/sessions`);

      expect(response.status).toBe(401);
    });

    it('should return 403 when accessing other user\'s sessions (non-admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${adminUser.userId}/sessions`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to view any user\'s sessions', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${patientUser.userId}/sessions`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessions).toBeDefined();
    });
  });

  describe('DELETE /:userId/sessions/:sessionId - Terminate Specific Session', () => {
    it('should terminate specific session successfully', async () => {
      // Create two sessions
      await createSession(patientUser.email, patientUser.password);
      const session2Token = await createSession(patientUser.email, patientUser.password);

      // Get all sessions from DB
      const sessionsBeforeDelete = await getSessionsFromDb(patientUser.userId);
      expect(sessionsBeforeDelete.length).toBeGreaterThanOrEqual(2);

      // Get the first session ID
      const sessionToDelete = sessionsBeforeDelete[0];

      // Terminate the first session
      const response = await request(app)
        .delete(`/api/v1/users/${patientUser.userId}/sessions/${sessionToDelete.id}`)
        .set('Authorization', `Bearer ${session2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('terminated successfully');

      // Verify session is deactivated in DB
      const { data: deactivatedSession } = await supabaseClient
        .from('user_sessions')
        .select('*')
        .eq('id', sessionToDelete.id)
        .single();

      expect(deactivatedSession.is_active).toBe(false);
    });

    it('should return 404 when session not found', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/v1/users/${patientUser.userId}/sessions/${fakeSessionId}`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 403 when terminating other user\'s session (non-admin)', async () => {
      // Get admin's session
      const adminSessions = await getSessionsFromDb(adminUser.userId);
      expect(adminSessions.length).toBeGreaterThan(0);

      const adminSessionId = adminSessions[0].id;

      // Patient tries to terminate admin's session
      const response = await request(app)
        .delete(`/api/v1/users/${adminUser.userId}/sessions/${adminSessionId}`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to terminate any user\'s session', async () => {
      // Create a session for patient
      await createSession(patientUser.email, patientUser.password);

      // Get patient's sessions
      const patientSessions = await getSessionsFromDb(patientUser.userId);
      expect(patientSessions.length).toBeGreaterThan(0);

      const sessionToDelete = patientSessions[0];

      // Admin terminates patient's session
      const response = await request(app)
        .delete(`/api/v1/users/${patientUser.userId}/sessions/${sessionToDelete.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify session is deactivated
      const { data: deactivatedSession } = await supabaseClient
        .from('user_sessions')
        .select('*')
        .eq('id', sessionToDelete.id)
        .single();

      expect(deactivatedSession.is_active).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/v1/users/${patientUser.userId}/sessions/${fakeSessionId}`);

      expect(response.status).toBe(401);
    });

    it('should not allow terminating already inactive session', async () => {
      // Create a session
      await createSession(patientUser.email, patientUser.password);

      // Get the session from DB
      const sessions = await getSessionsFromDb(patientUser.userId);
      const sessionToDeactivate = sessions[0];

      // Deactivate it manually
      await supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionToDeactivate.id);

      // Try to terminate it again (use patientUser.accessToken instead of sessionToken)
      const response = await request(app)
        .delete(`/api/v1/users/${patientUser.userId}/sessions/${sessionToDeactivate.id}`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /:userId/sessions - Terminate All Sessions Except Current', () => {
    it('should terminate all sessions except current', async () => {
      // Create 3 sessions
      await createSession(patientUser.email, patientUser.password);
      await createSession(patientUser.email, patientUser.password);
      const session3Token = await createSession(patientUser.email, patientUser.password);

      // Get all sessions before termination
      const sessionsBeforeDelete = await getSessionsFromDb(patientUser.userId);
      expect(sessionsBeforeDelete.length).toBeGreaterThanOrEqual(3);

      // Terminate all sessions except current (using session3Token)
      const response = await request(app)
        .delete(`/api/v1/users/${patientUser.userId}/sessions`)
        .set('Authorization', `Bearer ${session3Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('terminated');
      expect(response.body.terminatedCount).toBeGreaterThanOrEqual(2);

      // Verify only current session remains active
      const sessionsAfterDelete = await getSessionsFromDb(patientUser.userId);
      expect(sessionsAfterDelete.length).toBe(1);

      // Verify the remaining session is the current one
      const { data: currentSessionData } = await supabaseClient
        .from('user_sessions')
        .select('*')
        .eq('session_token', session3Token)
        .single();

      expect(currentSessionData.is_active).toBe(true);
    });

    it('should return success even when user has only one session', async () => {
      // Create a new user with only one session
      const tempEmail = generateTestEmail('temp-one-session');
      const tempPassword = 'TempPassword123!';
      testEmails.push(tempEmail);

      const tempUser = await createTestUser(
        supabaseClient,
        tempEmail,
        tempPassword,
        'PATIENT',
        {
          fullName: 'Temp User One Session',
          phoneNumber: '0901234593',
          address: '789 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1995-01-01',
          gender: 'male',
          citizenId: generateUniqueCitizenId()
        }
      );

      // Login to create one session
      const tempToken = await createSession(tempEmail, tempPassword);

      // Terminate all sessions (should terminate 0 sessions)
      const response = await request(app)
        .delete(`/api/v1/users/${tempUser.userId}/sessions`)
        .set('Authorization', `Bearer ${tempToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.terminatedCount).toBe(0);

      // Verify the current session is still active
      const sessionsAfterDelete = await getSessionsFromDb(tempUser.userId);
      expect(sessionsAfterDelete.length).toBe(1);
    });

    it('should return success when user has no other sessions', async () => {
      // Create a new user
      const tempEmail = generateTestEmail('temp-no-other-session');
      const tempPassword = 'TempPassword123!';
      testEmails.push(tempEmail);

      const tempUser = await createTestUser(
        supabaseClient,
        tempEmail,
        tempPassword,
        'PATIENT',
        {
          fullName: 'Temp User No Other Session',
          phoneNumber: '0901234594',
          address: '789 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1995-01-01',
          gender: 'male',
          citizenId: generateUniqueCitizenId()
        }
      );

      // Login to create one session
      const tempToken = await createSession(tempEmail, tempPassword);

      // Terminate all sessions
      const response = await request(app)
        .delete(`/api/v1/users/${tempUser.userId}/sessions`)
        .set('Authorization', `Bearer ${tempToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.terminatedCount).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${patientUser.userId}/sessions`);

      expect(response.status).toBe(401);
    });

    it('should return 403 when terminating other user\'s sessions (non-admin)', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${adminUser.userId}/sessions`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to terminate all sessions for any user', async () => {
      // Create multiple sessions for patient
      await createSession(patientUser.email, patientUser.password);
      await createSession(patientUser.email, patientUser.password);

      // Get sessions before termination
      const sessionsBeforeDelete = await getSessionsFromDb(patientUser.userId);
      const sessionCountBefore = sessionsBeforeDelete.length;
      expect(sessionCountBefore).toBeGreaterThanOrEqual(2);

      // Admin terminates all patient's sessions
      const response = await request(app)
        .delete(`/api/v1/users/${patientUser.userId}/sessions`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.terminatedCount).toBeGreaterThanOrEqual(1);

      // Verify sessions are terminated
      const sessionsAfterDelete = await getSessionsFromDb(patientUser.userId);
      expect(sessionsAfterDelete.length).toBeLessThan(sessionCountBefore);
    });
  });
});

