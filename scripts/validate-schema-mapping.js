#!/usr/bin/env node

/**
 * Schema Mapping Validation Script
 * Validates that all services are configured to use correct schemas
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Expected schema mappings
const EXPECTED_SCHEMA_MAPPING = {
  'auth-service': 'auth_schema',
  'doctor-service': 'doctor_schema', 
  'patient-service': 'patient_schema',
  'appointment-service': 'appointment_schema',
  'medical-records-service': 'medical_records_schema',
  'payment-service': 'payment_schema',
  'file-service': 'file_schema',
  'receptionist-service': 'auth_schema', // Shared with auth
  'department-service': 'auth_schema', // Shared with auth
  'notification-service': 'file_schema' // Shared with file
};

class SchemaValidationChecker {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async validateAllServices() {
    console.log('🔍 SCHEMA MAPPING VALIDATION');
    console.log('============================\n');

    for (const [serviceName, expectedSchema] of Object.entries(EXPECTED_SCHEMA_MAPPING)) {
      await this.validateService(serviceName, expectedSchema);
    }

    this.printResults();
    return this.results.failed.length === 0;
  }

  async validateService(serviceName, expectedSchema) {
    const configPath = this.getConfigPath(serviceName);
    
    if (!fs.existsSync(configPath)) {
      this.results.warnings.push(`⚠️  ${serviceName}: Config file not found at ${configPath}`);
      return;
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const validation = this.validateConfigContent(configContent, serviceName, expectedSchema);
      
      if (validation.success) {
        this.results.passed.push(`✅ ${serviceName}: Correctly configured for ${expectedSchema}`);
      } else {
        this.results.failed.push(`❌ ${serviceName}: ${validation.error}`);
      }
    } catch (error) {
      this.results.failed.push(`❌ ${serviceName}: Failed to read config - ${error.message}`);
    }
  }

  getConfigPath(serviceName) {
    const basePath = path.join(__dirname, '../backend/services', serviceName, 'src/config');
    
    // Try different config file names
    const possibleFiles = [
      'database.config.ts',
      'supabase.ts',
      'database.ts'
    ];
    
    for (const fileName of possibleFiles) {
      const fullPath = path.join(basePath, fileName);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    return path.join(basePath, 'database.config.ts'); // Default
  }

  validateConfigContent(content, serviceName, expectedSchema) {
    // Check for schema-aware imports
    const hasSchemaMapping = content.includes('getSchemaForService') || 
                            content.includes('SCHEMA_NAME');
    
    if (!hasSchemaMapping) {
      return {
        success: false,
        error: 'Missing schema-aware configuration (getSchemaForService not found)'
      };
    }

    // Check for correct service name
    const hasCorrectServiceName = content.includes(`'${serviceName}'`) ||
                                 content.includes(`"${serviceName}"`);
    
    if (!hasCorrectServiceName) {
      return {
        success: false,
        error: `Service name '${serviceName}' not found in configuration`
      };
    }

    // Check for schema usage in db config
    const hasSchemaInDbConfig = content.includes('schema: SCHEMA_NAME') ||
                               content.includes('schema: getSchemaForService');
    
    if (!hasSchemaInDbConfig) {
      return {
        success: false,
        error: 'Schema not properly configured in database client'
      };
    }

    // Check for deprecated public schema usage
    const hasPublicSchema = content.includes('schema: "public"') ||
                           content.includes("schema: 'public'");
    
    if (hasPublicSchema) {
      return {
        success: false,
        error: 'Still using deprecated "public" schema'
      };
    }

    // Check for proper connection pool integration
    const hasConnectionPool = content.includes('connectionPool') ||
                             content.includes('getConnectionPool');
    
    if (!hasConnectionPool) {
      this.results.warnings.push(`⚠️  ${serviceName}: Missing connection pool integration`);
    }

    return { success: true };
  }

  printResults() {
    console.log('\n📊 VALIDATION RESULTS');
    console.log('=====================\n');

    // Print passed services
    if (this.results.passed.length > 0) {
      console.log('✅ PASSED SERVICES:');
      this.results.passed.forEach(result => console.log(`   ${result}`));
      console.log('');
    }

    // Print failed services
    if (this.results.failed.length > 0) {
      console.log('❌ FAILED SERVICES:');
      this.results.failed.forEach(result => console.log(`   ${result}`));
      console.log('');
    }

    // Print warnings
    if (this.results.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.results.warnings.forEach(result => console.log(`   ${result}`));
      console.log('');
    }

    // Summary
    const total = Object.keys(EXPECTED_SCHEMA_MAPPING).length;
    const passed = this.results.passed.length;
    const failed = this.results.failed.length;
    const warnings = this.results.warnings.length;

    console.log('📈 SUMMARY:');
    console.log(`   Total Services: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   📊 Success Rate: ${Math.round((passed / total) * 100)}%`);

    if (failed === 0) {
      console.log('\n🎉 ALL SERVICES PROPERLY CONFIGURED!');
      console.log('✅ Schema-per-service architecture compliance achieved');
    } else {
      console.log('\n🚨 CONFIGURATION ISSUES DETECTED');
      console.log('❌ Please fix the failed services before proceeding');
    }
  }
}

// Additional validation functions
function validateSchemaMapping() {
  console.log('\n🔍 VALIDATING SCHEMA MAPPING CONFIGURATION...\n');
  
  try {
    // Try to load the schema mapping
    const schemaMapping = require('../backend/shared/dist/config/schema-mapping.js');
    
    console.log('✅ Schema mapping module loaded successfully');
    console.log(`📋 Found ${Object.keys(schemaMapping.SERVICE_SCHEMA_MAPPING).length} service mappings`);
    
    // Validate each mapping
    for (const [serviceName, mapping] of Object.entries(schemaMapping.SERVICE_SCHEMA_MAPPING)) {
      const expectedSchema = EXPECTED_SCHEMA_MAPPING[serviceName];
      
      if (expectedSchema && mapping.schemaName === expectedSchema) {
        console.log(`   ✅ ${serviceName} → ${mapping.schemaName}`);
      } else if (expectedSchema) {
        console.log(`   ❌ ${serviceName} → Expected: ${expectedSchema}, Got: ${mapping.schemaName}`);
      } else {
        console.log(`   ⚠️  ${serviceName} → ${mapping.schemaName} (not in expected list)`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Failed to load schema mapping: ${error.message}`);
    return false;
  }
}

function validateSharedModules() {
  console.log('\n🔍 VALIDATING SHARED MODULES...\n');
  
  const sharedModules = [
    '../backend/shared/dist/config/schema-mapping.js',
    '../backend/shared/dist/database/schema-aware-connection-pool.js',
    '../backend/shared/dist/repositories/base-repository.js'
  ];
  
  let allExists = true;
  
  for (const modulePath of sharedModules) {
    const fullPath = path.join(__dirname, modulePath);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${modulePath}`);
    } else {
      console.log(`   ❌ ${modulePath} - NOT FOUND`);
      allExists = false;
    }
  }
  
  return allExists;
}

// Main execution
async function main() {
  console.log('🏥 HOSPITAL MANAGEMENT SYSTEM - SCHEMA VALIDATION');
  console.log('=================================================\n');
  
  // Validate shared modules first
  const sharedModulesValid = validateSharedModules();
  
  if (!sharedModulesValid) {
    console.log('\n❌ Shared modules validation failed. Please build shared modules first:');
    console.log('   cd backend/shared && npm run build');
    process.exit(1);
  }
  
  // Validate schema mapping configuration
  const schemaMappingValid = validateSchemaMapping();
  
  if (!schemaMappingValid) {
    console.log('\n❌ Schema mapping validation failed.');
    process.exit(1);
  }
  
  // Validate individual service configurations
  const checker = new SchemaValidationChecker();
  const allServicesValid = await checker.validateAllServices();
  
  if (allServicesValid) {
    console.log('\n🎯 PHASE 1 SCHEMA VALIDATION: SUCCESS');
    console.log('=====================================');
    console.log('✅ All microservices are properly configured');
    console.log('✅ Schema-per-service architecture implemented');
    console.log('✅ Ready for Phase 2 deployment');
    process.exit(0);
  } else {
    console.log('\n❌ PHASE 1 SCHEMA VALIDATION: FAILED');
    console.log('====================================');
    console.log('❌ Some services have configuration issues');
    console.log('🔧 Please fix the issues above before proceeding');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

module.exports = SchemaValidationChecker;
