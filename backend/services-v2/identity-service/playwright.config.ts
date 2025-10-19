import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Identity Service E2E Tests
 * 
 * Tests the following flows:
 * - Authentication (login, logout, register, refresh token)
 * - User Management (CRUD operations)
 * - RBAC & Permissions (role-based access control)
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid race conditions
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for API testing
    baseURL: 'http://localhost:3021',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },

  // Test projects for different scenarios
  projects: [
    {
      name: 'api-tests',
      testMatch: /.*\.spec\.ts/,
    },
  ],

  // Web server configuration (optional - if you want Playwright to start the service)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3021/health',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});

