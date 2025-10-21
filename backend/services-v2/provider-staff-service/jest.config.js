/**
 * Jest Configuration - Provider/Staff Service
 * V2 Clean Architecture + DDD Testing Configuration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Testing Best Practices
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  rootDir: '.',
  
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
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
  
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage thresholds temporarily disabled for initial test setup
  // Will be gradually increased as tests are implemented
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/**/index.ts',
    '!src/index.ts'
  ],
  
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  testTimeout: 10000,
  
  errorOnDeprecated: true,
  
  automock: false,
  unmockedModulePathPatterns: [
    '<rootDir>/node_modules/'
  ],
  
  detectOpenHandles: true,
  detectLeaks: false,
  forceExit: false,
  
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  maxWorkers: '50%',
  
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ]
};

