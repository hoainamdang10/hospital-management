#!/usr/bin/env node

/**
 * End-to-End Orchestration Testing Script
 * Hospital Management System - Phase 3B
 * 
 * Tests all 4 saga patterns through API Gateway:
 * 1. create_doctor - Doctor creation with department validation
 * 2. bulk_user_import - Bulk user import with role assignment
 * 3. system_maintenance - System maintenance with backup
 * 4. cross_service_sync - Cross-service data synchronization
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';

// Test admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@hospital.com',
  password: 'Admin123!!'
};

// Test data for orchestration operations
const TEST_DATA = {
  createDoctor: {
    doctorData: {
      email: 'test.doctor@hospital.com',
      fullName: 'Dr. Test Orchestration',
      phone: '0123456789',
      specialization: 'Cardiology',
      experience: 5,
      licenseNumber: 'VN-CD-1234'
    },
    departmentId: 'CARD-DEPT-001',
    licenseInfo: {
      licenseNumber: 'VN-CD-1234',
      issuedDate: '2020-01-01',
      expiryDate: '2025-01-01'
    }
  },
  bulkImport: {
    users: [
      {
        email: 'bulk.doctor1@hospital.com',
        fullName: 'Dr. Bulk Test 1',
        role: 'doctor',
        phone: '0123456781',
        departmentId: 'CARD-DEPT-001'
      },
      {
        email: 'bulk.patient1@hospital.com',
        fullName: 'Patient Bulk Test 1',
        role: 'patient',
        phone: '0123456782'
      }
    ],
    importOptions: {
      skipDuplicates: true,
      sendWelcomeEmails: false,
      validateData: true
    }
  },
  systemMaintenance: {
    maintenanceType: 'database_cleanup',
    options: {
      notifyUsers: false,
      createBackup: true,
      maintenanceWindow: 30
    }
  },
  crossServiceSync: {
    syncType: 'incremental_sync',
    services: ['auth', 'doctors', 'patients'],
    options: {
      validateConsistency: true,
      createBackup: false,
      dryRun: true
    }
  }
};

class OrchestrationE2ETester {
  constructor() {
    this.authToken = null;
    this.results = {
      authentication: null,
      sagaTests: [],
      performanceMetrics: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        avgResponseTime: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    switch (type) {
      case 'success':
        console.log(`[${timestamp}] ✅ ${message}`.green);
        break;
      case 'error':
        console.log(`[${timestamp}] ❌ ${message}`.red);
        break;
      case 'warning':
        console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
        break;
      case 'info':
      default:
        console.log(`[${timestamp}] ℹ️  ${message}`.blue);
        break;
    }
  }

  async authenticateAdmin() {
    this.log('🔐 Authenticating admin user...', 'info');
    
    try {
      const response = await axios.post(`${API_GATEWAY_URL}/api/auth/login`, ADMIN_CREDENTIALS, {
        timeout: 10000
      });

      if (response.data.success && response.data.data.token) {
        this.authToken = response.data.data.token;
        this.results.authentication = { status: 'success', message: 'Admin authenticated successfully' };
        this.log('Admin authentication successful', 'success');
        return true;
      } else {
        this.results.authentication = { status: 'failed', error: 'Invalid response from auth service' };
        this.log('Admin authentication failed: Invalid response', 'error');
        return false;
      }
    } catch (error) {
      this.results.authentication = { status: 'failed', error: error.message };
      this.log(`Admin authentication failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testSagaPattern(sagaType, testData, description) {
    this.log(`🧪 Testing ${sagaType} saga pattern...`, 'info');
    
    const startTime = Date.now();
    
    try {
      // Step 1: Initiate orchestration
      const response = await axios.post(
        `${API_GATEWAY_URL}/api/admin/orchestrate/${sagaType}`,
        testData,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.data.success) {
        const operationId = response.data.data.operationId;
        this.log(`${description} initiated successfully (Operation ID: ${operationId})`, 'success');
        
        // Step 2: Monitor operation status
        const finalStatus = await this.monitorOperation(operationId, sagaType);
        
        this.results.sagaTests.push({
          sagaType,
          description,
          status: finalStatus.success ? 'passed' : 'failed',
          operationId,
          responseTime: `${responseTime}ms`,
          finalStatus: finalStatus.status,
          executionTime: finalStatus.executionTime,
          details: finalStatus.details
        });

        this.results.performanceMetrics.push({
          operation: sagaType,
          responseTime,
          executionTime: finalStatus.executionTime
        });

        if (finalStatus.success) {
          this.results.summary.passed++;
          this.log(`${description} completed successfully`, 'success');
        } else {
          this.results.summary.failed++;
          this.log(`${description} failed: ${finalStatus.error}`, 'error');
        }

      } else {
        this.results.sagaTests.push({
          sagaType,
          description,
          status: 'failed',
          responseTime: `${responseTime}ms`,
          error: response.data.error?.message || 'Unknown error'
        });
        this.results.summary.failed++;
        this.log(`${description} failed: ${response.data.error?.message}`, 'error');
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.results.sagaTests.push({
        sagaType,
        description,
        status: 'failed',
        responseTime: `${responseTime}ms`,
        error: error.message
      });
      this.results.summary.failed++;
      this.log(`${description} failed: ${error.message}`, 'error');
    }

    this.results.summary.total++;
  }

  async monitorOperation(operationId, sagaType) {
    this.log(`📊 Monitoring operation ${operationId}...`, 'info');
    
    const maxAttempts = 10;
    const pollInterval = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `${API_GATEWAY_URL}/api/admin/orchestrate/operations/${operationId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.authToken}`
            },
            timeout: 10000
          }
        );

        if (response.data.success) {
          const operation = response.data.data;
          this.log(`Operation ${operationId} status: ${operation.status} (${operation.progress}%)`, 'info');
          
          if (operation.status === 'completed') {
            return {
              success: true,
              status: 'completed',
              executionTime: Date.now() - new Date(operation.updatedAt).getTime(),
              details: operation
            };
          } else if (operation.status === 'failed') {
            return {
              success: false,
              status: 'failed',
              error: operation.error || 'Operation failed',
              details: operation
            };
          }
          
          // Continue monitoring
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        } else {
          this.log(`Failed to get operation status: ${response.data.error?.message}`, 'warning');
        }

      } catch (error) {
        this.log(`Error monitoring operation: ${error.message}`, 'warning');
      }
    }

    // Timeout
    return {
      success: false,
      status: 'timeout',
      error: 'Operation monitoring timeout',
      details: null
    };
  }

  async testOrchestrationHealth() {
    this.log('🔍 Testing orchestration health endpoint...', 'info');
    
    try {
      const response = await axios.get(`${API_GATEWAY_URL}/api/admin/orchestrate/health`, {
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        this.log('Orchestration health check passed', 'success');
        return true;
      } else {
        this.log('Orchestration health check failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Orchestration health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  generateReport() {
    this.log('\n📊 End-to-End Orchestration Test Report', 'info');
    console.log('='.repeat(80).cyan);
    
    // Summary
    console.log('\n📈 Test Summary:'.bold);
    console.log(`Total Saga Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`.green);
    console.log(`❌ Failed: ${this.results.summary.failed}`.red);
    
    const successRate = this.results.summary.total > 0 
      ? ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)
      : 0;
    console.log(`📊 Success Rate: ${successRate}%`);
    
    // Performance Metrics
    if (this.results.performanceMetrics.length > 0) {
      console.log('\n⚡ Performance Metrics:'.bold);
      const avgResponseTime = this.results.performanceMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / this.results.performanceMetrics.length;
      console.log(`Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
      
      this.results.performanceMetrics.forEach(metric => {
        const status = metric.responseTime < 300 ? '✅' : '⚠️';
        console.log(`  ${status} ${metric.operation}: ${metric.responseTime}ms`);
      });
    }
    
    // Detailed Results
    console.log('\n📋 Detailed Results:'.bold);
    this.results.sagaTests.forEach(test => {
      const statusIcon = test.status === 'passed' ? '✅' : '❌';
      console.log(`${statusIcon} ${test.description}`);
      console.log(`   Response Time: ${test.responseTime}`);
      if (test.operationId) {
        console.log(`   Operation ID: ${test.operationId}`);
      }
      if (test.error) {
        console.log(`   Error: ${test.error}`.red);
      }
      if (test.finalStatus) {
        console.log(`   Final Status: ${test.finalStatus}`);
      }
      console.log('');
    });
    
    // Overall Status
    console.log('\n🎯 Overall Status:'.bold);
    if (this.results.summary.failed === 0) {
      console.log('✅ All orchestration saga patterns working correctly!'.green.bold);
      console.log('🚀 Phase 3B end-to-end testing successful'.green);
    } else {
      console.log('❌ Some orchestration patterns failed'.red.bold);
      console.log('🔧 Please investigate failed saga patterns'.yellow);
    }
    
    console.log('='.repeat(80).cyan);
  }

  async run() {
    console.log('🏥 Hospital Management System - End-to-End Orchestration Testing'.bold.cyan);
    console.log('📋 Testing All 4 Saga Patterns Through API Gateway'.cyan);
    console.log('='.repeat(80).cyan);
    
    try {
      // Step 1: Test orchestration health
      const healthOk = await this.testOrchestrationHealth();
      if (!healthOk) {
        this.log('⚠️ Orchestration health check failed - proceeding with caution', 'warning');
      }

      // Step 2: Authenticate admin
      const authSuccess = await this.authenticateAdmin();
      if (!authSuccess) {
        this.log('❌ Cannot proceed without admin authentication', 'error');
        process.exit(1);
      }

      // Step 3: Test all saga patterns
      await this.testSagaPattern('doctor-creation', TEST_DATA.createDoctor, 'Doctor Creation Saga');
      await this.testSagaPattern('bulk-import', TEST_DATA.bulkImport, 'Bulk User Import Saga');
      await this.testSagaPattern('system-maintenance', TEST_DATA.systemMaintenance, 'System Maintenance Saga');
      await this.testSagaPattern('cross-service-sync', TEST_DATA.crossServiceSync, 'Cross-Service Sync Saga');

      // Step 4: Generate report
      this.generateReport();
      
      // Exit with appropriate code
      process.exit(this.results.summary.failed > 0 ? 1 : 0);
      
    } catch (error) {
      this.log(`E2E testing failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run E2E testing
if (require.main === module) {
  const tester = new OrchestrationE2ETester();
  tester.run();
}

module.exports = OrchestrationE2ETester;
