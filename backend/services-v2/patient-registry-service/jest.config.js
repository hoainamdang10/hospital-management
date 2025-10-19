/**
 * Main Jest Configuration
 * Patient Registry Service - Matches Identity Service Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Transform uuid module
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],

  // Coverage configuration
  collectCoverage: false, // Disabled for faster testing
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/domain/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/application/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/**/index.ts',
    '!src/main.ts',
    '!src/server.ts'
  ],

  // Verbose output for better debugging
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Test categories - separate configuration for unit and integration tests
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      timeout: 5000,
      maxWorkers: '100%',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@domain/(.*)$': '<rootDir>/src/domain/$1',
        '^@application/(.*)$': '<rootDir>/src/application/$1',
        '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
        '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/$1',
        '^uuid$': require.resolve('uuid')
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.json'
        }]
      }
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      timeout: 30000,
      maxWorkers: 1, // Run integration tests serially to avoid race conditions
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@domain/(.*)$': '<rootDir>/src/domain/$1',
        '^@application/(.*)$': '<rootDir>/src/application/$1',
        '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
        '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/$1',
        '^uuid$': require.resolve('uuid')
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.json'
        }]
      }
    }
  ],

  // Mock configuration
  automock: false,
  unmockedModulePathPatterns: [
    '<rootDir>/node_modules/'
  ],

  // Performance monitoring (enabled to detect resource leaks)
  detectOpenHandles: true,
  detectLeaks: false,
  forceExit: false,

  // Bail configuration
  bail: 0, // Don't bail on first failure

  // Cache configuration (enabled for faster subsequent runs)
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Silent mode (disabled to see console.log)
  silent: false,

  // Max workers (optimized at 75% for best performance)
  maxWorkers: '75%'
};
