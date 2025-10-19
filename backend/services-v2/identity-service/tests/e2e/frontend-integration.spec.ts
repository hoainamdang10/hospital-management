import { test, expect } from '@playwright/test';

/**
 * Frontend Integration Tests
 * Test Identity Service endpoints that frontend will use
 * 
 * Prerequisites:
 * - Identity Service running on port 3021
 * - Test user exists in database: test-final@example.com / Test@123456
 */

test.describe('Frontend Integration - Identity Service', () => {
  const baseURL = 'http://localhost:3021';
  
  // Test user credentials (already exists in database)
  const testUser = {
    email: 'test-final@example.com',
    password: 'Test@123456'
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  test.describe('1. Health Check', () => {
    test('should return healthy status', async ({ request }) => {
      const response = await request.get(`${baseURL}/health`);
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      console.log('Health Check Response:', JSON.stringify(body, null, 2));
      
      expect(body.status).toBe('healthy');
      expect(body.service).toBe('identity-service');
    });
  });

  test.describe('2. Login Flow', () => {
    test('should successfully login with existing user', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/login`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          email: testUser.email,
          password: testUser.password
        }
      });

      console.log('Login Response Status:', response.status());
      
      const body = await response.json();
      console.log('Login Response Body:', JSON.stringify(body, null, 2));

      // Check response status
      expect(response.status()).toBe(200);
      
      // Check response structure
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
      
      // Store tokens for later tests
      accessToken = body.accessToken;
      refreshToken = body.refreshToken;
      userId = body.user.id;
      
      // Verify user data
      expect(body.user.email).toBe(testUser.email);
      expect(body.user).toHaveProperty('id');
      expect(body.user).toHaveProperty('fullName');
      
      console.log('✅ Login successful!');
      console.log('User ID:', userId);
      console.log('Access Token (first 50 chars):', accessToken.substring(0, 50) + '...');
    });

    test('should reject login with wrong password', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: testUser.email,
          password: 'WrongPassword123!'
        }
      });

      console.log('Wrong Password Response Status:', response.status());
      
      const body = await response.json();
      console.log('Wrong Password Response:', JSON.stringify(body, null, 2));

      expect(response.status()).toBe(401);
      expect(body.success).toBe(false);
    });

    test('should reject login with non-existent email', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: 'SomePassword123!'
        }
      });

      expect(response.status()).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('3. Protected Routes - Get User Info', () => {
    test('should get user info with valid token', async ({ request }) => {
      // First login to get token
      const loginResponse = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password
        }
      });
      
      const loginBody = await loginResponse.json();
      const token = loginBody.accessToken;

      // Get user info
      const response = await request.get(`${baseURL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Get User Info Response Status:', response.status());
      
      const body = await response.json();
      console.log('User Info Response:', JSON.stringify(body, null, 2));

      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
      expect(body.user).toHaveProperty('userId');
      expect(body.user).toHaveProperty('email');
      expect(body.user.email).toBe(testUser.email);
      
      console.log('✅ Successfully retrieved user info');
    });

    test('should reject request without token', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/users/me`);

      expect(response.status()).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('should reject request with invalid token', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/users/me`, {
        headers: {
          'Authorization': 'Bearer invalid-token-here'
        }
      });

      expect(response.status()).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('4. Token Refresh Flow', () => {
    test('should successfully refresh access token', async ({ request }) => {
      // First login to get refresh token
      const loginResponse = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password
        }
      });
      
      const loginBody = await loginResponse.json();
      const oldRefreshToken = loginBody.refreshToken;

      // Refresh token
      const response = await request.post(`${baseURL}/auth/refresh`, {
        data: {
          refreshToken: oldRefreshToken
        }
      });

      console.log('Token Refresh Response Status:', response.status());
      
      const body = await response.json();
      console.log('Token Refresh Response:', JSON.stringify(body, null, 2));

      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      
      // New tokens should be different from old ones
      expect(body.accessToken).not.toBe(loginBody.accessToken);
      
      console.log('✅ Token refreshed successfully');
    });

    test('should reject refresh with invalid token', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/refresh`, {
        data: {
          refreshToken: 'invalid-refresh-token'
        }
      });

      expect(response.status()).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('5. Logout Flow', () => {
    test('should successfully logout', async ({ request }) => {
      // First login
      const loginResponse = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password
        }
      });
      
      const loginBody = await loginResponse.json();
      const token = loginBody.accessToken;

      // Logout
      const response = await request.post(`${baseURL}/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Logout Response Status:', response.status());
      
      const body = await response.json();
      console.log('Logout Response:', JSON.stringify(body, null, 2));

      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
      
      console.log('✅ Logout successful');
    });

    test('should reject logout without token', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/logout`);

      expect(response.status()).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('6. Complete Authentication Flow', () => {
    test('should complete full login -> get user -> refresh -> logout flow', async ({ request }) => {
      console.log('\n🔄 Starting complete authentication flow...\n');

      // Step 1: Login
      console.log('Step 1: Login');
      const loginResponse = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password
        }
      });
      
      const loginBody = await loginResponse.json();
      expect(loginResponse.status()).toBe(200);
      expect(loginBody.success).toBe(true);
      console.log('✅ Login successful');

      const accessToken = loginBody.accessToken;
      const refreshToken = loginBody.refreshToken;

      // Step 2: Get user info
      console.log('\nStep 2: Get user info');
      const userInfoResponse = await request.get(`${baseURL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const userInfoBody = await userInfoResponse.json();
      expect(userInfoResponse.status()).toBe(200);
      expect(userInfoBody.success).toBe(true);
      console.log('✅ User info retrieved');

      // Step 3: Refresh token
      console.log('\nStep 3: Refresh token');
      const refreshResponse = await request.post(`${baseURL}/auth/refresh`, {
        data: {
          refreshToken: refreshToken
        }
      });
      
      const refreshBody = await refreshResponse.json();
      expect(refreshResponse.status()).toBe(200);
      expect(refreshBody.success).toBe(true);
      console.log('✅ Token refreshed');

      const newAccessToken = refreshBody.accessToken;

      // Step 4: Logout
      console.log('\nStep 4: Logout');
      const logoutResponse = await request.post(`${baseURL}/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${newAccessToken}`
        }
      });
      
      const logoutBody = await logoutResponse.json();
      expect(logoutResponse.status()).toBe(200);
      expect(logoutBody.success).toBe(true);
      console.log('✅ Logout successful');

      console.log('\n✅ Complete authentication flow finished successfully!\n');
    });
  });
});

