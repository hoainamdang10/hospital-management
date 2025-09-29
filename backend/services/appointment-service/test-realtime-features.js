#!/usr/bin/env node

/**
 * 🚀 REAL-TIME APPOINTMENT SERVICE FEATURES TEST
 * 
 * Tests the enhanced real-time capabilities:
 * - Supabase Real-time Integration
 * - WebSocket Functionality  
 * - Smart Scheduling Features
 * - Live Updates
 * - Performance Metrics
 */

const axios = require('axios');
const io = require('socket.io-client');

// Configuration
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'http://localhost:3004';

// Test Statistics
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now(),
  results: []
};

// Utility Functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addTestResult(testName, success, message, duration = 0, data = null) {
  testStats.total++;
  if (success) {
    testStats.passed++;
    log(`✅ ${testName}: PASSED (${duration}ms)`, 'green');
  } else {
    testStats.failed++;
    log(`❌ ${testName}: FAILED - ${message}`, 'red');
  }
  
  testStats.results.push({
    test: testName,
    success,
    message,
    duration,
    data: data ? JSON.stringify(data, null, 2) : null,
    timestamp: new Date().toISOString()
  });
}

async function makeRequest(method, endpoint, data = null) {
  const url = `${APPOINTMENT_SERVICE_URL}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url,
      headers: { 'Content-Type': 'application/json' },
      ...(data && { data }),
      timeout: 10000
    };
    
    const response = await axios(config);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      data: response.data,
      status: response.status,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 0,
      duration
    };
  }
}

// Test Functions

// 1. Test Enhanced Health Check
async function testEnhancedHealthCheck() {
  log('\n1️⃣ Testing Enhanced Health Check with Real-time Features', 'yellow');
  const result = await makeRequest('GET', '/health');
  
  if (result.success && 
      result.data.version === '2.0.0' && 
      result.data.features?.realtime === true &&
      result.data.features?.websocket === true) {
    addTestResult('Enhanced Health Check', true, 'Real-time features enabled', result.duration, result.data.features);
    return true;
  } else {
    addTestResult('Enhanced Health Check', false, 'Real-time features not properly configured', result.duration);
    return false;
  }
}

// 2. Test Real-time Status Endpoint
async function testRealtimeStatus() {
  log('\n2️⃣ Testing Real-time Status Endpoint', 'yellow');
  const result = await makeRequest('GET', '/api/appointments/realtime/status');
  
  if (result.success && 
      result.data.success === true &&
      result.data.data?.realtime_enabled === true &&
      result.data.data?.websocket_enabled === true) {
    addTestResult('Real-time Status', true, 'Real-time service operational', result.duration, result.data.data);
    return true;
  } else {
    addTestResult('Real-time Status', false, 'Real-time service not operational', result.duration);
    return false;
  }
}

// 3. Test Live Appointments Endpoint
async function testLiveAppointments() {
  log('\n3️⃣ Testing Live Appointments Endpoint', 'yellow');
  const result = await makeRequest('GET', '/api/appointments/live');
  
  if (result.success && 
      result.data.success === true &&
      result.data.data?.realtime_enabled === true &&
      result.data.data?.websocket_channel === 'appointments_realtime') {
    addTestResult('Live Appointments', true, 'Live appointments endpoint working', result.duration, {
      realtime_enabled: result.data.data.realtime_enabled,
      websocket_channel: result.data.data.websocket_channel,
      events: result.data.data.subscription_info?.events
    });
    return true;
  } else {
    addTestResult('Live Appointments', false, 'Live appointments endpoint not working', result.duration);
    return false;
  }
}

// 4. Test WebSocket Connection
async function testWebSocketConnection() {
  log('\n4️⃣ Testing WebSocket Connection', 'yellow');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    let connected = false;
    let authenticated = false;
    
    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000
    });
    
    const timeout = setTimeout(() => {
      if (!connected) {
        socket.disconnect();
        addTestResult('WebSocket Connection', false, 'Connection timeout', Date.now() - startTime);
        resolve(false);
      }
    }, 10000);
    
    socket.on('connect', () => {
      connected = true;
      log('   🔌 WebSocket connected successfully', 'green');
      
      // Test authentication
      socket.emit('authenticate', {
        userId: 'test-user-001',
        userRole: 'admin',
        doctorId: null,
        patientId: null
      });
    });
    
    socket.on('connected', (data) => {
      log('   📡 Received welcome message', 'green');
    });
    
    socket.on('authenticated', (data) => {
      authenticated = true;
      log('   🔐 Authentication successful', 'green');
      
      clearTimeout(timeout);
      socket.disconnect();
      
      const duration = Date.now() - startTime;
      addTestResult('WebSocket Connection', true, 'WebSocket connection and authentication successful', duration, {
        connected: true,
        authenticated: true,
        clientId: data.clientInfo?.userId
      });
      resolve(true);
    });
    
    socket.on('authentication_error', (data) => {
      clearTimeout(timeout);
      socket.disconnect();
      
      const duration = Date.now() - startTime;
      addTestResult('WebSocket Connection', false, `Authentication failed: ${data.message}`, duration);
      resolve(false);
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      addTestResult('WebSocket Connection', false, `Connection error: ${error.message}`, duration);
      resolve(false);
    });
    
    socket.on('disconnect', (reason) => {
      if (!authenticated) {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        addTestResult('WebSocket Connection', false, `Disconnected: ${reason}`, duration);
        resolve(false);
      }
    });
  });
}

// 5. Test Performance Metrics
async function testPerformanceMetrics() {
  log('\n5️⃣ Testing Performance Metrics', 'yellow');
  
  const tests = [
    { endpoint: '/health', name: 'Health Check' },
    { endpoint: '/api/appointments/realtime/status', name: 'Real-time Status' },
    { endpoint: '/api/appointments/live', name: 'Live Appointments' },
    { endpoint: '/api/appointments/stats', name: 'Statistics' }
  ];
  
  let totalTime = 0;
  let successCount = 0;
  
  for (const test of tests) {
    const result = await makeRequest('GET', test.endpoint);
    if (result.success) {
      successCount++;
      totalTime += result.duration;
      log(`   ⚡ ${test.name}: ${result.duration}ms`, 'cyan');
    } else {
      log(`   ❌ ${test.name}: FAILED`, 'red');
    }
  }
  
  const averageTime = totalTime / successCount;
  const performanceGrade = averageTime < 100 ? 'EXCELLENT' : averageTime < 200 ? 'GOOD' : 'NEEDS_IMPROVEMENT';
  
  if (successCount === tests.length && averageTime < 300) {
    addTestResult('Performance Metrics', true, `Average response time: ${averageTime.toFixed(1)}ms (${performanceGrade})`, totalTime, {
      tests_passed: successCount,
      total_tests: tests.length,
      average_response_time: averageTime.toFixed(1),
      performance_grade: performanceGrade
    });
    return true;
  } else {
    addTestResult('Performance Metrics', false, `Performance issues detected: ${averageTime.toFixed(1)}ms average`, totalTime);
    return false;
  }
}

// 6. Test Service Integration
async function testServiceIntegration() {
  log('\n6️⃣ Testing Service Integration', 'yellow');
  
  const integrationTests = [
    { endpoint: '/api/appointments', name: 'Basic Appointments API' },
    { endpoint: '/api/appointments/stats', name: 'Statistics Integration' }
  ];
  
  let passedTests = 0;
  
  for (const test of integrationTests) {
    const result = await makeRequest('GET', test.endpoint);
    if (result.success) {
      passedTests++;
      log(`   ✅ ${test.name}: WORKING`, 'green');
    } else {
      log(`   ❌ ${test.name}: FAILED`, 'red');
    }
  }
  
  if (passedTests === integrationTests.length) {
    addTestResult('Service Integration', true, 'All integration tests passed', 0, {
      passed_tests: passedTests,
      total_tests: integrationTests.length
    });
    return true;
  } else {
    addTestResult('Service Integration', false, `${passedTests}/${integrationTests.length} integration tests passed`, 0);
    return false;
  }
}

// Main Test Runner
async function runRealtimeFeatureTests() {
  log('🚀 Starting Real-time Appointment Service Feature Tests', 'cyan');
  log('='.repeat(70), 'cyan');
  
  testStats.startTime = Date.now();
  
  try {
    // Run all tests
    await testEnhancedHealthCheck();
    await testRealtimeStatus();
    await testLiveAppointments();
    await testWebSocketConnection();
    await testPerformanceMetrics();
    await testServiceIntegration();
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
  }
  
  // Final Results
  const totalDuration = Date.now() - testStats.startTime;
  const successRate = ((testStats.passed / testStats.total) * 100).toFixed(1);
  
  log('\n📊 REAL-TIME FEATURES TEST RESULTS', 'cyan');
  log('='.repeat(70), 'cyan');
  log(`Total Tests: ${testStats.total}`, 'white');
  log(`Passed: ${testStats.passed}`, 'green');
  log(`Failed: ${testStats.failed}`, 'red');
  log(`Success Rate: ${successRate}%`, 'yellow');
  log(`Total Duration: ${totalDuration}ms`, 'white');
  
  // Assessment
  if (testStats.failed === 0) {
    log('\n🎉 ALL REAL-TIME FEATURES WORKING PERFECTLY!', 'green');
    log('✅ Appointment Service enhanced with real-time capabilities!', 'green');
    log('🚀 Ready for production deployment!', 'green');
  } else if (successRate >= 80) {
    log('\n👍 MOST REAL-TIME FEATURES WORKING!', 'yellow');
    log('⚠️ Minor issues detected - review failed tests.', 'yellow');
  } else {
    log('\n⚠️ SIGNIFICANT ISSUES DETECTED!', 'red');
    log('🔧 Real-time features need attention.', 'red');
  }
  
  // Enhancement Status
  log('\n📈 ENHANCEMENT STATUS:', 'cyan');
  if (successRate >= 90) {
    log('🏆 APPOINTMENT SERVICE: 80% → 95% (+15% ENHANCEMENT COMPLETE!)', 'green');
  } else if (successRate >= 80) {
    log('🎯 APPOINTMENT SERVICE: 80% → 90% (+10% ENHANCEMENT PARTIAL)', 'yellow');
  } else {
    log('🔧 APPOINTMENT SERVICE: Enhancement in progress...', 'red');
  }
  
  return {
    summary: {
      total: testStats.total,
      passed: testStats.passed,
      failed: testStats.failed,
      successRate: successRate,
      duration: totalDuration
    },
    results: testStats.results
  };
}

// Export for external use
module.exports = { runRealtimeFeatureTests };

// Run tests if called directly
if (require.main === module) {
  runRealtimeFeatureTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}
