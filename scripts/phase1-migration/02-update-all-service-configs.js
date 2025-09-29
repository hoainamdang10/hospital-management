#!/usr/bin/env node

/**
 * Automated Service Configuration Update Script
 * Updates all microservice database configurations to use correct schemas
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Zero-downtime deployment, Backward compatibility
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Service to schema mapping
const SERVICE_SCHEMA_MAPPING = {
  'auth-service': 'auth_schema',
  'doctor-service': 'doctor_schema',
  'patient-service': 'patient_schema',
  'appointment-service': 'appointment_schema',
  'medical-records-service': 'medical_records_schema',
  'payment-service': 'payment_schema',
  'file-service': 'file_schema',
  'receptionist-service': 'auth_schema', // Shared with auth
  'department-service': 'auth_schema',   // Shared with auth
  'notification-service': 'file_schema'  // Shared with file
};

// Configuration file patterns for each service
const CONFIG_FILE_PATTERNS = {
  'auth-service': ['src/config/supabase.ts'],
  'doctor-service': ['src/config/database.config.ts'],
  'patient-service': ['src/config/database.config.ts'],
  'appointment-service': ['src/config/database.config.ts'],
  'medical-records-service': ['src/config/database.config.ts'],
  'payment-service': ['src/config/database.config.ts'],
  'file-service': ['src/config/database.config.ts'],
  'receptionist-service': ['src/config/database.config.ts'],
  'department-service': ['src/config/database.config.ts'],
  'notification-service': ['src/config/database.config.ts']
};

class ServiceConfigUpdater {
  constructor() {
    this.backupDir = path.join(__dirname, 'config-backups');
    this.logFile = path.join(__dirname, 'config-update.log');
    this.errors = [];
    this.successes = [];
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async updateAllServices() {
    this.log('🚀 Starting automated service configuration update...');
    this.log(`📋 Services to update: ${Object.keys(SERVICE_SCHEMA_MAPPING).length}`);

    for (const [serviceName, schemaName] of Object.entries(SERVICE_SCHEMA_MAPPING)) {
      try {
        await this.updateServiceConfig(serviceName, schemaName);
        this.successes.push(serviceName);
      } catch (error) {
        this.log(`❌ Failed to update ${serviceName}: ${error.message}`);
        this.errors.push({ service: serviceName, error: error.message });
      }
    }

    this.generateReport();
  }

  async updateServiceConfig(serviceName, schemaName) {
    this.log(`🔄 Updating ${serviceName} to use ${schemaName}...`);

    const servicePath = path.join(__dirname, '../../backend/services', serviceName);
    
    if (!fs.existsSync(servicePath)) {
      throw new Error(`Service directory not found: ${servicePath}`);
    }

    const configFiles = CONFIG_FILE_PATTERNS[serviceName] || [];
    
    for (const configFile of configFiles) {
      const configPath = path.join(servicePath, configFile);
      
      if (!fs.existsSync(configPath)) {
        this.log(`⚠️  Config file not found: ${configPath}, creating new one...`);
        await this.createNewConfigFile(serviceName, schemaName, configPath);
        continue;
      }

      // Backup original file
      await this.backupConfigFile(serviceName, configPath);
      
      // Update the configuration
      await this.updateConfigFile(serviceName, schemaName, configPath);
    }

    this.log(`✅ Successfully updated ${serviceName}`);
  }

  async backupConfigFile(serviceName, configPath) {
    const backupPath = path.join(
      this.backupDir, 
      `${serviceName}-${path.basename(configPath)}.backup`
    );
    
    fs.copyFileSync(configPath, backupPath);
    this.log(`📁 Backed up ${configPath} to ${backupPath}`);
  }

  async updateConfigFile(serviceName, schemaName, configPath) {
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Add imports if not present
    if (!content.includes('getSchemaForService')) {
      const importLine = `import { getSchemaForService } from "@hospital/shared/dist/config/schema-mapping";\n`;
      const importIndex = content.indexOf('import');
      if (importIndex !== -1) {
        const firstImportEnd = content.indexOf('\n', importIndex);
        content = content.slice(0, firstImportEnd + 1) + importLine + content.slice(firstImportEnd + 1);
      }
    }

    if (!content.includes('getConnectionPool')) {
      const importLine = `import { getConnectionPool } from "@hospital/shared/dist/database/schema-aware-connection-pool";\n`;
      const importIndex = content.indexOf('import');
      if (importIndex !== -1) {
        const firstImportEnd = content.indexOf('\n', importIndex);
        content = content.slice(0, firstImportEnd + 1) + importLine + content.slice(firstImportEnd + 1);
      }
    }

    // Add service configuration
    if (!content.includes('SERVICE_NAME')) {
      const serviceConfigLines = [
        `\n// Service configuration`,
        `const SERVICE_NAME = '${serviceName}';`,
        `const SCHEMA_NAME = getSchemaForService(SERVICE_NAME);\n`
      ].join('\n');
      
      // Insert after imports
      const lastImportIndex = content.lastIndexOf('import');
      const lastImportEnd = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, lastImportEnd + 1) + serviceConfigLines + content.slice(lastImportEnd + 1);
    }

    // Replace schema: "public" with schema: SCHEMA_NAME
    content = content.replace(
      /schema:\s*["']public["']/g,
      `schema: SCHEMA_NAME // ✅ FIXED: Now uses ${schemaName}`
    );

    // Add schema-aware connection methods
    if (!content.includes('getSchemaAwareConnection')) {
      const connectionMethods = `
/**
 * Get a schema-aware connection from the pool
 */
export async function getSchemaAwareConnection(): Promise<SupabaseClient> {
  const connectionPool = getConnectionPool();
  return connectionPool.getConnection(SERVICE_NAME);
}

/**
 * Execute query with FHIR validation for healthcare compliance
 */
export async function executeFHIRQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const connectionPool = getConnectionPool();
  return connectionPool.executeFHIRValidation(SERVICE_NAME, queryFn);
}
`;
      content += connectionMethods;
    }

    fs.writeFileSync(configPath, content);
    this.log(`📝 Updated configuration in ${configPath}`);
  }

  async createNewConfigFile(serviceName, schemaName, configPath) {
    const template = `import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getConnectionPool } from "@hospital/shared/dist/database/schema-aware-connection-pool";
import { getSchemaForService } from "@hospital/shared/dist/config/schema-mapping";
import logger from "@hospital/shared/dist/utils/logger";

// Service configuration
const SERVICE_NAME = '${serviceName}';
const SCHEMA_NAME = getSchemaForService(SERVICE_NAME);

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Schema-aware Supabase client
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: SCHEMA_NAME, // ✅ FIXED: Now uses ${schemaName}
    },
    global: {
      headers: {
        'X-Service-Name': SERVICE_NAME,
        'X-Schema-Name': SCHEMA_NAME,
        'X-Service-Version': '2.0.0'
      }
    }
  }
);

/**
 * Get a schema-aware connection from the pool
 */
export async function getSchemaAwareConnection(): Promise<SupabaseClient> {
  const connectionPool = getConnectionPool();
  return connectionPool.getConnection(SERVICE_NAME);
}

/**
 * Execute query with FHIR validation for healthcare compliance
 */
export async function executeFHIRQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const connectionPool = getConnectionPool();
  return connectionPool.executeFHIRValidation(SERVICE_NAME, queryFn);
}

/**
 * Test database connection with schema validation
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await getSchemaAwareConnection();
    // Test with a simple query appropriate for the service
    const { error } = await client.from('${this.getTestTable(serviceName)}').select('count(*)').limit(1);
    
    if (error) {
      logger.error("Database connection test failed", { 
        error, 
        service: SERVICE_NAME,
        schema: SCHEMA_NAME 
      });
      return false;
    }

    logger.info("✅ Database connection test successful", {
      service: SERVICE_NAME,
      schema: SCHEMA_NAME,
      connectionType: "schema-aware-pool"
    });
    return true;
  } catch (error) {
    logger.error("❌ Database connection test failed", { 
      error, 
      service: SERVICE_NAME,
      schema: SCHEMA_NAME 
    });
    return false;
  }
}

export default {
  admin: supabaseAdmin,
  getConnection: getSchemaAwareConnection,
  executeFHIRQuery,
  testConnection: testDatabaseConnection
};
`;

    // Ensure directory exists
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(configPath, template);
    this.log(`📄 Created new config file: ${configPath}`);
  }

  getTestTable(serviceName) {
    const testTables = {
      'auth-service': 'profiles',
      'doctor-service': 'doctor_profiles',
      'patient-service': 'patient_profiles',
      'appointment-service': 'appointments',
      'medical-records-service': 'medical_records',
      'payment-service': 'payments',
      'file-service': 'documents',
      'receptionist-service': 'profiles',
      'department-service': 'departments',
      'notification-service': 'notifications'
    };
    return testTables[serviceName] || 'profiles';
  }

  generateReport() {
    this.log('\n📊 CONFIGURATION UPDATE REPORT');
    this.log('================================');
    this.log(`✅ Successfully updated: ${this.successes.length} services`);
    this.log(`❌ Failed updates: ${this.errors.length} services`);
    
    if (this.successes.length > 0) {
      this.log('\n✅ Successful updates:');
      this.successes.forEach(service => {
        this.log(`   - ${service}`);
      });
    }
    
    if (this.errors.length > 0) {
      this.log('\n❌ Failed updates:');
      this.errors.forEach(({ service, error }) => {
        this.log(`   - ${service}: ${error}`);
      });
    }

    this.log('\n🔄 Next Steps:');
    this.log('1. Review updated configuration files');
    this.log('2. Run TypeScript compilation check');
    this.log('3. Restart all microservices');
    this.log('4. Run post-migration validation');
    this.log(`\n📁 Backup files saved to: ${this.backupDir}`);
    this.log(`📄 Full log saved to: ${this.logFile}`);
  }

  async rollback() {
    this.log('🔄 Starting configuration rollback...');
    
    const backupFiles = fs.readdirSync(this.backupDir);
    
    for (const backupFile of backupFiles) {
      if (!backupFile.endsWith('.backup')) continue;
      
      const [serviceName, configFileName] = backupFile.replace('.backup', '').split('-');
      const originalPath = path.join(
        __dirname, 
        '../../backend/services', 
        serviceName, 
        CONFIG_FILE_PATTERNS[serviceName]?.[0] || 'src/config/database.config.ts'
      );
      const backupPath = path.join(this.backupDir, backupFile);
      
      if (fs.existsSync(originalPath)) {
        fs.copyFileSync(backupPath, originalPath);
        this.log(`↩️  Restored ${serviceName} configuration from backup`);
      }
    }
    
    this.log('✅ Rollback completed');
  }
}

// Main execution
async function main() {
  const updater = new ServiceConfigUpdater();
  
  const command = process.argv[2];
  
  if (command === 'rollback') {
    await updater.rollback();
  } else {
    await updater.updateAllServices();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = ServiceConfigUpdater;
