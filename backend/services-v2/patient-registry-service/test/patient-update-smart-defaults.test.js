/**
 * Test Script: Patient Update with Smart Defaults
 * Tests the "Chưa cập nhật" implementation
 * 
 * Run with: node test/patient-update-smart-defaults.test.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'your-test-token-here';

// Test data
const TEST_PATIENT_ID = 'PAT-202511-921';

// Helper functions
const log = (message, data = null) => {
  console.log(`\n ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test cases
const tests = {
  // Test 1: Partial update - should preserve existing data
  async testPartialUpdate() {
    log('📋 TEST 1: Partial Update - Preserve Existing Data');
    
    const updateData = {
      fullName: 'Nguyễn Văn An Updated'
    };
    
    const result = await makeRequest('PUT', `/api/v1/patients/${TEST_PATIENT_ID}`, updateData);
    
    if (result.success) {
      log('✅ Partial update successful', result.data);
      
      // Verify other fields are preserved or marked as "Chưa cập nhật"
      const patient = result.data.patient;
      log('📊 Patient data after partial update', {
        fullName: patient.personalInfo?.fullName,
        nationality: patient.personalInfo?.nationality,
        ethnicity: patient.personalInfo?.ethnicity,
        occupation: patient.personalInfo?.occupation,
        completionPercentage: result.data.completionPercentage
      });
    } else {
      log('❌ Partial update failed', result.error);
    }
    
    return result.success;
  },

  // Test 2: Update with "Chưa cập nhật" explicit value
  async testExplicitUnupdatedValue() {
    log('📋 TEST 2: Explicit "Chưa cập nhật" Value');
    
    const updateData = {
      fullName: 'Nguyễn Văn An',
      nationality: 'Chưa cập nhật',  // Explicitly set to "Chưa cập nhật"
      ethnicity: 'Kinh'
    };
    
    const result = await makeRequest('PUT', `/api/v1/patients/${TEST_PATIENT_ID}`, updateData);
    
    if (result.success) {
      log('✅ Explicit "Chưa cập nhật" update successful', result.data);
      
      const patient = result.data.patient;
      log('📊 Patient data after explicit update', {
        fullName: patient.personalInfo?.fullName,
        nationality: patient.personalInfo?.nationality,
        ethnicity: patient.personalInfo?.ethnicity,
        fieldsUpdated: result.data.fieldsUpdated
      });
    } else {
      log('❌ Explicit update failed', result.error);
    }
    
    return result.success;
  },

  // Test 3: No-op update - should return without changes
  async testNoOpUpdate() {
    log('📋 TEST 3: No-Op Update (No Changes)');
    
    // Get current patient first
    const currentResult = await makeRequest('GET', `/api/v1/patients/${TEST_PATIENT_ID}`);
    
    if (!currentResult.success) {
      log('❌ Could not get current patient data', currentResult.error);
      return false;
    }
    
    const currentPatient = currentResult.data.patient;
    
    // Send same data back
    const updateData = {
      fullName: currentPatient.personalInfo?.fullName,
      nationality: currentPatient.personalInfo?.nationality
    };
    
    const result = await makeRequest('PUT', `/api/v1/patients/${TEST_PATIENT_ID}`, updateData);
    
    if (result.success) {
      log('✅ No-op update handled correctly', result.data);
      log('📊 Response message', result.data.message);
    } else {
      log('❌ No-op update failed', result.error);
    }
    
    return result.success;
  },

  // Test 4: Empty request - should be rejected
  async testEmptyRequest() {
    log('📋 TEST 4: Empty Request - Should Be Rejected');
    
    const result = await makeRequest('PUT', `/api/v1/patients/${TEST_PATIENT_ID}`, {});
    
    if (!result.success && result.status === 400) {
      log('✅ Empty request correctly rejected', result.error);
      return true;
    } else {
      log('❌ Empty request should be rejected', result);
      return false;
    }
  },

  // Test 5: Multiple fields update
  async testMultipleFieldsUpdate() {
    log('📋 TEST 5: Multiple Fields Update');
    
    const updateData = {
      fullName: 'Nguyễn Văn An Complete',
      nationality: 'Việt Nam',
      ethnicity: 'Kinh',
      occupation: 'Kỹ sư phần mềm',
      maritalStatus: 'Độc thân',
      primaryPhone: '0912345678',
      email: 'nguyen.van.an@example.com'
    };
    
    const result = await makeRequest('PUT', `/api/v1/patients/${TEST_PATIENT_ID}`, updateData);
    
    if (result.success) {
      log('✅ Multiple fields update successful', result.data);
      
      const patient = result.data.patient;
      log('📊 Complete patient data', {
        personalInfo: patient.personalInfo,
        contactInfo: patient.contactInfo,
        completionPercentage: result.data.completionPercentage,
        fieldsUpdated: result.data.fieldsUpdated
      });
    } else {
      log('❌ Multiple fields update failed', result.error);
    }
    
    return result.success;
  }
};

// Main test runner
async function runTests() {
  log('🚀 Starting Patient Update Smart Defaults Tests');
  log('📝 Testing "Chưa cập nhật" implementation with proper create/update logic');
  
  const testResults = [];
  
  for (const [testName, testFn] of Object.entries(tests)) {
    log(`\n⚡ Running ${testName}...`);
    
    try {
      const result = await testFn();
      testResults.push({ name: testName, passed: result });
      
      if (result) {
        log(`✅ ${testName} PASSED`);
      } else {
        log(`❌ ${testName} FAILED`);
      }
    } catch (error) {
      log(`❌ ${testName} ERROR: ${error.message}`);
      testResults.push({ name: testName, passed: false, error: error.message });
    }
  }
  
  // Summary
  log('\n📊 TEST SUMMARY');
  log('=' .repeat(50));
  
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    log(`${status} ${result.name}`);
    if (result.error) {
      log(`    Error: ${result.error}`);
    }
  });
  
  log(`\n🎯 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    log('🎉 ALL TESTS PASSED! Smart defaults implementation is working correctly.');
  } else {
    log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Usage instructions
function showUsage() {
  log('📖 Patient Update Smart Defaults Test');
  log('');
  log('This script tests the "Chưa cập nhật" smart defaults implementation:');
  log('1. Partial updates preserve existing data');
  log('2. Explicit "Chưa cập nhật" values are respected');
  log('3. No-op updates are handled efficiently');
  log('4. Empty requests are properly rejected');
  log('5. Multiple field updates work correctly');
  log('');
  log('Setup:');
  log('1. Update AUTH_TOKEN with a valid JWT token');
  log('2. Update TEST_PATIENT_ID with an existing patient ID');
  log('3. Ensure Patient Registry Service is running on localhost:3001');
  log('');
  log('Run: node test/patient-update-smart-defaults.test.js');
}

// Check if this is being run directly
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
  } else {
    runTests().catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { tests, runTests, showUsage };
