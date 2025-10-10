/**
 * Jest Configuration for Integration Tests
 * 
 * Tests authentication, authorization, and service-to-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  
  // Test file patterns
  testMatch: [
    '**/tests/integration/**/*.test.ts',
    '**/tests/integration/**/*.integration.test.ts'
  ],
  
  // Override ignore patterns for integration tests
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  
  // Timeout for integration tests (longer than unit tests)
  testTimeout: 30000,
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/main.ts'
  ],
  
  coverageDirectory: 'coverage/integration',
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results/integration',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],
  
  // Verbose output
  verbose: true,
  
  // Detect open handles (useful for debugging)
  detectOpenHandles: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Reset mocks between tests
  resetMocks: true
};

