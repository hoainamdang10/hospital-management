/**
 * Identity Service Authentication Test
 * Test script để verify authentication implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3021';

// Test data
const testUser = {
  email: 'test.doctor@hospital.vn',
  password: 'TestPassword123!',
  fullName: 'Bác sĩ Nguyễn Văn A',
  phoneNumber: '0123456789',
  dateOfBirth: '1985-01-01',
  role: 'doctor'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function testHealthCheck() {
  log('\n🏥 Testing Health Check...', 'blue');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    log('✅ Health check passed', 'green');
    log(`   Service: ${result.data.service}`, 'green');
    log(`   Status: ${result.data.status}`, 'green');
    return true;
  } else {
    log('❌ Health check failed', 'red');
    log(`   Error: ${JSON.stringify(result.error)}`, 'red');
    return false;
  }
}

async function testUserRegistration() {
  log('\n👤 Testing User Registration...', 'blue');
  
  const result = await makeRequest('POST', '/api/v1/auth/register', testUser);
  
  if (result.success) {
    log('✅ User registration successful', 'green');
    log(`   User ID: ${result.data.data?.userId}`, 'green');
    log(`   Email: ${result.data.data?.email}`, 'green');
    return result.data.data;
  } else {
    log('❌ User registration failed', 'red');
    log(`   Status: ${result.status}`, 'red');
    log(`   Error: ${JSON.stringify(result.error)}`, 'red');
    return null;
  }
}

async function testUserLogin() {
  log('\n🔐 Testing User Login...', 'blue');
  
  const loginData = {
    email: testUser.email,
    password: testUser.password,
    rememberMe: false
  };
  
  const result = await makeRequest('POST', '/api/v1/auth/login', loginData);
  
  if (result.success) {
    log('✅ User login successful', 'green');
    log(`   Access Token: ${result.data.data?.accessToken?.substring(0, 20)}...`, 'green');
    log(`   User Role: ${result.data.data?.user?.healthcareRole?.name}`, 'green');
    return result.data.data;
  } else {
    log('❌ User login failed', 'red');
    log(`   Status: ${result.status}`, 'red');
    log(`   Error: ${JSON.stringify(result.error)}`, 'red');
    return null;
  }
}

async function testGetUserProfile(token) {
  log('\n👨‍⚕️ Testing Get User Profile...', 'blue');
  
  const result = await makeRequest('GET', '/api/v1/auth/me', null, token);
  
  if (result.success) {
    log('✅ Get user profile successful', 'green');
    log(`   User ID: ${result.data.data?.user?.id}`, 'green');
    log(`   Full Name: ${result.data.data?.user?.personalInfo?.fullName}`, 'green');
    log(`   Role: ${result.data.data?.user?.healthcareRole?.name}`, 'green');
    return result.data.data;
  } else {
    log('❌ Get user profile failed', 'red');
    log(`   Status: ${result.status}`, 'red');
    log(`   Error: ${JSON.stringify(result.error)}`, 'red');
    return null;
  }
}

async function testInvalidLogin() {
  log('\n🚫 Testing Invalid Login...', 'blue');
  
  const invalidLoginData = {
    email: testUser.email,
    password: 'WrongPassword123!',
    rememberMe: false
  };
  
  const result = await makeRequest('POST', '/api/v1/auth/login', invalidLoginData);
  
  if (!result.success && result.status === 401) {
    log('✅ Invalid login properly rejected', 'green');
    log(`   Error message: ${result.error.message}`, 'green');
    return true;
  } else {
    log('❌ Invalid login test failed', 'red');
    log(`   Expected 401, got ${result.status}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('🚀 Starting Identity Service Authentication Tests', 'yellow');
  log('=' .repeat(60), 'yellow');
  
  let testResults = {
    healthCheck: false,
    registration: false,
    login: false,
    profile: false,
    invalidLogin: false
  };
  
  try {
    // Test 1: Health Check
    testResults.healthCheck = await testHealthCheck();
    
    if (!testResults.healthCheck) {
      log('\n💥 Service not available. Stopping tests.', 'red');
      return;
    }
    
    // Test 2: User Registration
    const registrationResult = await testUserRegistration();
    testResults.registration = !!registrationResult;
    
    // Test 3: User Login
    const loginResult = await testUserLogin();
    testResults.login = !!loginResult;
    
    if (loginResult?.accessToken) {
      // Test 4: Get User Profile
      const profileResult = await testGetUserProfile(loginResult.accessToken);
      testResults.profile = !!profileResult;
    }
    
    // Test 5: Invalid Login
    testResults.invalidLogin = await testInvalidLogin();
    
  } catch (error) {
    log(`\n💥 Unexpected error: ${error.message}`, 'red');
  }
  
  // Summary
  log('\n📊 Test Results Summary', 'yellow');
  log('=' .repeat(60), 'yellow');
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(Boolean).length;
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test}`, color);
  });
  
  log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`, 
    passedTests === totalTests ? 'green' : 'red');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Identity Service authentication is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the implementation.', 'yellow');
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testUserRegistration,
  testUserLogin,
  testGetUserProfile,
  testInvalidLogin
};
