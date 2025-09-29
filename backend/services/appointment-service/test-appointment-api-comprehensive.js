#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE APPOINTMENT SERVICE API TESTS
 * 
 * Tests all Appointment Service endpoints with enhanced validation
 * - Booking logic (4 tests)
 * - Conflict resolution (3 tests)
 * - Real-time features (2 tests)
 * - Calendar integration (2 tests)
 * - Notification tests (1 test)
 * 
 * Total: 12 tests for 100% API coverage
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Test Statistics
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now(),
  endTime: null,
  results: []
};

// Test Data
const testAppointment = {
  patient_id: 'PAT-202406-001', // Mock patient ID
  doctor_id: 'DOC-HN-001', // Mock doctor ID
  appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
  appointment_time: '10:00',
  appointment_type: 'consultation',
  notes: 'Regular checkup appointment for testing',
  status: 'scheduled'
};

let createdAppointmentId = null;
let authToken = null;

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

async function makeRequest(method, endpoint, data = null, useGateway = true) {
  const baseUrl = useGateway ? API_GATEWAY_URL : APPOINTMENT_SERVICE_URL;
  const url = `${baseUrl}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
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

// Authentication Helper
async function authenticateTestUser() {
  try {
    log('\n🔐 Authenticating test user...', 'cyan');
    
    // Create test admin user
    const adminUser = {
      email: `admin.appointment.${crypto.randomBytes(4).toString('hex')}@hospital.com`,
      password: 'TestPassword123!',
      full_name: 'Test Admin Appointment',
      role: 'admin'
    };
    
    // Register admin
    const registerResult = await makeRequest('POST', '/api/auth/register', adminUser, true);
    if (!registerResult.success) {
      log(`Registration failed: ${registerResult.error}`, 'red');
      return false;
    }
    
    // Login admin
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: adminUser.email,
      password: adminUser.password
    }, true);
    
    if (loginResult.success && loginResult.data.token) {
      authToken = loginResult.data.token;
      log('✅ Authentication successful', 'green');
      return true;
    } else {
      log(`Login failed: ${loginResult.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`Authentication error: ${error.message}`, 'red');
    return false;
  }
}

// Test Functions

// 1. Booking Logic Tests (4 tests)
async function testHealthCheck() {
  log('\n1️⃣ Testing Health Check', 'yellow');
  const result = await makeRequest('GET', '/health', null, false);
  
  if (result.success && result.status === 200) {
    addTestResult('Health Check', true, 'Service is healthy', result.duration);
    return true;
  } else {
    addTestResult('Health Check', false, result.error, result.duration);
    return false;
  }
}

async function testCreateAppointment() {
  log('\n2️⃣ Testing Create Appointment', 'yellow');
  const result = await makeRequest('POST', '/api/appointments', testAppointment, true);
  
  if (result.success && result.data.appointment_id) {
    createdAppointmentId = result.data.appointment_id;
    addTestResult('Create Appointment', true, `Appointment created with ID: ${createdAppointmentId}`, result.duration, result.data);
    return true;
  } else {
    addTestResult('Create Appointment', false, result.error, result.duration);
    return false;
  }
}

async function testGetAllAppointments() {
  log('\n3️⃣ Testing Get All Appointments', 'yellow');
  const result = await makeRequest('GET', '/api/appointments', null, true);
  
  if (result.success && Array.isArray(result.data.data)) {
    addTestResult('Get All Appointments', true, `Retrieved ${result.data.data.length} appointments`, result.duration);
    return true;
  } else {
    addTestResult('Get All Appointments', false, result.error, result.duration);
    return false;
  }
}

async function testGetAppointmentById() {
  log('\n4️⃣ Testing Get Appointment by ID', 'yellow');
  
  if (!createdAppointmentId) {
    addTestResult('Get Appointment by ID', false, 'No appointment ID available');
    return false;
  }
  
  const result = await makeRequest('GET', `/api/appointments/${createdAppointmentId}`, null, true);
  
  if (result.success && result.data.appointment_id === createdAppointmentId) {
    addTestResult('Get Appointment by ID', true, `Retrieved appointment for ${result.data.patient_id}`, result.duration, result.data);
    return true;
  } else {
    addTestResult('Get Appointment by ID', false, result.error, result.duration);
    return false;
  }
}

// 2. Conflict Resolution Tests (3 tests)
async function testConflictDetection() {
  log('\n5️⃣ Testing Appointment Conflict Detection', 'yellow');
  
  // Try to create conflicting appointment
  const conflictingAppointment = {
    ...testAppointment,
    patient_id: 'PAT-202406-002' // Different patient, same time slot
  };
  
  const result = await makeRequest('POST', '/api/appointments', conflictingAppointment, true);
  
  // Should fail due to conflict
  if (!result.success && result.error.includes('conflict')) {
    addTestResult('Conflict Detection', true, 'Conflict properly detected', result.duration);
    return true;
  } else {
    addTestResult('Conflict Detection', false, 'Conflict not detected', result.duration);
    return false;
  }
}

async function testAvailabilityCheck() {
  log('\n6️⃣ Testing Doctor Availability Check', 'yellow');
  
  const result = await makeRequest('GET', `/api/appointments/availability?doctor_id=${testAppointment.doctor_id}&date=${testAppointment.appointment_date}`, null, true);
  
  if (result.success && Array.isArray(result.data.available_slots)) {
    addTestResult('Availability Check', true, `Found ${result.data.available_slots.length} available slots`, result.duration);
    return true;
  } else {
    addTestResult('Availability Check', false, result.error, result.duration);
    return false;
  }
}

async function testRescheduleAppointment() {
  log('\n7️⃣ Testing Reschedule Appointment', 'yellow');
  
  if (!createdAppointmentId) {
    addTestResult('Reschedule Appointment', false, 'No appointment ID available');
    return false;
  }
  
  const rescheduleData = {
    appointment_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
    appointment_time: '14:00'
  };
  
  const result = await makeRequest('PUT', `/api/appointments/${createdAppointmentId}/reschedule`, rescheduleData, true);
  
  if (result.success) {
    addTestResult('Reschedule Appointment', true, 'Appointment rescheduled successfully', result.duration, result.data);
    return true;
  } else {
    addTestResult('Reschedule Appointment', false, result.error, result.duration);
    return false;
  }
}

// 3. Real-time Features Tests (2 tests)
async function testAppointmentStatusUpdate() {
  log('\n8️⃣ Testing Real-time Status Update', 'yellow');
  
  if (!createdAppointmentId) {
    addTestResult('Status Update', false, 'No appointment ID available');
    return false;
  }
  
  const statusUpdate = {
    status: 'confirmed',
    notes: 'Patient confirmed attendance'
  };
  
  const result = await makeRequest('PUT', `/api/appointments/${createdAppointmentId}/status`, statusUpdate, true);
  
  if (result.success) {
    addTestResult('Status Update', true, 'Status updated successfully', result.duration, result.data);
    return true;
  } else {
    addTestResult('Status Update', false, result.error, result.duration);
    return false;
  }
}

async function testLiveAppointmentTracking() {
  log('\n9️⃣ Testing Live Appointment Tracking', 'yellow');
  
  const result = await makeRequest('GET', '/api/appointments/live', null, true);
  
  if (result.success && Array.isArray(result.data.appointments)) {
    addTestResult('Live Tracking', true, `Tracking ${result.data.appointments.length} live appointments`, result.duration);
    return true;
  } else {
    addTestResult('Live Tracking', false, result.error, result.duration);
    return false;
  }
}

// 4. Calendar Integration Tests (2 tests)
async function testCalendarView() {
  log('\n🔟 Testing Calendar View', 'yellow');
  
  const today = new Date().toISOString().split('T')[0];
  const result = await makeRequest('GET', `/api/appointments/calendar?date=${today}`, null, true);
  
  if (result.success && result.data.calendar) {
    addTestResult('Calendar View', true, 'Calendar data retrieved successfully', result.duration);
    return true;
  } else {
    addTestResult('Calendar View', false, result.error, result.duration);
    return false;
  }
}

async function testWeeklySchedule() {
  log('\n1️⃣1️⃣ Testing Weekly Schedule', 'yellow');
  
  const result = await makeRequest('GET', `/api/appointments/schedule/weekly?doctor_id=${testAppointment.doctor_id}`, null, true);
  
  if (result.success && Array.isArray(result.data.schedule)) {
    addTestResult('Weekly Schedule', true, 'Weekly schedule retrieved successfully', result.duration);
    return true;
  } else {
    addTestResult('Weekly Schedule', false, result.error, result.duration);
    return false;
  }
}

// 5. Notification Test (1 test)
async function testAppointmentNotifications() {
  log('\n1️⃣2️⃣ Testing Appointment Notifications', 'yellow');
  
  if (!createdAppointmentId) {
    addTestResult('Notifications', false, 'No appointment ID available');
    return false;
  }
  
  const result = await makeRequest('POST', `/api/appointments/${createdAppointmentId}/notify`, {
    type: 'reminder',
    message: 'Appointment reminder test'
  }, true);
  
  if (result.success) {
    addTestResult('Notifications', true, 'Notification sent successfully', result.duration);
    return true;
  } else {
    addTestResult('Notifications', false, result.error, result.duration);
    return false;
  }
}

// Main Test Runner
async function runComprehensiveTests() {
  log('🚀 Starting Comprehensive Appointment Service API Tests', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  testStats.startTime = Date.now();
  
  try {
    // Authentication
    const authSuccess = await authenticateTestUser();
    if (!authSuccess) {
      log('❌ Authentication failed. Aborting tests.', 'red');
      return;
    }
    
    // Run all tests
    await testHealthCheck();
    await testCreateAppointment();
    await testGetAllAppointments();
    await testGetAppointmentById();
    
    await testConflictDetection();
    await testAvailabilityCheck();
    await testRescheduleAppointment();
    
    await testAppointmentStatusUpdate();
    await testLiveAppointmentTracking();
    
    await testCalendarView();
    await testWeeklySchedule();
    
    await testAppointmentNotifications();
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
  }
  
  // Final Results
  testStats.endTime = Date.now();
  const totalDuration = testStats.endTime - testStats.startTime;
  
  log('\n📊 COMPREHENSIVE TEST RESULTS', 'cyan');
  log('=' .repeat(60), 'cyan');
  log(`Total Tests: ${testStats.total}`, 'white');
  log(`Passed: ${testStats.passed}`, 'green');
  log(`Failed: ${testStats.failed}`, 'red');
  log(`Success Rate: ${((testStats.passed / testStats.total) * 100).toFixed(1)}%`, 'yellow');
  log(`Total Duration: ${totalDuration}ms`, 'white');
  
  if (testStats.passed === testStats.total) {
    log('\n🎉 ALL TESTS PASSED! Appointment Service is ready for production.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review and fix issues.', 'yellow');
  }
  
  // Export results for external use
  return {
    summary: {
      total: testStats.total,
      passed: testStats.passed,
      failed: testStats.failed,
      successRate: ((testStats.passed / testStats.total) * 100).toFixed(1),
      duration: totalDuration
    },
    results: testStats.results,
    createdAppointmentId
  };
}

// Export for external use
module.exports = {
  runComprehensiveTests,
  testStats
};

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}
