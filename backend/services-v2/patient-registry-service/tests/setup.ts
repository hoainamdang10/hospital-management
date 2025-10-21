/**
 * Jest Setup File
 * Global test configuration and mocks
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from service root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Don't mock uuid - let it work naturally
// The uuid package works fine with Jest and TypeScript

// Set timezone to UTC for consistent date testing
process.env.TZ = 'UTC';

// Increase test timeout for integration tests
jest.setTimeout(10000);

