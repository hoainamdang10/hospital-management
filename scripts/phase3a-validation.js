#!/usr/bin/env node

/**
 * Phase 3A Validation Script
 * Hospital Management System - Microservices Consolidation
 * 
 * Validates Phase 3A completion:
 * - Admin Orchestrator → Auth Service migration
 * - Core orchestration functionality
 * - Infrastructure components (Redis, RabbitMQ)
 * - Service adapters and saga patterns
 * - API endpoint integration
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';

// Test endpoints
const ORCHESTRATION_ENDPOINTS = [
  { path: '/api/admin/orchestrate/health', method: 'GET', description: 'Orchestrator Health Check' },
  { path: '/api/admin/orchestrate/statistics', method: 'GET', description: 'Orchestrator Statistics', requiresAuth: true },
  { path: '/api/admin/orchestrate/doctor-creation', method: 'POST', description: 'Doctor Creation Orchestration', requiresAuth: true },
  { path: '/api/admin/orchestrate/bulk-import', method: 'POST', description: 'Bulk Import Orchestration', requiresAuth: true },
  { path: '/api/admin/orchestrate/system-maintenance', method: 'POST', description: 'System Maintenance Orchestration', requiresAuth: true },
  { path: '/api/admin/orchestrate/cross-service-sync', method: 'POST', description: 'Cross-Service Sync Orchestration', requiresAuth: true }
];

// Service health endpoints
const HEALTH_ENDPOINTS = [
  { url: `${AUTH_SERVICE_URL}/health`, name: 'Auth Service' },
  { url: `${API_GATEWAY_URL}/health`, name: 'API Gateway' }
];

// Infrastructure components to validate
const INFRASTRUCTURE_COMPONENTS = [
  'Redis Client',
  'RabbitMQ Client',
  'Service Adapter Factory',
  'Saga Coordinator',
  'Workflow Manager',
  'Event Manager',
  'Coordination Monitor'
];

class Phase3AValidator {
  constructor() {
    this.results = {
      healthChecks: [],
      endpointTests: [],
      infrastructureTests: [],
      orchestrationTests: [],
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
        const response = await axios.get(endpoint.url, { timeout: 10000 });
        
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

  async validateOrchestrationEndpoints() {
    this.log('🔍 Validating orchestration endpoints...', 'info');
    
    for (const endpoint of ORCHESTRATION_ENDPOINTS) {
      try {
        const url = `${AUTH_SERVICE_URL}${endpoint.path}`;
        
        // Test without authentication first
        const response = await axios({
          method: endpoint.method,
          url: url,
          timeout: 10000,
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
        } else if (endpoint.requiresAuth && (response.status === 401 || response.status === 403)) {
          this.log(`${endpoint.description} endpoint accessible (requires auth)`, 'success');
          this.results.endpointTests.push({
            endpoint: endpoint.path,
            description: endpoint.description,
            status: 'passed',
            note: 'Requires authentication (expected)'
          });
          this.results.summary.passed++;
        } else if (!endpoint.requiresAuth && response.status === 200) {
          this.log(`${endpoint.description} endpoint accessible`, 'success');
          this.results.endpointTests.push({
            endpoint: endpoint.path,
            description: endpoint.description,
            status: 'passed',
            httpStatus: response.status
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

  async validateOrchestrationHealth() {
    this.log('🔍 Validating orchestration health status...', 'info');
    
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/admin/orchestrate/health`, {
        timeout: 15000
      });

      if (response.status === 200 && response.data.success) {
        const healthData = response.data.data;
        
        this.log('Orchestration health check passed', 'success');
        
        // Validate infrastructure components
        const components = healthData.components || {};
        
        for (const componentName of INFRASTRUCTURE_COMPONENTS) {
          const componentKey = componentName.toLowerCase().replace(/\s+/g, '');
          const componentHealth = components[componentKey];
          
          if (componentHealth && componentHealth.status === 'healthy') {
            this.log(`${componentName} is healthy`, 'success');
            this.results.infrastructureTests.push({
              component: componentName,
              status: 'passed',
              health: componentHealth
            });
            this.results.summary.passed++;
          } else if (componentHealth) {
            this.log(`${componentName} is ${componentHealth.status}`, 'warning');
            this.results.infrastructureTests.push({
              component: componentName,
              status: 'warning',
              health: componentHealth
            });
            this.results.summary.warnings++;
          } else {
            this.log(`${componentName} status unknown`, 'warning');
            this.results.infrastructureTests.push({
              component: componentName,
              status: 'warning',
              note: 'Component status not reported'
            });
            this.results.summary.warnings++;
          }
          this.results.summary.total++;
        }

        // Overall orchestration status
        this.results.orchestrationTests.push({
          test: 'Overall Orchestration Health',
          status: 'passed',
          overallStatus: healthData.status,
          timestamp: healthData.timestamp
        });
        this.results.summary.passed++;
        this.results.summary.total++;

      } else {
        this.log('Orchestration health check failed', 'error');
        this.results.orchestrationTests.push({
          test: 'Overall Orchestration Health',
          status: 'failed',
          error: 'Health endpoint returned unsuccessful response'
        });
        this.results.summary.failed++;
        this.results.summary.total++;
      }

    } catch (error) {
      this.log(`Orchestration health validation failed: ${error.message}`, 'error');
      this.results.orchestrationTests.push({
        test: 'Overall Orchestration Health',
        status: 'failed',
        error: error.message
      });
      this.results.summary.failed++;
      this.results.summary.total++;
    }
  }

  async validateAPIGatewayIntegration() {
    this.log('🔍 Validating API Gateway integration...', 'info');
    
    try {
      // Test orchestration endpoint through API Gateway
      const response = await axios.get(`${API_GATEWAY_URL}/api/admin/orchestrate/health`, {
        timeout: 10000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        this.log('API Gateway orchestration routing works', 'success');
        this.results.orchestrationTests.push({
          test: 'API Gateway Integration',
          status: 'passed',
          note: 'Orchestration endpoints accessible through API Gateway'
        });
        this.results.summary.passed++;
      } else if (response.status === 404) {
        this.log('API Gateway orchestration routing not configured', 'warning');
        this.results.orchestrationTests.push({
          test: 'API Gateway Integration',
          status: 'warning',
          note: 'Orchestration endpoints not routed through API Gateway (Phase 3B task)'
        });
        this.results.summary.warnings++;
      } else {
        this.log(`API Gateway returned status ${response.status}`, 'warning');
        this.results.orchestrationTests.push({
          test: 'API Gateway Integration',
          status: 'warning',
          httpStatus: response.status
        });
        this.results.summary.warnings++;
      }
    } catch (error) {
      this.log(`API Gateway integration test failed: ${error.message}`, 'warning');
      this.results.orchestrationTests.push({
        test: 'API Gateway Integration',
        status: 'warning',
        error: error.message,
        note: 'API Gateway integration is Phase 3B task'
      });
      this.results.summary.warnings++;
    }
    this.results.summary.total++;
  }

  generateReport() {
    this.log('\n📊 Phase 3A Validation Report', 'info');
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
      [...this.results.healthChecks, ...this.results.endpointTests, ...this.results.infrastructureTests, ...this.results.orchestrationTests]
        .filter(test => test.status === 'failed')
        .forEach(test => {
          console.log(`  • ${test.service || test.description || test.component || test.test}: ${test.error}`.red);
        });
    }
    
    if (this.results.summary.warnings > 0) {
      console.log('\n⚠️  Warnings:'.yellow.bold);
      [...this.results.healthChecks, ...this.results.endpointTests, ...this.results.infrastructureTests, ...this.results.orchestrationTests]
        .filter(test => test.status === 'warning')
        .forEach(test => {
          console.log(`  • ${test.service || test.description || test.component || test.test}: ${test.note || 'Check required'}`.yellow);
        });
    }
    
    // Phase 3A Status
    console.log('\n🎯 Phase 3A Status:'.bold);
    if (this.results.summary.failed === 0) {
      console.log('✅ Phase 3A foundation setup completed successfully!'.green.bold);
      console.log('🚀 Ready to proceed with Phase 3B (API Gateway integration)'.green);
    } else {
      console.log('❌ Phase 3A has issues that need attention'.red.bold);
      console.log('🔧 Please fix failed tests before proceeding to Phase 3B'.yellow);
    }
    
    // Next Steps
    console.log('\n📋 Next Steps:'.bold);
    console.log('1. Fix any failed infrastructure components');
    console.log('2. Ensure all orchestration endpoints are accessible');
    console.log('3. Proceed with Phase 3B: API Gateway routing updates');
    console.log('4. Test complete orchestration workflows');
    
    console.log('='.repeat(80).cyan);
  }

  async run() {
    console.log('🏥 Hospital Management System - Phase 3A Validation'.bold.cyan);
    console.log('📋 Admin Orchestrator → Auth Service Migration (Foundation)'.cyan);
    console.log('='.repeat(80).cyan);
    
    try {
      await this.validateHealthEndpoints();
      await this.validateOrchestrationEndpoints();
      await this.validateOrchestrationHealth();
      await this.validateAPIGatewayIntegration();
      
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
  const validator = new Phase3AValidator();
  validator.run();
}

module.exports = Phase3AValidator;
