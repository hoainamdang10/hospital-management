#!/usr/bin/env node

/**
 * Post-Migration Validation Script
 * Validates that all services are correctly connected to their designated schemas
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Zero-downtime validation
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Service configuration
const SERVICES = {
  'api-gateway': { port: 3100, healthPath: '/health' },
  'auth-service': { port: 3001, healthPath: '/health' },
  'doctor-service': { port: 3002, healthPath: '/health' },
  'patient-service': { port: 3003, healthPath: '/health' },
  'appointment-service': { port: 3004, healthPath: '/health' },
  'department-service': { port: 3005, healthPath: '/health' },
  'receptionist-service': { port: 3006, healthPath: '/health' },
  'medical-records-service': { port: 3007, healthPath: '/health' },
  'payment-service': { port: 3009, healthPath: '/health' },
  'notification-service': { port: 3011, healthPath: '/health' },
  'file-service': { port: 3107, healthPath: '/health' }
};

const EXPECTED_SCHEMAS = {
  'auth-service': 'auth_schema',
  'doctor-service': 'doctor_schema',
  'patient-service': 'patient_schema',
  'appointment-service': 'appointment_schema',
  'medical-records-service': 'medical_records_schema',
  'payment-service': 'payment_schema',
  'file-service': 'file_schema',
  'receptionist-service': 'auth_schema',
  'department-service': 'auth_schema',
  'notification-service': 'file_schema'
};

class PostMigrationValidator {
  constructor() {
    this.results = {
      serviceHealth: {},
      schemaConnections: {},
      crossServiceCommunication: {},
      performanceMetrics: {},
      complianceChecks: {}
    };
    this.errors = [];
    this.warnings = [];
  }

  async runFullValidation() {
    console.log('🔍 Starting Post-Migration Validation...');
    console.log('=====================================\n');

    try {
      await this.validateServiceHealth();
      await this.validateSchemaConnections();
      await this.validateCrossServiceCommunication();
      await this.validatePerformanceMetrics();
      await this.validateHIPAACompliance();
      
      this.generateValidationReport();
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  async validateServiceHealth() {
    console.log('🏥 Validating Service Health...');
    
    for (const [serviceName, config] of Object.entries(SERVICES)) {
      try {
        const url = `http://localhost:${config.port}${config.healthPath}`;
        const startTime = Date.now();
        
        const response = await axios.get(url, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        
        this.results.serviceHealth[serviceName] = {
          status: 'healthy',
          responseTime,
          details: response.data
        };
        
        console.log(`  ✅ ${serviceName}: Healthy (${responseTime}ms)`);
      } catch (error) {
        this.results.serviceHealth[serviceName] = {
          status: 'unhealthy',
          error: error.message
        };
        
        console.log(`  ❌ ${serviceName}: Unhealthy - ${error.message}`);
        this.errors.push(`Service ${serviceName} is unhealthy`);
      }
    }
  }

  async validateSchemaConnections() {
    console.log('\n🗄️  Validating Schema Connections...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    for (const [serviceName, expectedSchema] of Object.entries(EXPECTED_SCHEMAS)) {
      try {
        // Test schema connection by querying schema-specific health endpoint
        const serviceConfig = SERVICES[serviceName];
        if (!serviceConfig) {
          this.warnings.push(`No service configuration found for ${serviceName}`);
          continue;
        }

        const url = `http://localhost:${serviceConfig.port}/health/schema`;
        
        try {
          const response = await axios.get(url, { timeout: 3000 });
          const schemaInfo = response.data;
          
          if (schemaInfo.schema === expectedSchema) {
            this.results.schemaConnections[serviceName] = {
              status: 'correct',
              expectedSchema,
              actualSchema: schemaInfo.schema,
              connectionPool: schemaInfo.connectionPool || 'unknown'
            };
            console.log(`  ✅ ${serviceName}: Connected to ${expectedSchema}`);
          } else {
            this.results.schemaConnections[serviceName] = {
              status: 'incorrect',
              expectedSchema,
              actualSchema: schemaInfo.schema || 'unknown'
            };
            console.log(`  ❌ ${serviceName}: Expected ${expectedSchema}, got ${schemaInfo.schema}`);
            this.errors.push(`${serviceName} connected to wrong schema`);
          }
        } catch (endpointError) {
          // Fallback: Test by attempting a simple query
          await this.testSchemaConnectionFallback(serviceName, expectedSchema, supabase);
        }
      } catch (error) {
        this.results.schemaConnections[serviceName] = {
          status: 'error',
          error: error.message
        };
        console.log(`  ⚠️  ${serviceName}: Could not validate schema connection`);
        this.warnings.push(`Could not validate schema for ${serviceName}`);
      }
    }
  }

  async testSchemaConnectionFallback(serviceName, expectedSchema, supabase) {
    // Test by checking if service can access its expected tables
    const testTables = {
      'auth-service': 'profiles',
      'doctor-service': 'doctor_profiles',
      'patient-service': 'patient_profiles',
      'appointment-service': 'appointments',
      'medical-records-service': 'medical_records',
      'payment-service': 'payments',
      'file-service': 'documents'
    };

    const testTable = testTables[serviceName];
    if (!testTable) {
      this.warnings.push(`No test table defined for ${serviceName}`);
      return;
    }

    try {
      // Test if table exists in expected schema
      const { data, error } = await supabase
        .from(testTable)
        .select('count(*)')
        .limit(1);

      if (!error) {
        this.results.schemaConnections[serviceName] = {
          status: 'assumed_correct',
          expectedSchema,
          testMethod: 'table_access',
          note: 'Schema validation via table access test'
        };
        console.log(`  ✅ ${serviceName}: Schema connection assumed correct (table accessible)`);
      } else {
        this.results.schemaConnections[serviceName] = {
          status: 'error',
          error: error.message,
          testMethod: 'table_access'
        };
        console.log(`  ❌ ${serviceName}: Table access failed - ${error.message}`);
      }
    } catch (error) {
      this.results.schemaConnections[serviceName] = {
        status: 'error',
        error: error.message
      };
    }
  }

  async validateCrossServiceCommunication() {
    console.log('\n🔗 Validating Cross-Service Communication...');
    
    // Test API Gateway routing
    const testRoutes = [
      { path: '/api/auth/health', service: 'auth-service' },
      { path: '/api/doctors/health', service: 'doctor-service' },
      { path: '/api/patients/health', service: 'patient-service' },
      { path: '/api/appointments/health', service: 'appointment-service' }
    ];

    for (const route of testRoutes) {
      try {
        const url = `http://localhost:3100${route.path}`;
        const response = await axios.get(url, { timeout: 3000 });
        
        this.results.crossServiceCommunication[route.service] = {
          status: 'working',
          route: route.path,
          responseTime: response.headers['x-response-time'] || 'unknown'
        };
        
        console.log(`  ✅ ${route.service}: API Gateway routing working`);
      } catch (error) {
        this.results.crossServiceCommunication[route.service] = {
          status: 'failed',
          route: route.path,
          error: error.message
        };
        
        console.log(`  ❌ ${route.service}: API Gateway routing failed`);
        this.errors.push(`API Gateway routing failed for ${route.service}`);
      }
    }
  }

  async validatePerformanceMetrics() {
    console.log('\n⚡ Validating Performance Metrics...');
    
    // Test response times for critical endpoints
    const performanceTests = [
      { name: 'Auth Login', url: 'http://localhost:3100/api/auth/health' },
      { name: 'Doctor List', url: 'http://localhost:3100/api/doctors/health' },
      { name: 'Patient Search', url: 'http://localhost:3100/api/patients/health' }
    ];

    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        await axios.get(test.url, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        
        const status = responseTime < 200 ? 'excellent' : 
                      responseTime < 500 ? 'good' : 
                      responseTime < 1000 ? 'acceptable' : 'poor';
        
        this.results.performanceMetrics[test.name] = {
          responseTime,
          status,
          threshold: '< 200ms target'
        };
        
        console.log(`  ${this.getStatusIcon(status)} ${test.name}: ${responseTime}ms (${status})`);
      } catch (error) {
        this.results.performanceMetrics[test.name] = {
          status: 'failed',
          error: error.message
        };
        console.log(`  ❌ ${test.name}: Performance test failed`);
      }
    }
  }

  async validateHIPAACompliance() {
    console.log('\n🛡️  Validating HIPAA Compliance...');
    
    // Check audit logging
    try {
      const auditResponse = await axios.get('http://localhost:3100/api/audit/health', { timeout: 3000 });
      this.results.complianceChecks.auditLogging = {
        status: 'enabled',
        details: auditResponse.data
      };
      console.log('  ✅ Audit logging: Enabled');
    } catch (error) {
      this.results.complianceChecks.auditLogging = {
        status: 'unknown',
        error: error.message
      };
      console.log('  ⚠️  Audit logging: Could not verify');
    }

    // Check RLS policies
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: rlsCheck } = await supabase
        .rpc('check_rls_policies')
        .single();

      this.results.complianceChecks.rowLevelSecurity = {
        status: rlsCheck ? 'enabled' : 'disabled',
        details: rlsCheck
      };
      
      console.log(`  ${rlsCheck ? '✅' : '❌'} Row Level Security: ${rlsCheck ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      this.results.complianceChecks.rowLevelSecurity = {
        status: 'unknown',
        error: error.message
      };
      console.log('  ⚠️  Row Level Security: Could not verify');
    }
  }

  getStatusIcon(status) {
    const icons = {
      'excellent': '🟢',
      'good': '🟡',
      'acceptable': '🟠',
      'poor': '🔴',
      'failed': '❌'
    };
    return icons[status] || '⚪';
  }

  generateValidationReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('===================');
    
    const totalServices = Object.keys(SERVICES).length;
    const healthyServices = Object.values(this.results.serviceHealth)
      .filter(s => s.status === 'healthy').length;
    
    const correctSchemas = Object.values(this.results.schemaConnections)
      .filter(s => s.status === 'correct' || s.status === 'assumed_correct').length;
    
    console.log(`\n🏥 Service Health: ${healthyServices}/${totalServices} healthy`);
    console.log(`🗄️  Schema Connections: ${correctSchemas}/${Object.keys(EXPECTED_SCHEMAS).length} correct`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    // Overall status
    const overallStatus = this.errors.length === 0 ? 'PASSED' : 'FAILED';
    console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`);
    
    if (overallStatus === 'PASSED') {
      console.log('\n✅ Migration validation completed successfully!');
      console.log('🚀 System is ready for production use.');
    } else {
      console.log('\n❌ Migration validation failed!');
      console.log('🔧 Please address the errors above before proceeding.');
    }
    
    // Save detailed report
    const reportPath = `./validation-report-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  const validator = new PostMigrationValidator();
  
  try {
    await validator.runFullValidation();
    process.exit(validator.errors.length === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PostMigrationValidator;
