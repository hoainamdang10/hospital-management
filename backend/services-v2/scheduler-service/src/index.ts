/**
 * Scheduler Service - Development Entry Point
 * 
 * This file provides a unified entry point for development mode.
 * In production, use specific component entry points:
 * - npm run start:api
 * - npm run start:materializer
 * - npm run start:worker
 * - npm run start:publisher
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const COMPONENT = process.env.COMPONENT || 'api';

console.log(`🚀 Starting Scheduler Service in development mode...`);
console.log(`📦 Component: ${COMPONENT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('');

// Dynamically import the appropriate component
async function start() {
  try {
    switch (COMPONENT.toLowerCase()) {
      case 'api':
        console.log('🔌 Starting API Server...');
        await import('./api');
        break;

      case 'materializer':
        console.log('⚙️  Starting Materializer Worker...');
        await import('./materializer');
        break;

      case 'worker':
        console.log('👷 Starting Execution Worker...');
        await import('./worker');
        break;

      case 'publisher':
        console.log('📤 Starting Outbox Publisher...');
        await import('./publisher');
        break;

      default:
        console.error(`❌ Unknown component: ${COMPONENT}`);
        console.error('Valid components: api, materializer, worker, publisher');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to start component:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the service
start();

