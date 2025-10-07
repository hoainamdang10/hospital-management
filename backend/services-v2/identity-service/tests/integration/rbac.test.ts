/**
 * RBAC Integration Tests
 * Tests for Role-Based Access Control middleware and permission system
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import request from 'supertest';
import express from 'express';
// Removed unused import: SupabaseAuthClient
import { PermissionService } from '../../src/infrastructure/services/PermissionService';
import { AuthenticationMiddleware } from '../../src/presentation/middleware/AuthenticationMiddleware';
import { PermissionMiddleware } from '../../src/presentation/middleware/PermissionMiddleware';
import { ResourceType, Action } from '../../src/application/services/IPermissionService';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn() // Add missing fatal method
};

// Mock permission repository (IPermissionRepository)
const mockPermissionRepository = {
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn(),
  getRolePermissions: jest.fn(),
  hasPermission: jest.fn(),
  hasPermissionString: jest.fn(),
  assignRole: jest.fn(),
  removeRole: jest.fn(),
  addUserPermission: jest.fn(),
  removeUserPermission: jest.fn(),
  getAllPermissions: jest.fn(),
  getAllRoles: jest.fn(),
  invalidateCache: jest.fn(),
  expandPermissions: jest.fn().mockResolvedValue([]) // Default: no expansion
};

// Mock auth client
const mockAuthClient = {
  verifyToken: jest.fn()
};

// Mock cache service
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  invalidate: jest.fn(),
  invalidateForRole: jest.fn()
} as any;

describe('RBAC Integration Tests', () => {
  let app: express.Application;
  let permissionService: PermissionService;
  let authMiddleware: AuthenticationMiddleware;
  let permissionMiddleware: PermissionMiddleware;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create services
    permissionService = new PermissionService(
      mockPermissionRepository as any,
      mockCacheService
    );

    authMiddleware = new AuthenticationMiddleware(
      mockAuthClient as any,
      permissionService,
      mockLogger
    );

    permissionMiddleware = new PermissionMiddleware(
      permissionService,
      mockLogger
    );

    // Create test app
    app = express();
    app.use(express.json());

    // Setup test routes
    setupTestRoutes();
  });

  function setupTestRoutes() {
    // Public endpoint
    app.get('/public', (_req, res) => {
      res.json({ message: 'Public endpoint' });
    });

    // Protected endpoint - requires authentication
    app.get('/protected',
      authMiddleware.authenticate(),
      (_req, res) => {
        res.json({ message: 'Protected endpoint' });
      }
    );

    // Admin only endpoint
    app.get('/admin',
      authMiddleware.authenticate(),
      permissionMiddleware.requireAdmin(),
      (_req, res) => {
        res.json({ message: 'Admin endpoint' });
      }
    );

    // Resource-based permission endpoint
    app.get('/patients',
      authMiddleware.authenticate(),
      permissionMiddleware.requireResource(ResourceType.PATIENTS, Action.READ),
      (_req, res) => {
        res.json({ message: 'Patients list' });
      }
    );

    // Ownership check endpoint
    app.get('/users/:userId',
      authMiddleware.authenticate(),
      permissionMiddleware.requirePermission({
        permissions: ['users:read', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req: any) => req.params.userId
      }),
      (req, res) => {
        res.json({ message: `User ${req.params.userId}` });
      }
    );
  }

  describe('Authentication Middleware', () => {
    it('should allow access to public endpoints without token', async () => {
      const response = await request(app)
        .get('/public')
        .expect(200);

      expect(response.body.message).toBe('Public endpoint');
    });

    it('should reject protected endpoints without token', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject invalid token', async () => {
      mockAuthClient.verifyToken.mockResolvedValue(null);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should allow access with valid token', async () => {
      mockAuthClient.verifyToken.mockResolvedValue({
        id: 'user-123',
        email: 'test@hospital.vn',
        user_metadata: { roles: ['patient'] }
      });

      mockPermissionRepository.getUserPermissions.mockResolvedValue(['own_data:read']);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Protected endpoint');
    });
  });

  describe('Permission Middleware', () => {
    beforeEach(() => {
      // Mock valid authentication
      mockAuthClient.verifyToken.mockResolvedValue({
        id: 'user-123',
        email: 'test@hospital.vn',
        user_metadata: { roles: ['patient'] }
      });
    });

    it('should allow admin access to admin endpoint', async () => {
      mockPermissionRepository.getUserPermissions.mockResolvedValue(['*']);

      const response = await request(app)
        .get('/admin')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.message).toBe('Admin endpoint');
    });

    it('should deny non-admin access to admin endpoint', async () => {
      mockPermissionRepository.getUserPermissions.mockResolvedValue(['patients:read']);

      const response = await request(app)
        .get('/admin')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should allow access with specific permission', async () => {
      mockPermissionRepository.getUserPermissions.mockResolvedValue(['patients:read']);

      const response = await request(app)
        .get('/patients')
        .set('Authorization', 'Bearer doctor-token')
        .expect(200);

      expect(response.body.message).toBe('Patients list');
    });

    it('should deny access without required permission', async () => {
      mockPermissionRepository.getUserPermissions.mockResolvedValue(['appointments:read']);

      const response = await request(app)
        .get('/patients')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should allow user to access their own resource', async () => {
      mockAuthClient.verifyToken.mockResolvedValue({
        id: 'user-123',
        email: 'test@hospital.vn',
        user_metadata: { roles: ['patient'] }
      });

      mockPermissionRepository.getUserPermissions.mockResolvedValue(['users:read']);

      const response = await request(app)
        .get('/users/user-123')
        .set('Authorization', 'Bearer user-token')
        .expect(200);

      expect(response.body.message).toBe('User user-123');
    });

    it('should deny user access to other users resource', async () => {
      mockAuthClient.verifyToken.mockResolvedValue({
        id: 'user-123',
        email: 'test@hospital.vn',
        user_metadata: { roles: ['patient'] }
      });

      mockPermissionRepository.getUserPermissions.mockResolvedValue(['users:read']);

      const response = await request(app)
        .get('/users/user-456')
        .set('Authorization', 'Bearer user-token')
        .expect(403);

      expect(response.body.message).toBe('You can only access your own resources');
    });

    it('should allow admin to access any user resource', async () => {
      mockAuthClient.verifyToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@hospital.vn',
        user_metadata: { roles: ['admin'] }
      });

      mockPermissionRepository.getUserPermissions.mockResolvedValue(['*']);

      const response = await request(app)
        .get('/users/user-456')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.message).toBe('User user-456');
    });
  });

  describe('Permission Matching', () => {
    beforeEach(() => {
      mockAuthClient.verifyToken.mockResolvedValue({
        id: 'user-123',
        email: 'test@hospital.vn',
        user_metadata: { roles: ['doctor'] }
      });
    });

    it('should match wildcard permission', async () => {
      mockPermissionRepository.getUserPermissions.mockResolvedValue(['*']);

      const response = await request(app)
        .get('/patients')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(response.body.message).toBe('Patients list');
    });

    it('should match resource wildcard', async () => {
      mockPermissionRepository.getUserPermissions.mockResolvedValue(['patients:*']);

      const response = await request(app)
        .get('/patients')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(response.body.message).toBe('Patients list');
    });
  });
});

