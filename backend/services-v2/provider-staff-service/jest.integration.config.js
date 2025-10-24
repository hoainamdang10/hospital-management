/**
 * Jest Integration Test Configuration - Provider/Staff Service
 * V2 Clean Architecture + DDD Integration Testing Configuration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Testing Best Practices
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  rootDir: '.',
  
  // Only run integration tests
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.spec.ts'
  ],
  
  // Ignore unit tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/unit/'
  ],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // TypeScript configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },

  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage/integration',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
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
  resetMocks: true,
  
  // Longer timeout for integration tests
  testTimeout: 30000,
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ]
};

