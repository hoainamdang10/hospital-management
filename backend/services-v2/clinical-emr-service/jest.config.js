/**
 * Jest Configuration for Clinical EMR Service
 * Comprehensive testing setup for unit and integration tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest Testing Standards, TypeScript Support, Vietnamese Healthcare
 */

const shouldCollectCoverage = process.env.COLLECT_COVERAGE !== 'false';

module.exports = {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  
  // Root directory
  rootDir: '.',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  
  // Module paths
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
  
  // File extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],

  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },
  
  // Coverage configuration
  collectCoverage: shouldCollectCoverage,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage thresholds for clinical EMR service
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
    '!src/server.ts',
    '!src/app.ts',
    '!src/app.example.ts'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Verbose output
  verbose: true,

  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    TZ: 'Asia/Ho_Chi_Minh' // Vietnamese timezone
  },
  
  // Reporters
  reporters: [
    'default'
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Watch mode configuration
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // Test categories - separate configuration for unit and integration tests
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
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
      maxWorkers: 1, // Run integration tests serially
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
  
  // Performance monitoring
  detectOpenHandles: true,
  detectLeaks: false,
  forceExit: false,
  
  // Bail configuration
  bail: 0,
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Silent mode
  silent: false,
  
  // Max workers
  maxWorkers: '75%',
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ]
};
