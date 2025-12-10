import { config } from 'dotenv';
import path from 'path';

// Load test environment
config({ path: path.resolve(__dirname, '../.env.test') });

// Fallback to .env if .env.test doesn't exist
if (!process.env.SUPABASE_URL) {
  config({ path: path.resolve(__dirname, '../.env') });
}

// Set test environment
process.env.NODE_ENV = 'test';

// Extend Jest timeout for integration tests
// Integration tests with Supabase/Redis/RabbitMQ may take longer
jest.setTimeout(120000); // 120 seconds (2 minutes)

// Global test setup
beforeAll(async () => {
  console.log(' Starting test suite...');
  console.log(` Environment: ${process.env.NODE_ENV}`);
  console.log(`️  Database: ${process.env.SUPABASE_URL}`);
});

afterAll(async () => {
  console.log(' Test suite completed');
  
  // Give time for async cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
