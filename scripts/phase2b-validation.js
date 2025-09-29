#!/usr/bin/env node

/**
 * Phase 2B Validation Script
 * Hospital Management System - Microservices Consolidation
 * 
 * Validates Phase 2B completion:
 * - Receptionist Service → Appointment Service migration
 * - API Gateway routing updates
 * - Service decommissioning
 * - Backward compatibility
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';

// Test endpoints
const ENDPOINTS_TO_TEST = [
  // Receptionist endpoints (should route to appointment service)
  { path: '/api/receptionists/profile', method: 'GET', description: 'Receptionist Profile' },
  { path: '/api/receptionists/dashboard/stats', method: 'GET', description: 'Dashboard Stats' },
  
  // Check-in endpoints
  { path: '/api/checkin/queue', method: 'GET', description: 'Queue Status' },
  { path: '/api/checkin/stats', method: 'GET', description: 'Check-in Stats' },
  
  // Queue management endpoints
  { path: '/api/queue/status', method: 'GET', description: 'Queue Status' },
  { path: '/api/queue/live', method: 'GET', description: 'Live Queue' },
  { path: '/api/queue/analytics', method: 'GET', description: 'Queue Analytics' },
  
  // Reports endpoints
  { path: '/api/reports', method: 'GET', description: 'Reports' }
];

// Service health endpoints
const HEALTH_ENDPOINTS = [
  { url: `${API_GATEWAY_URL}/health`, name: 'API Gateway' },
  { url: `${APPOINTMENT_SERVICE_URL}/health`, name: 'Appointment Service' }
];

// Decommissioned services (should be unreachable)
const DECOMMISSIONED_SERVICES = [
  { url: 'http://localhost:3005/health', name: 'Department Service (Port 3005)' },
  { url: 'http://localhost:3006/health', name: 'Receptionist Service (Port 3006)' },
  { url: 'http://localhost:3011/health', name: 'Notification Service (Port 3011)' }
];

class Phase2BValidator {
  constructor() {
    this.results = {
      healthChecks: [],
      endpointTests: [],
      decommissioningTests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
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

  async validateHealthEndpoints() {
    this.log('🔍 Validating service health endpoints...', 'info');
    
    for (const endpoint of HEALTH_ENDPOINTS) {
      try {
        const response = await axios.get(endpoint.url, { timeout: 5000 });
        
        if (response.status === 200) {
          this.log(`${endpoint.name} health check passed`, 'success');
          this.results.healthChecks.push({
            service: endpoint.name,
            status: 'passed',
            url: endpoint.url,
            responseTime: response.headers['x-response-time'] || 'N/A'
          });
          this.results.summary.passed++;
        } else {
          this.log(`${endpoint.name} health check failed (Status: ${response.status})`, 'error');
          this.results.healthChecks.push({
            service: endpoint.name,
            status: 'failed',
            url: endpoint.url,
            error: `HTTP ${response.status}`
          });
          this.results.summary.failed++;
        }
      } catch (error) {
        this.log(`${endpoint.name} health check failed: ${error.message}`, 'error');
        this.results.healthChecks.push({
          service: endpoint.name,
          status: 'failed',
          url: endpoint.url,
          error: error.message
        });
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    }
  }

  async validateMigratedEndpoints() {
    this.log('🔍 Validating migrated receptionist endpoints...', 'info');
    
    for (const endpoint of ENDPOINTS_TO_TEST) {
      try {
        const url = `${API_GATEWAY_URL}${endpoint.path}`;
        
        // Test without authentication (should get 401/403)
        const response = await axios({
          method: endpoint.method,
          url: url,
          timeout: 5000,
          validateStatus: () => true // Don't throw on 4xx/5xx
        });
        
        // Check if endpoint is reachable (not 404)
        if (response.status === 404) {
          this.log(`${endpoint.description} endpoint not found (404)`, 'error');
          this.results.endpointTests.push({
            endpoint: endpoint.path,
            description: endpoint.description,
            status: 'failed',
            error: 'Endpoint not found'
          });
          this.results.summary.failed++;
        } else if (response.status === 401 || response.status === 403) {
          this.log(`${endpoint.description} endpoint accessible (requires auth)`, 'success');
          this.results.endpointTests.push({
            endpoint: endpoint.path,
            description: endpoint.description,
            status: 'passed',
            note: 'Requires authentication (expected)'
          });
          this.results.summary.passed++;
        } else {
          this.log(`${endpoint.description} endpoint returned ${response.status}`, 'warning');
          this.results.endpointTests.push({
            endpoint: endpoint.path,
            description: endpoint.description,
            status: 'warning',
            httpStatus: response.status
          });
          this.results.summary.warnings++;
        }
      } catch (error) {
        this.log(`${endpoint.description} endpoint test failed: ${error.message}`, 'error');
        this.results.endpointTests.push({
          endpoint: endpoint.path,
          description: endpoint.description,
          status: 'failed',
          error: error.message
        });
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    }
  }

  async validateDecommissionedServices() {
    this.log('🔍 Validating decommissioned services are unreachable...', 'info');
    
    for (const service of DECOMMISSIONED_SERVICES) {
      try {
        await axios.get(service.url, { timeout: 3000 });
        
        // If we reach here, the service is still running (should be decommissioned)
        this.log(`${service.name} is still running (should be decommissioned)`, 'warning');
        this.results.decommissioningTests.push({
          service: service.name,
          status: 'warning',
          url: service.url,
          note: 'Service still accessible - may need manual decommissioning'
        });
        this.results.summary.warnings++;
      } catch (error) {
        // Expected behavior - service should be unreachable
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          this.log(`${service.name} successfully decommissioned`, 'success');
          this.results.decommissioningTests.push({
            service: service.name,
            status: 'passed',
            url: service.url,
            note: 'Service unreachable (expected)'
          });
          this.results.summary.passed++;
        } else {
          this.log(`${service.name} test failed: ${error.message}`, 'error');
          this.results.decommissioningTests.push({
            service: service.name,
            status: 'failed',
            url: service.url,
            error: error.message
          });
          this.results.summary.failed++;
        }
      }
      this.results.summary.total++;
    }
  }

  generateReport() {
    this.log('\n📊 Phase 2B Validation Report', 'info');
    console.log('='.repeat(80).cyan);
    
    // Summary
    console.log('\n📈 Summary:'.bold);
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`.green);
    console.log(`❌ Failed: ${this.results.summary.failed}`.red);
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`.yellow);
    
    const successRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
    console.log(`📊 Success Rate: ${successRate}%`);
    
    // Detailed results
    if (this.results.summary.failed > 0) {
      console.log('\n❌ Failed Tests:'.red.bold);
      [...this.results.healthChecks, ...this.results.endpointTests, ...this.results.decommissioningTests]
        .filter(test => test.status === 'failed')
        .forEach(test => {
          console.log(`  • ${test.service || test.description || test.endpoint}: ${test.error}`.red);
        });
    }
    
    if (this.results.summary.warnings > 0) {
      console.log('\n⚠️  Warnings:'.yellow.bold);
      [...this.results.healthChecks, ...this.results.endpointTests, ...this.results.decommissioningTests]
        .filter(test => test.status === 'warning')
        .forEach(test => {
          console.log(`  • ${test.service || test.description || test.endpoint}: ${test.note || 'Check required'}`.yellow);
        });
    }
    
    // Phase 2B Status
    console.log('\n🎯 Phase 2B Status:'.bold);
    if (this.results.summary.failed === 0) {
      console.log('✅ Phase 2B migration completed successfully!'.green.bold);
      console.log('🚀 Ready to proceed with service decommissioning'.green);
    } else {
      console.log('❌ Phase 2B migration has issues that need attention'.red.bold);
      console.log('🔧 Please fix failed tests before proceeding'.yellow);
    }
    
    console.log('='.repeat(80).cyan);
  }

  async run() {
    console.log('🏥 Hospital Management System - Phase 2B Validation'.bold.cyan);
    console.log('📋 Receptionist Service → Appointment Service Migration'.cyan);
    console.log('='.repeat(80).cyan);
    
    try {
      await this.validateHealthEndpoints();
      await this.validateMigratedEndpoints();
      await this.validateDecommissionedServices();
      
      this.generateReport();
      
      // Exit with appropriate code
      process.exit(this.results.summary.failed > 0 ? 1 : 0);
      
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new Phase2BValidator();
  validator.run();
}

module.exports = Phase2BValidator;
