/**
 * Environment Loader
 * Loads appropriate .env file based on NODE_ENV or specified environment
 * 
 * @usage
 * import './shared/config/env-loader'; // At top of main.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * Load environment variables from appropriate .env file
 * Priority:
 * 1. .env.local (for local development)
 * 2. .env.docker (for Docker)
 * 3. .env (fallback)
 */
export function loadEnvFile(): void {
  const cwd = process.cwd();
  
  // Determine which env file to use
  let envFile = '.env';
  
  // Check for explicit env file from command line (--env-file flag)
  const envFileArg = process.argv.find(arg => arg.startsWith('--env-file='));
  if (envFileArg) {
    envFile = envFileArg.split('=')[1];
    console.log(` Using specified env file: ${envFile}`);
  } 
  // Check if running in Docker (via NODE_ENV or Docker-specific indicator)
  else if (process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production') {
    const dockerEnvPath = path.resolve(cwd, '.env.docker');
    if (fs.existsSync(dockerEnvPath)) {
      envFile = '.env.docker';
      console.log(' Running in Docker mode - Loading .env.docker');
    }
  }
  // Check for local development
  else {
    const localEnvPath = path.resolve(cwd, '.env.local');
    if (fs.existsSync(localEnvPath)) {
      envFile = '.env.local';
      console.log(' Running in Local mode - Loading .env.local');
    }
  }
  
  // Load the selected env file
  const envPath = path.resolve(cwd, envFile);
  
  if (!fs.existsSync(envPath)) {
    console.warn(`  Warning: ${envFile} not found at ${envPath}`);
    console.warn('  Falling back to process environment variables');
    return;
  }
  
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.error(` Error loading ${envFile}:`, result.error);
    throw result.error;
  }
  
  console.log(` Successfully loaded environment from: ${envFile}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   PORT: ${process.env.PORT || 'not set'}`);
  console.log(`   SERVICE_NAME: ${process.env.SERVICE_NAME || 'not set'}`);
}

// Auto-load when imported
loadEnvFile();
