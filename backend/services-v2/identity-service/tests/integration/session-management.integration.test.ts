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
import { createTestSupabaseClient } from '../helpers/integrationHelpers';
import { TestUserPool } from '../helpers/test-user-pool';
import { testUserPoolCache } from '../helpers/test-user-pool-cache';

describe('Session Management Integration Tests', () => {
  let app: Application;
  let supabaseClient: SupabaseClient;
  let cleanup: () => Promise<void>;
  let userPool: TestUserPool;

  // Helper to create a session by logging in
  const createSession = async (email: string, password: string): Promise<string> => {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const response = await request(app)
      .post('/auth/login')
      .send({ email, password });

    if (!response.body.accessToken) {
      throw new Error(`Failed to create session: ${response.status} - ${response.body.message || 'No access token returned'}`);
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

    // Get cached test user pool (seeds once, reuses for all tests)
    userPool = await testUserPoolCache.getPool(supabaseClient);
    
    console.log(' Test setup complete with user pool');
  }, 120000);

  afterAll(async () => {
    // Note: User pool is cached and will be cleaned up in global teardown

    // Cleanup app
    if (cleanup) {
      await cleanup();
    }
  }, 30000);

  describe('GET /:userId/sessions - List Active Sessions', () => {
    it('should list all active sessions for authenticated user', async () => {
      // Create additional session
      await createSession(userPool.patient.email, userPool.patient.password);
      const authToken = await createSession(userPool.patient.email, userPool.patient.password);

      // Get sessions via API
      const response = await request(app)
        .get(`/api/v1/users/${userPool.patient.userId}/sessions`)
        .set('Authorization', `Bearer ${authToken}`);

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
      const authToken = await createSession(userPool.patient.email, userPool.patient.password);

      const response = await request(app)
        .get(`/api/v1/users/${userPool.patient.userId}/sessions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Find current session
      const currentSession = response.body.sessions.find((s: any) => s.isCurrent === true);
      expect(currentSession).toBeDefined();
    });

    it('should return empty array when user has no active sessions', async () => {
      // Deactivate all sessions for patient2
      await supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userPool.patient2.userId);

      // Create one session to get token
      const tempToken = await createSession(userPool.patient2.email, userPool.patient2.password);

      // Deactivate that session too
      await supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userPool.patient2.userId);

      // Try to get sessions (should return empty)
      const response = await request(app)
        .get(`/api/v1/users/${userPool.patient2.userId}/sessions`)
        .set('Authorization', `Bearer ${tempToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessions).toEqual([]);
      expect(response.body.totalCount).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userPool.patient.userId}/sessions`);

      expect(response.status).toBe(401);
    });

    it('should return 403 when accessing other user\'s sessions (non-admin)', async () => {
      const patientToken = await createSession(userPool.patient.email, userPool.patient.password);

      const response = await request(app)
        .get(`/api/v1/users/${userPool.admin.userId}/sessions`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to view any user\'s sessions', async () => {
      const adminToken = await createSession(userPool.admin.email, userPool.admin.password);

      const response = await request(app)
        .get(`/api/v1/users/${userPool.patient.userId}/sessions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessions).toBeDefined();
    });
  });

  describe('DELETE /:userId/sessions/:sessionId - Terminate Specific Session', () => {
    it('should terminate specific session successfully', async () => {
      // Create two sessions with delay between them
      await createSession(userPool.patient.email, userPool.patient.password);
      await new Promise(resolve => setTimeout(resolve, 300)); // Extra delay between sessions
      const session2Token = await createSession(userPool.patient.email, userPool.patient.password);

      // Get all sessions from DB
      const sessionsBeforeDelete = await getSessionsFromDb(userPool.patient.userId);
      expect(sessionsBeforeDelete.length).toBeGreaterThanOrEqual(2);

      // Get the first session ID
      const sessionToDelete = sessionsBeforeDelete[0];

      // Terminate the first session
      const response = await request(app)
        .delete(`/api/v1/users/${userPool.patient.userId}/sessions/${sessionToDelete.id}`)
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

      expect(deactivatedSession?.is_active).toBe(false);
    });

    it('should return 404 when session not found', async () => {
      const nonExistentSessionId = '00000000-0000-0000-0000-000000000000';
      const patientToken = await createSession(userPool.patient.email, userPool.patient.password);

      const response = await request(app)
        .delete(`/api/v1/users/${userPool.patient.userId}/sessions/${nonExistentSessionId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${userPool.patient.userId}/sessions/some-session-id`);

      expect(response.status).toBe(401);
    });

    it('should return 403 when trying to terminate another user\'s session', async () => {
      // Get admin's session
      const adminSessions = await getSessionsFromDb(userPool.admin.userId);
      expect(adminSessions.length).toBeGreaterThan(0);

      const adminSessionId = adminSessions[0].id;

      // Try to terminate admin's session as patient
      const patientToken = await createSession(userPool.patient.email, userPool.patient.password);

      const response = await request(app)
        .delete(`/api/v1/users/${userPool.admin.userId}/sessions/${adminSessionId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to terminate any user\'s session', async () => {
      // Create a session for patient
      await createSession(userPool.patient.email, userPool.patient.password);
      const adminToken = await createSession(userPool.admin.email, userPool.admin.password);

      // Get patient's sessions
      const patientSessions = await getSessionsFromDb(userPool.patient.userId);
      expect(patientSessions.length).toBeGreaterThan(0);

      const patientSessionId = patientSessions[0].id;

      // Admin terminates patient's session
      const response = await request(app)
        .delete(`/api/v1/users/${userPool.patient.userId}/sessions/${patientSessionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle invalid session ID format', async () => {
      const patientToken = await createSession(userPool.patient.email, userPool.patient.password);

      const response = await request(app)
        .delete(`/api/v1/users/${userPool.patient.userId}/sessions/invalid-uuid-format`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /:userId/sessions - Terminate All Sessions Except Current', () => {
    it('should terminate all sessions except current', async () => {
      // Create multiple sessions
      await createSession(userPool.patient.email, userPool.patient.password);
      await new Promise(resolve => setTimeout(resolve, 300));
      await createSession(userPool.patient.email, userPool.patient.password);
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentToken = await createSession(userPool.patient.email, userPool.patient.password);

      // Get current session count
      const sessionsBeforeDelete = await getSessionsFromDb(userPool.patient.userId);
      const sessionCountBefore = sessionsBeforeDelete.length;
      expect(sessionCountBefore).toBeGreaterThanOrEqual(3);

      // Terminate all sessions except current
      const response = await request(app)
        .delete(`/api/v1/users/${userPool.patient.userId}/sessions`)
        .set('Authorization', `Bearer ${currentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully terminated');
      expect(response.body.terminatedCount).toBeGreaterThanOrEqual(2);

      // Verify only one session remains (current)
      const sessionsAfterDelete = await getSessionsFromDb(userPool.patient.userId);
      expect(sessionsAfterDelete.length).toBe(1);
    });

    it('should return 200 even when no other sessions exist', async () => {
      // Deactivate all sessions for patient2
      await supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userPool.patient2.userId);

      const sessionsAfterCleanup = await getSessionsFromDb(userPool.patient2.userId);
      expect(sessionsAfterCleanup.length).toBe(0);

      // Create one session
      const token = await createSession(userPool.patient2.email, userPool.patient2.password);
      const activeBefore = await getSessionsFromDb(userPool.patient2.userId);
      expect(activeBefore.length).toBe(1);

      // Try to terminate other sessions (there are none)
      const response = await request(app)
        .delete(`/api/v1/users/${userPool.patient2.userId}/sessions`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
                        expect(response.body.terminatedCount).toBe(activeBefore.length - 1);

      const activeAfter = await getSessionsFromDb(userPool.patient2.userId);
      expect(activeAfter.length).toBe(1);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${userPool.patient.userId}/sessions`);

      expect(response.status).toBe(401);
    });

    it('should return 403 when trying to terminate another user\'s sessions', async () => {
      const patientToken = await createSession(userPool.patient.email, userPool.patient.password);

      const response = await request(app)
        .delete(`/api/v1/users/${userPool.admin.userId}/sessions`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to terminate all sessions for any user', async () => {
      // Create multiple sessions for patient
      await createSession(userPool.patient.email, userPool.patient.password);
      await new Promise(resolve => setTimeout(resolve, 300));
      await createSession(userPool.patient.email, userPool.patient.password);
      const adminToken = await createSession(userPool.admin.email, userPool.admin.password);

      const sessionsBeforeDelete = await getSessionsFromDb(userPool.patient.userId);
      expect(sessionsBeforeDelete.length).toBeGreaterThanOrEqual(2);

      // Admin terminates all sessions for patient (no current session preserved since admin is making the request)
      const response = await request(app)
        .delete(`/api/v1/users/${userPool.patient.userId}/sessions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.terminatedCount).toBeGreaterThan(0);
    });

    it('should only affect the specified user\'s sessions', async () => {
      // Create sessions for both users
      await createSession(userPool.patient.email, userPool.patient.password);
      const patient2Token = await createSession(userPool.patient2.email, userPool.patient2.password);

      const patient1SessionsBefore = await getSessionsFromDb(userPool.patient.userId);

      // Patient2 terminates their sessions
      await request(app)
        .delete(`/api/v1/users/${userPool.patient2.userId}/sessions`)
        .set('Authorization', `Bearer ${patient2Token}`);

      // Verify patient1's sessions are unchanged
      const patient1SessionsAfter = await getSessionsFromDb(userPool.patient.userId);
      expect(patient1SessionsAfter.length).toBe(patient1SessionsBefore.length);
    });
  });
});
