/**
 * Jest Configuration for Scheduling Service
 * V2 Clean Architecture + DDD Implementation
 * Vietnamese Healthcare Compliance Testing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

require('dotenv').config();

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  rootDir: '.',

  testMatch: [
    '<rootDir>/src/test/**/*.test.ts',
    '<rootDir>/src/test/**/*.spec.ts'
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@tests/(.*)$': '<rootDir>/src/test/$1',
    '^uuid$': require.resolve('uuid')
  },

  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],

  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },

  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/index.ts',
    '!src/app.ts'
  ],

  testTimeout: 120000, // 120 seconds for integration tests with external services
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  errorOnDeprecated: true,

  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],

  maxWorkers: '50%',
  cacheDirectory: '<rootDir>/.jest-cache',

  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],

  // Performance monitoring
  detectOpenHandles: false, // Disable to avoid warnings in integration tests
  detectLeaks: false,
  forceExit: true // Force exit after tests complete
};
