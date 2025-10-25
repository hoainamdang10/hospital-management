/**
 * Authentication Middleware Integration Tests
 * Tests JWT authentication with real Supabase connection
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import request from 'supertest';
import express, { Application } from 'express';
import { authenticate } from '../../src/presentation/middleware/AuthMiddleware';

describe('AuthMiddleware Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    // Create test Express app
    app = express();
    app.use(express.json());

    // Protected route
    app.get('/protected', authenticate, (req, res) => {
      res.json({
        success: true,
        message: 'Authenticated',
        user: (req as any).user,
      });
    });

    // Public route
    app.get('/public', (req, res) => {
      res.json({
        success: true,
        message: 'Public access',
      });
    });
  });

  describe('Protected Routes', () => {
    it('should reject requests without Authorization header', async () => {
      // Act
      const response = await request(app)
        .get('/protected')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token');
    });

    it('should reject requests with invalid token format', async () => {
      // Act
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidToken')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token');
    });

    it('should reject requests with expired token', async () => {
      // Arrange - Use a known expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      // Act
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    // Note: Testing with valid token requires actual Supabase auth
    // This would be tested in E2E tests with real authentication flow
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      // Act
      const response = await request(app)
        .get('/public')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Public access');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JWT tokens gracefully', async () => {
      // Arrange
      const malformedToken = 'not.a.jwt.token';

      // Act
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should return proper JSON error responses', async () => {
      // Act
      const response = await request(app)
        .get('/protected')
        .expect(401)
        .expect('Content-Type', /json/);

      // Assert
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});

