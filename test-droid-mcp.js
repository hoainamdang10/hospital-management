#!/usr/bin/env node

/**
 * Test script for Droid MCP connections
 * Run: node test-droid-mcp.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const MCP_CONFIG_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME,
  '.factory',
  'mcp.json'
);

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function checkMCPConfig() {
  log('\n=== Checking Droid MCP Configuration ===', colors.blue);
  
  try {
    if (!fs.existsSync(MCP_CONFIG_PATH)) {
      log(`✗ MCP config not found at: ${MCP_CONFIG_PATH}`, colors.red);
      return false;
    }
    
    const config = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
    const servers = Object.keys(config.mcpServers || {});
    
    if (servers.length === 0) {
      log('✗ No MCP servers configured', colors.red);
      return false;
    }
    
    log(`✓ Found ${servers.length} MCP servers:`, colors.green);
    servers.forEach(server => {
      const serverConfig = config.mcpServers[server];
      log(`  - ${server}: ${serverConfig.description || 'No description'}`, colors.blue);
    });
    
    return config.mcpServers;
  } catch (error) {
    log(`✗ Error reading MCP config: ${error.message}`, colors.red);
    return false;
  }
}

async function checkNodeVersion() {
  log('\n=== Checking Prerequisites ===', colors.blue);
  
  try {
    const { stdout } = await execPromise('node --version');
    const version = stdout.trim();
    const major = parseInt(version.split('.')[0].substring(1));
    
    if (major >= 18) {
      log(`✓ Node.js ${version} (OK for MCP)`, colors.green);
      return true;
    } else {
      log(`⚠ Node.js ${version} (MCP requires 18+)`, colors.yellow);
      return false;
    }
  } catch (error) {
    log('✗ Node.js not found', colors.red);
    return false;
  }
}

async function checkNpx() {
  try {
    const { stdout } = await execPromise('npx --version');
    log(`✓ npx ${stdout.trim()} installed`, colors.green);
    return true;
  } catch (error) {
    log('✗ npx not found', colors.red);
    log('  Install with: npm install -g npx');
    return false;
  }
}

async function testMCPServer(name, config) {
  log(`\nTesting ${name}...`, colors.blue);
  
  // Check for environment variables that need configuration
  if (config.env) {
    const needsConfig = Object.entries(config.env).filter(([key, value]) => 
      value.includes('your_') || value.includes('YOUR_')
    );
    
    if (needsConfig.length > 0) {
      log(`⚠ ${name} needs configuration:`, colors.yellow);
      needsConfig.forEach(([key]) => {
        log(`  - Update ${key} in mcp.json`, colors.yellow);
      });
      return false;
    }
  }
  
  // Check if the server package exists
  const packageName = config.args.find(arg => arg.startsWith('@'));
  if (packageName) {
    log(`  Package: ${packageName}`, colors.blue);
    log(`  ✓ Server configured (will download on first use)`, colors.green);
    return true;
  }
  
  return false;
}

async function checkDatabaseConnection(servers) {
  if (!servers.postgres) {
    log('\n⚠ PostgreSQL server not configured', colors.yellow);
    return;
  }
  
  log('\n=== Database Configuration ===', colors.blue);
  
  const pgConfig = servers.postgres;
  if (pgConfig.env && pgConfig.env.POSTGRES_CONNECTION_STRING) {
    const connStr = pgConfig.env.POSTGRES_CONNECTION_STRING;
    
    if (connStr.includes('your_') || connStr.includes('YOUR_')) {
      log('⚠ Database connection needs configuration:', colors.yellow);
      log('  1. Get connection string from Supabase Dashboard', colors.yellow);
      log('  2. Update POSTGRES_CONNECTION_STRING in mcp.json', colors.yellow);
      log('  3. See .env.mcp.droid.example for format', colors.yellow);
    } else {
      // Parse and display connection info (hide password)
      const match = connStr.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (match) {
        const [, user, , host, port, database] = match;
        log('✓ Database configured:', colors.green);
        log(`  Host: ${host}`, colors.blue);
        log(`  Port: ${port}`, colors.blue);
        log(`  Database: ${database}`, colors.blue);
        log(`  User: ${user}`, colors.blue);
      }
    }
  }
}

async function checkProjectPath(servers) {
  log('\n=== Project Configuration ===', colors.blue);
  
  const projectPath = 'D:/hospital-management-V2';
  
  // Check filesystem server
  if (servers.filesystem) {
    const fsPath = servers.filesystem.args.find(arg => arg.startsWith('D:/') || arg.startsWith('C:/'));
    if (fsPath === projectPath) {
      log(`✓ FileSystem server configured for: ${projectPath}`, colors.green);
    }
  }
  
  // Check git server
  if (servers.git) {
    const repoIndex = servers.git.args.indexOf('--repository');
    if (repoIndex !== -1 && servers.git.args[repoIndex + 1] === projectPath) {
      log(`✓ Git server configured for: ${projectPath}`, colors.green);
    }
  }
  
  // Verify project exists
  if (fs.existsSync(projectPath)) {
    log(`✓ Project path exists: ${projectPath}`, colors.green);
    
    // Check for important project files
    const checkFiles = [
      'package.json',
      'backend/services-v2/identity-service',
      'backend/services-v2/patient-registry-service'
    ];
    
    checkFiles.forEach(file => {
      const fullPath = path.join(projectPath, file);
      if (fs.existsSync(fullPath)) {
        log(`  ✓ Found: ${file}`, colors.green);
      }
    });
  } else {
    log(`✗ Project path not found: ${projectPath}`, colors.red);
  }
}

async function generateSummary(servers) {
  log('\n' + '='.repeat(50), colors.blue);
  log('DROID MCP SETUP SUMMARY', colors.blue);
  log('='.repeat(50), colors.blue);
  
  const configured = [];
  const needsSetup = [];
  
  Object.entries(servers).forEach(([name, config]) => {
    if (config.env) {
      const hasPlaceholder = Object.values(config.env).some(v => 
        v.includes('your_') || v.includes('YOUR_')
      );
      if (hasPlaceholder) {
        needsSetup.push(name);
      } else {
        configured.push(name);
      }
    } else {
      configured.push(name);
    }
  });
  
  if (configured.length > 0) {
    log('\n✓ Ready to use:', colors.green);
    configured.forEach(name => log(`  - ${name}`, colors.green));
  }
  
  if (needsSetup.length > 0) {
    log('\n⚠ Needs configuration:', colors.yellow);
    needsSetup.forEach(name => log(`  - ${name}`, colors.yellow));
  }
  
  log('\n📝 Next Steps:', colors.blue);
  log('1. Update connection strings in mcp.json', colors.reset);
  log('2. Restart Droid to activate MCP servers', colors.reset);
  log('3. In Droid, type: "Show available MCP tools"', colors.reset);
  log('4. Test with: "List files in project"', colors.reset);
}

async function main() {
  console.clear();
  log('╔═══════════════════════════════════════╗', colors.blue);
  log('║   DROID MCP CONNECTION TEST          ║', colors.blue);
  log('║   Hospital Management V2 Project      ║', colors.blue);
  log('╚═══════════════════════════════════════╝', colors.blue);
  
  // Check prerequisites
  const nodeOk = await checkNodeVersion();
  const npxOk = await checkNpx();
  
  if (!nodeOk || !npxOk) {
    log('\n✗ Prerequisites not met', colors.red);
    process.exit(1);
  }
  
  // Check MCP config
  const servers = await checkMCPConfig();
  if (!servers) {
    log('\n✗ MCP configuration issues detected', colors.red);
    log('Please check mcp.json file', colors.yellow);
    process.exit(1);
  }
  
  // Test each server
  log('\n=== Testing MCP Servers ===', colors.blue);
  for (const [name, config] of Object.entries(servers)) {
    await testMCPServer(name, config);
  }
  
  // Check specific configurations
  await checkDatabaseConnection(servers);
  await checkProjectPath(servers);
  
  // Generate summary
  await generateSummary(servers);
  
  log('\n✨ Test complete!', colors.green);
  log(`Config location: ${MCP_CONFIG_PATH}`, colors.blue);
}

// Run the test
main().catch(error => {
  log(`\n✗ Test failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
