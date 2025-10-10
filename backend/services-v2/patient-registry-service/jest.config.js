/**
 * Main Jest Configuration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Only match unit tests by default
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/unit/**/*.spec.ts'
  ],
  
  // Ignore integration tests by default
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/integration/'
  ],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1'
  },
  
  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true
      }
    }
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/main.ts',
    '!src/**/index.ts'
  ],
  
  coverageDirectory: 'coverage',
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Verbose output for better debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Test timeout
  testTimeout: 10000
};
