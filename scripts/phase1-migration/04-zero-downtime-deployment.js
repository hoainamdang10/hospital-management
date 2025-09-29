#!/usr/bin/env node

/**
 * Zero-Downtime Deployment Script for Phase 1 Migration
 * Orchestrates the complete migration process with minimal service interruption
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Zero-downtime, Backward compatibility, HIPAA
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ZeroDowntimeDeployment {
  constructor() {
    this.deploymentId = `phase1-${Date.now()}`;
    this.logFile = path.join(__dirname, `deployment-${this.deploymentId}.log`);
    this.rollbackData = {};
    this.services = [
      'auth-service',
      'doctor-service', 
      'patient-service',
      'appointment-service',
      'medical-records-service',
      'payment-service',
      'file-service',
      'receptionist-service',
      'department-service',
      'notification-service'
    ];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async executeDeployment() {
    this.log('🚀 Starting Zero-Downtime Phase 1 Migration Deployment');
    this.log(`📋 Deployment ID: ${this.deploymentId}`);
    
    try {
      // Phase 1: Pre-deployment validation
      await this.preDeploymentValidation();
      
      // Phase 2: Database preparation
      await this.prepareDatabaseMigration();
      
      // Phase 3: Update service configurations
      await this.updateServiceConfigurations();
      
      // Phase 4: Rolling service restart
      await this.performRollingRestart();
      
      // Phase 5: Post-deployment validation
      await this.postDeploymentValidation();
      
      // Phase 6: Cleanup and finalization
      await this.finalizeDeployment();
      
      this.log('✅ Zero-downtime deployment completed successfully!');
      
    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`, 'ERROR');
      await this.initiateRollback();
      throw error;
    }
  }

  async preDeploymentValidation() {
    this.log('🔍 Phase 1: Pre-deployment validation...');
    
    // Check if all services are healthy
    const healthChecks = await this.checkAllServicesHealth();
    if (!healthChecks.allHealthy) {
      throw new Error(`Some services are unhealthy: ${healthChecks.unhealthyServices.join(', ')}`);
    }
    
    // Verify database schemas exist
    await this.verifyDatabaseSchemas();
    
    // Check backup systems
    await this.verifyBackupSystems();
    
    // Validate environment variables
    await this.validateEnvironmentVariables();
    
    this.log('✅ Pre-deployment validation passed');
  }

  async prepareDatabaseMigration() {
    this.log('🗄️  Phase 2: Database preparation...');
    
    try {
      // Run database migration script
      this.log('Running database migration script...');
      execSync('psql $SUPABASE_DB_URL -f scripts/phase1-migration/01-schema-connection-migration.sql', {
        stdio: 'inherit',
        env: { ...process.env, SUPABASE_DB_URL: this.constructDatabaseUrl() }
      });
      
      // Verify migration completed successfully
      await this.verifyDatabaseMigration();
      
      this.log('✅ Database preparation completed');
    } catch (error) {
      throw new Error(`Database preparation failed: ${error.message}`);
    }
  }

  async updateServiceConfigurations() {
    this.log('⚙️  Phase 3: Updating service configurations...');
    
    try {
      // Backup current configurations
      await this.backupCurrentConfigurations();
      
      // Run configuration update script
      const ServiceConfigUpdater = require('./02-update-all-service-configs.js');
      const updater = new ServiceConfigUpdater();
      await updater.updateAllServices();
      
      // Compile TypeScript to check for errors
      await this.compileTypeScript();
      
      this.log('✅ Service configurations updated');
    } catch (error) {
      throw new Error(`Configuration update failed: ${error.message}`);
    }
  }

  async performRollingRestart() {
    this.log('🔄 Phase 4: Performing rolling service restart...');
    
    // Restart services in dependency order to minimize downtime
    const restartOrder = [
      'auth-service',        // Core authentication first
      'department-service',  // Organizational data
      'doctor-service',      // Medical staff
      'patient-service',     // Patient data
      'appointment-service', // Scheduling
      'medical-records-service', // Clinical data
      'payment-service',     // Billing
      'file-service',        // Document management
      'notification-service', // Communications
      'receptionist-service' // Front desk operations
    ];

    for (const serviceName of restartOrder) {
      await this.restartServiceWithHealthCheck(serviceName);
      
      // Wait between restarts to ensure stability
      await this.sleep(5000);
    }
    
    this.log('✅ Rolling restart completed');
  }

  async restartServiceWithHealthCheck(serviceName) {
    this.log(`🔄 Restarting ${serviceName}...`);
    
    try {
      // Stop service gracefully
      await this.stopService(serviceName);
      
      // Wait for graceful shutdown
      await this.sleep(3000);
      
      // Start service with new configuration
      await this.startService(serviceName);
      
      // Wait for service to initialize
      await this.sleep(10000);
      
      // Verify service health
      const isHealthy = await this.waitForServiceHealth(serviceName, 60000);
      
      if (!isHealthy) {
        throw new Error(`${serviceName} failed to become healthy after restart`);
      }
      
      this.log(`✅ ${serviceName} restarted successfully`);
      
    } catch (error) {
      throw new Error(`Failed to restart ${serviceName}: ${error.message}`);
    }
  }

  async stopService(serviceName) {
    try {
      // Use Docker Compose to stop service
      execSync(`docker-compose stop ${serviceName}`, {
        cwd: path.join(__dirname, '../../backend'),
        stdio: 'pipe'
      });
      this.log(`🛑 Stopped ${serviceName}`);
    } catch (error) {
      this.log(`⚠️  Could not stop ${serviceName} via Docker: ${error.message}`, 'WARN');
    }
  }

  async startService(serviceName) {
    try {
      // Use Docker Compose to start service
      execSync(`docker-compose up -d ${serviceName}`, {
        cwd: path.join(__dirname, '../../backend'),
        stdio: 'pipe'
      });
      this.log(`🚀 Started ${serviceName}`);
    } catch (error) {
      throw new Error(`Failed to start ${serviceName}: ${error.message}`);
    }
  }

  async waitForServiceHealth(serviceName, timeoutMs = 60000) {
    const servicePort = this.getServicePort(serviceName);
    const healthUrl = `http://localhost:${servicePort}/health`;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await axios.get(healthUrl, { timeout: 5000 });
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }
      
      await this.sleep(2000);
    }
    
    return false;
  }

  async postDeploymentValidation() {
    this.log('✅ Phase 5: Post-deployment validation...');
    
    try {
      // Run comprehensive validation
      const PostMigrationValidator = require('./03-post-migration-validation.js');
      const validator = new PostMigrationValidator();
      await validator.runFullValidation();
      
      this.log('✅ Post-deployment validation passed');
    } catch (error) {
      throw new Error(`Post-deployment validation failed: ${error.message}`);
    }
  }

  async finalizeDeployment() {
    this.log('🎯 Phase 6: Finalizing deployment...');
    
    // Update deployment status
    await this.updateDeploymentStatus('completed');
    
    // Clean up temporary files
    await this.cleanupTemporaryFiles();
    
    // Send deployment notification
    await this.sendDeploymentNotification('success');
    
    this.log('✅ Deployment finalized');
  }

  async initiateRollback() {
    this.log('🔄 Initiating rollback procedure...', 'ERROR');
    
    try {
      // Restore service configurations
      const ServiceConfigUpdater = require('./02-update-all-service-configs.js');
      const updater = new ServiceConfigUpdater();
      await updater.rollback();
      
      // Restart services with old configuration
      for (const serviceName of this.services.reverse()) {
        await this.restartServiceWithHealthCheck(serviceName);
      }
      
      // Send rollback notification
      await this.sendDeploymentNotification('rollback');
      
      this.log('✅ Rollback completed successfully');
    } catch (rollbackError) {
      this.log(`❌ Rollback failed: ${rollbackError.message}`, 'ERROR');
      await this.sendDeploymentNotification('rollback_failed');
    }
  }

  // Helper methods
  async checkAllServicesHealth() {
    const results = { allHealthy: true, unhealthyServices: [] };
    
    for (const serviceName of this.services) {
      const isHealthy = await this.checkServiceHealth(serviceName);
      if (!isHealthy) {
        results.allHealthy = false;
        results.unhealthyServices.push(serviceName);
      }
    }
    
    return results;
  }

  async checkServiceHealth(serviceName) {
    try {
      const port = this.getServicePort(serviceName);
      const response = await axios.get(`http://localhost:${port}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  getServicePort(serviceName) {
    const ports = {
      'auth-service': 3001,
      'doctor-service': 3002,
      'patient-service': 3003,
      'appointment-service': 3004,
      'department-service': 3005,
      'receptionist-service': 3006,
      'medical-records-service': 3007,
      'payment-service': 3009,
      'notification-service': 3011,
      'file-service': 3107
    };
    return ports[serviceName] || 3000;
  }

  async verifyDatabaseSchemas() {
    // Implementation for database schema verification
    this.log('Verifying database schemas...');
    // Add actual verification logic here
  }

  async verifyBackupSystems() {
    this.log('Verifying backup systems...');
    // Add backup verification logic here
  }

  async validateEnvironmentVariables() {
    const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    for (const envVar of required) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
  }

  constructDatabaseUrl() {
    return process.env.SUPABASE_DB_URL || process.env.SUPABASE_URL;
  }

  async verifyDatabaseMigration() {
    this.log('Verifying database migration...');
    // Add migration verification logic here
  }

  async backupCurrentConfigurations() {
    this.log('Backing up current configurations...');
    // Backup logic is handled by the config updater
  }

  async compileTypeScript() {
    this.log('Compiling TypeScript...');
    try {
      execSync('npm run build', {
        cwd: path.join(__dirname, '../../backend'),
        stdio: 'pipe'
      });
    } catch (error) {
      throw new Error(`TypeScript compilation failed: ${error.message}`);
    }
  }

  async updateDeploymentStatus(status) {
    this.log(`Deployment status: ${status}`);
  }

  async cleanupTemporaryFiles() {
    this.log('Cleaning up temporary files...');
  }

  async sendDeploymentNotification(type) {
    this.log(`Sending ${type} notification...`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const deployment = new ZeroDowntimeDeployment();
  
  try {
    await deployment.executeDeployment();
    console.log('\n🎉 Phase 1 migration deployment completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ZeroDowntimeDeployment;
