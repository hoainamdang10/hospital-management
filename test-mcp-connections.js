#!/usr/bin/env node

/**
 * Script để test MCP connections
 * Run: node test-mcp-connections.js
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function testMCPServer(name, command, args) {
  console.log(`\nTesting ${name}...`);
  
  try {
    const fullCommand = `${command} ${args.join(' ')} --version`;
    const { stdout, stderr } = await execPromise(fullCommand);
    
    if (stdout || !stderr) {
      console.log(`${colors.green}✓ ${name} is available${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ ${name} error: ${stderr}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ ${name} not available${colors.reset}`);
    console.log(`  Install with: npm install -g ${args[1]}`);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\nTesting database connection...');
  
  // Get connection string from environment or config
  const connectionString = process.env.POSTGRES_CONNECTION_STRING || 
    'postgresql://postgres:password@localhost:5432/postgres';
  
  // Parse connection string
  const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (match) {
    const [, user, , host, port, database] = match;
    console.log(`  Host: ${host}`);
    console.log(`  Port: ${port}`);
    console.log(`  Database: ${database}`);
    console.log(`  User: ${user}`);
    console.log(`${colors.yellow}  Note: Actual connection test requires pg module${colors.reset}`);
  } else {
    console.log(`${colors.red}  Invalid connection string format${colors.reset}`);
  }
}

async function checkNodeVersion() {
  console.log('\nChecking Node.js version...');
  
  try {
    const { stdout } = await execPromise('node --version');
    const version = stdout.trim();
    const major = parseInt(version.split('.')[0].substring(1));
    
    if (major >= 18) {
      console.log(`${colors.green}✓ Node.js ${version} (OK for MCP)${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠ Node.js ${version} (MCP requires 18+)${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Node.js not found${colors.reset}`);
    return false;
  }
}

async function checkNpx() {
  console.log('\nChecking npx...');
  
  try {
    const { stdout } = await execPromise('npx --version');
    console.log(`${colors.green}✓ npx ${stdout.trim()} installed${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ npx not found${colors.reset}`);
    console.log(`  Install with: npm install -g npx`);
    return false;
  }
}

async function main() {
  console.log('=================================');
  console.log('MCP Connection Test for Droid');
  console.log('=================================');
  
  // Check prerequisites
  const nodeOk = await checkNodeVersion();
  const npxOk = await checkNpx();
  
  if (!nodeOk || !npxOk) {
    console.log(`\n${colors.red}Prerequisites not met. Please install Node.js 18+ and npx.${colors.reset}`);
    process.exit(1);
  }
  
  // Test MCP servers
  console.log('\n=== Testing MCP Servers ===');
  
  const servers = [
    { name: 'Context7', command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
    { name: 'Playwright', command: 'npx', args: ['-y', '@playwright-mcp@latest'] },
    { name: 'PostgreSQL', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'] },
    { name: 'FileSystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
    { name: 'Git', command: 'npx', args: ['-y', '@modelcontextprotocol/server-git'] },
    { name: 'Fetch', command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'] },
    { name: 'Time', command: 'npx', args: ['-y', '@modelcontextprotocol/server-time'] },
    { name: 'Knowledge-Graph', command: 'npx', args: ['-y', 'mcp-knowledge-graph'] }
  ];
  
  let successful = 0;
  for (const server of servers) {
    if (await testMCPServer(server.name, server.command, server.args)) {
      successful++;
    }
  }
  
  // Test database connection
  await testDatabaseConnection();
  
  // Summary
  console.log('\n=================================');
  console.log(`Summary: ${successful}/${servers.length} MCP servers available`);
  
  if (successful === servers.length) {
    console.log(`${colors.green}All MCP servers are ready!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Some MCP servers need installation.${colors.reset}`);
    console.log('Run this script again after installing missing servers.');
  }
  
  console.log('\nNext steps:');
  console.log('1. Update connection strings in config.toml');
  console.log('2. Restart Droid to activate MCP servers');
  console.log('3. Test with: "Show available MCP tools"');
}

main().catch(console.error);
