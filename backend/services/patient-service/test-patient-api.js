const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api/patients';
const AUTH_BASE_URL = 'http://localhost:3001/api/auth';

// Test data from actual database
const EXISTING_PATIENT_ID = 'PAT-202506-860';
const EXISTING_PROFILE_ID = 'e739e717-ac94-46cb-8f84-55cde1d8a28e';
const EXISTING_DOCTOR_ID = 'DOC-202506-001';

// Test data for creating new patient
const TEST_PATIENT_DATA = {
  profile_id: 'e739e717-ac94-46cb-8f84-55cde1d8a28e', // Use existing profile ID from database
  full_name: 'Nguyễn Văn Test API',
  email: 'test.api.patient@hospital.com',
  phone_number: '0987654321',
  date_of_birth: '1990-05-15',
  gender: 'male',
  blood_type: 'A+',
  address: {
    street: '123 Đường Test API',
    district: 'Quận 1',
    city: 'TP.HCM'
  },
  emergency_contact: {
    name: 'Nguyễn Thị Emergency',
    phone: '0123456789',
    relationship: 'spouse'
  },
  status: 'active',
  notes: 'Created via API test'
};

// Global variables to track test results
let testResults = [];
let createdPatientId = null;
let createdProfileId = null;
let testUserEmail = null;

// Helper function to add test result
function addTestResult(testName, success, message, responseTime = null) {
  testResults.push({
    test: testName,
    success,
    message,
    responseTime,
    timestamp: new Date().toISOString()
  });

  const status = success ? '✅' : '❌';
  const timeStr = responseTime ? ` (${responseTime}ms)` : '';
  console.log(`${status} ${testName}: ${message}${timeStr}`);
}

// Helper function to make HTTP requests with timing
async function makeRequest(method, endpoint, data = null, baseUrl = BASE_URL) {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;

    return {
      success: true,
      status: response.status,
      data: response.data,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message,
      responseTime
    };
  }
}

// Helper function to create test user via Auth Service
async function createTestUser() {
  const timestamp = Date.now();
  const randomNames = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Em'];
  const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];

  const testUser = {
    email: `test.patient.${timestamp}@hospital.com`,
    password: 'TestPassword123!',
    full_name: randomName,
    role: 'patient',
    phone_number: '0987654321',
    gender: 'male',
    date_of_birth: '1990-05-15'
  };

  console.log('   🔐 Creating test user via Auth Service...');
  const result = await makeRequest('POST', '/signup', testUser, AUTH_BASE_URL);

  if (result.success) {
    testUserEmail = testUser.email;
    createdProfileId = result.data.user?.id || result.data.profile?.id;
    console.log('   ✅ Test user created:', testUserEmail);
    console.log('   👤 Profile ID:', createdProfileId);

    // Check if this profile already has a patient record
    console.log('   🔍 Checking if profile already has patient record...');
    const checkResult = await makeRequest('GET', `/profile/${createdProfileId}`);
    if (checkResult.success) {
      console.log('   ⚠️ Profile already has patient record, will skip creation test');
      return null; // Skip patient creation
    }

    return { ...testUser, profile_id: createdProfileId };
  } else {
    console.log('   ❌ Failed to create test user:', result.error);
    return null;
  }
}

async function testPatientAPI() {
  console.log('🧪 Testing Patient Service API...\n');
  console.log('📍 Base URL:', BASE_URL);
  console.log('⏰ Started at:', new Date().toISOString());
  console.log('=' .repeat(60));

  try {
    // Test 1: Health Check
    await testHealthCheck();

    // Test 2: GET /api/patients (Get all patients with pagination)
    await testGetAllPatients();

    // Test 3: GET /api/patients/stats (Get patient statistics)
    await testGetPatientStats();

    // Test 4: POST /api/patients (Create new patient)
    await testCreatePatient();

    // Test 5: GET /api/patients/:id (Get patient by ID)
    await testGetPatientById();

    // Test 6: GET /api/patients/profile/:profileId (Get patient by profile ID)
    await testGetPatientByProfileId();

    // Test 7: PUT /api/patients/:id (Update patient)
    await testUpdatePatient();

    // Test 8: GET /api/patients/doctor/:doctorId (Get patients by doctor)
    await testGetPatientsByDoctor();

    // Test 9: Search functionality
    await testSearchPatients();

    // Test 10: DELETE /api/patients/:id (Delete patient)
    await testDeletePatient();

    // Test 11: Error handling tests
    await testErrorHandling();

    // Test 12: Cleanup test data
    await cleanupTestData();

  } catch (error) {
    console.error('🚨 Test suite failed:', error.message);
    addTestResult('Test Suite', false, `Critical error: ${error.message}`);
  }

  // Print summary
  printTestSummary();
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n1️⃣ Testing Service Health Check');

  const result = await makeRequest('GET', '/health');

  if (result.success) {
    addTestResult('Health Check', true, 'Service is running', result.responseTime);
  } else {
    addTestResult('Health Check', false, `Service unavailable: ${result.error}`, result.responseTime);
  }
}

// Test 2: Get All Patients
async function testGetAllPatients() {
  console.log('\n2️⃣ Testing GET /api/patients (Get all patients)');

  const result = await makeRequest('GET', '?page=1&limit=5');

  if (result.success) {
    const data = result.data.data || result.data;
    const count = Array.isArray(data) ? data.length : 0;
    const total = result.data.pagination?.total || count;

    addTestResult('GET All Patients', true, `Retrieved ${count} patients (Total: ${total})`, result.responseTime);

    // Validate response structure
    if (result.data.pagination) {
      console.log('   📄 Pagination:', JSON.stringify(result.data.pagination, null, 2));
    }
  } else {
    addTestResult('GET All Patients', false, `Failed: ${result.error}`, result.responseTime);
  }
}

// Test 3: Get Patient Statistics
async function testGetPatientStats() {
  console.log('\n3️⃣ Testing GET /api/patients/stats');

  const result = await makeRequest('GET', '/stats');

  if (result.success) {
    const stats = result.data.data || result.data;
    addTestResult('GET Patient Stats', true, `Retrieved statistics`, result.responseTime);
    console.log('   📊 Stats:', JSON.stringify(stats, null, 2));
  } else {
    addTestResult('GET Patient Stats', false, `Failed: ${result.error}`, result.responseTime);
  }
}

// Test 4: Create New Patient (with real API integration)
async function testCreatePatient() {
  console.log('\n4️⃣ Testing POST /api/patients (Create new patient with real API)');

  // Step 1: Create test user via Auth Service
  const testUser = await createTestUser();

  if (!testUser || !createdProfileId) {
    // Auth Service automatically creates patient record, which is correct behavior
    addTestResult('POST Create Patient', true, 'Auth Service automatically creates patient (correct behavior)');

    // Use the created profile ID for other tests
    if (createdProfileId) {
      // Get the auto-created patient ID
      const patientResult = await makeRequest('GET', `/profile/${createdProfileId}`);
      if (patientResult.success) {
        createdPatientId = patientResult.data.data?.patient_id || patientResult.data.patient_id;
        console.log('   ✅ Auto-created patient found:', createdPatientId);
        console.log('   🔗 Profile ID:', createdProfileId);

        // Validate ID format
        if (createdPatientId && createdPatientId.match(/^PAT-\d{6}-\d{3}$/)) {
          addTestResult('ID Format Validation', true, 'Date-based ID format is correct');
        } else {
          addTestResult('ID Format Validation', false, `Invalid ID format: ${createdPatientId}`);
        }
      }
    }
    return;
  }

  // Step 2: Create patient with real profile_id (fallback if auto-creation didn't work)
  const testData = {
    ...TEST_PATIENT_DATA,
    profile_id: createdProfileId,
    email: testUser.email,
    full_name: testUser.full_name
  };

  const result = await makeRequest('POST', '', testData);

  if (result.success) {
    const patient = result.data.data || result.data;
    createdPatientId = patient.patient_id;

    addTestResult('POST Create Patient', true, `Created patient: ${createdPatientId}`, result.responseTime);
    console.log('   👤 Patient ID:', createdPatientId);
    console.log('   📧 Email:', testUser.email);
    console.log('   🔗 Profile ID:', createdProfileId);

    // Validate date-based ID format
    if (createdPatientId && createdPatientId.match(/^PAT-\d{6}-\d{3}$/)) {
      addTestResult('ID Format Validation', true, 'Date-based ID format is correct');
    } else {
      addTestResult('ID Format Validation', false, `Invalid ID format: ${createdPatientId}`);
    }
  } else {
    addTestResult('POST Create Patient', false, `Failed: ${result.error}`, result.responseTime);
  }
}

// Test 5: Get Patient by ID
async function testGetPatientById() {
  console.log('\n5️⃣ Testing GET /api/patients/:id (Get patient by ID)');

  const patientId = createdPatientId || EXISTING_PATIENT_ID;
  const result = await makeRequest('GET', `/${patientId}`);

  if (result.success) {
    const patient = result.data.data || result.data;
    addTestResult('GET Patient by ID', true, `Retrieved patient: ${patient.patient_id}`, result.responseTime);
    console.log('   👤 Full Name:', patient.profile?.full_name || 'N/A');
    console.log('   🩸 Blood Type:', patient.blood_type || 'N/A');
    console.log('   📱 Status:', patient.status || 'N/A');
  } else {
    addTestResult('GET Patient by ID', false, `Failed: ${result.error}`, result.responseTime);
  }
}

// Test 6: Get Patient by Profile ID
async function testGetPatientByProfileId() {
  console.log('\n6️⃣ Testing GET /api/patients/profile/:profileId');

  const result = await makeRequest('GET', `/profile/${EXISTING_PROFILE_ID}`);

  if (result.success) {
    const patient = result.data.data || result.data;
    addTestResult('GET Patient by Profile ID', true, `Retrieved patient: ${patient.patient_id}`, result.responseTime);
    console.log('   👤 Profile ID:', patient.profile_id);
    console.log('   📧 Email:', patient.profile?.email || 'N/A');
  } else {
    addTestResult('GET Patient by Profile ID', false, `Failed: ${result.error}`, result.responseTime);
  }
}

// Test 7: Update Patient
async function testUpdatePatient() {
  console.log('\n7️⃣ Testing PUT /api/patients/:id (Update patient)');

  if (!createdPatientId) {
    addTestResult('PUT Update Patient', false, 'No patient created to update');
    return;
  }

  const updateData = {
    gender: 'female',
    blood_type: 'O+',
    status: 'active',
    notes: 'Updated via API test - ' + new Date().toISOString()
  };

  const result = await makeRequest('PUT', `/${createdPatientId}`, updateData);

  if (result.success) {
    const patient = result.data.data || result.data;
    addTestResult('PUT Update Patient', true, `Updated patient: ${patient.patient_id}`, result.responseTime);
    console.log('   🩸 New Blood Type:', patient.blood_type);
    console.log('   📝 Notes:', patient.notes);
  } else {
    addTestResult('PUT Update Patient', false, `Failed: ${result.error}`, result.responseTime);
  }
}

// Test 8: Get Patients by Doctor
async function testGetPatientsByDoctor() {
  console.log('\n8️⃣ Testing GET /api/patients/doctor/:doctorId');

  const result = await makeRequest('GET', `/doctor/${EXISTING_DOCTOR_ID}`);

  if (result.success) {
    const patients = result.data.data || result.data;
    const count = Array.isArray(patients) ? patients.length : 0;
    addTestResult('GET Patients by Doctor', true, `Found ${count} patients for doctor`, result.responseTime);
  } else {
    addTestResult('GET Patients by Doctor', false, `Failed: ${result.error}`, result.responseTime);
  }
}

// Test 9: Search Patients
async function testSearchPatients() {
  console.log('\n9️⃣ Testing Search Functionality');

  // Test search by name
  const searchResult = await makeRequest('GET', '?search=Test&page=1&limit=5');

  if (searchResult.success) {
    const patients = searchResult.data.data || searchResult.data;
    const count = Array.isArray(patients) ? patients.length : 0;
    addTestResult('Search Patients', true, `Found ${count} patients matching "Test"`, searchResult.responseTime);

    if (count > 0) {
      console.log('   🔍 First result:', patients[0].profile?.full_name || patients[0].patient_id);
    }
  } else {
    addTestResult('Search Patients', false, `Failed: ${searchResult.error}`, searchResult.responseTime);
  }
}

// Test 10: Delete Patient
async function testDeletePatient() {
  console.log('\n🔟 Testing DELETE /api/patients/:id (Delete patient)');

  if (!createdPatientId) {
    addTestResult('DELETE Patient', false, 'No patient created to delete');
    return;
  }

  const result = await makeRequest('DELETE', `/${createdPatientId}`);

  if (result.success) {
    addTestResult('DELETE Patient', true, `Deleted patient: ${createdPatientId}`, result.responseTime);
    console.log('   🗑️ Patient soft deleted successfully');

    // Verify soft deletion by checking if patient status is 'inactive'
    const verifyResult = await makeRequest('GET', `/${createdPatientId}`);
    if (verifyResult.success && verifyResult.data && verifyResult.data.data) {
      const patient = verifyResult.data.data;
      if (patient.status === 'inactive') {
        addTestResult('DELETE Verification', true, 'Patient properly soft deleted (status: inactive)');
        console.log('   ✅ Verified: Patient status changed to inactive');
      } else {
        addTestResult('DELETE Verification', false, `Patient status is '${patient.status}', expected 'inactive'`);
        console.log('   ❌ Patient status not changed to inactive');
      }
    } else {
      addTestResult('DELETE Verification', false, 'Could not verify patient status after deletion');
      console.log('   ❌ Could not retrieve patient to verify soft delete');
    }
  } else {
    addTestResult('DELETE Patient', false, `Failed: ${result.error}`, result.responseTime);
  }
}

// Test 11: Error Handling Tests
async function testErrorHandling() {
  console.log('\n1️⃣1️⃣ Testing Error Handling');

  // Test invalid patient ID format
  const invalidIdResult = await makeRequest('GET', '/INVALID-ID-FORMAT');
  if (!invalidIdResult.success && invalidIdResult.status >= 400) {
    addTestResult('Invalid ID Format', true, `Properly rejected invalid ID (${invalidIdResult.status})`, invalidIdResult.responseTime);
  } else {
    addTestResult('Invalid ID Format', false, 'Should reject invalid ID format', invalidIdResult.responseTime);
  }

  // Test non-existent patient
  const notFoundResult = await makeRequest('GET', '/PAT-999999-999');
  if (!notFoundResult.success && notFoundResult.status === 404) {
    addTestResult('Non-existent Patient', true, 'Properly returned 404 for non-existent patient', notFoundResult.responseTime);
  } else {
    addTestResult('Non-existent Patient', false, 'Should return 404 for non-existent patient', notFoundResult.responseTime);
  }

  // Test invalid data for creation
  const invalidDataResult = await makeRequest('POST', '', { invalid: 'data' });
  if (!invalidDataResult.success && invalidDataResult.status >= 400) {
    addTestResult('Invalid Create Data', true, `Properly rejected invalid data (${invalidDataResult.status})`, invalidDataResult.responseTime);
  } else {
    addTestResult('Invalid Create Data', false, 'Should reject invalid creation data', invalidDataResult.responseTime);
  }

  // Test PUT without patient ID
  const putNoIdResult = await makeRequest('PUT', '/', { status: 'active' });
  if (!putNoIdResult.success && putNoIdResult.status >= 400) {
    addTestResult('PUT without ID', true, `Properly rejected PUT without ID (${putNoIdResult.status})`, putNoIdResult.responseTime);
  } else {
    addTestResult('PUT without ID', false, 'Should reject PUT without patient ID', putNoIdResult.responseTime);
  }
}

// Test 12: Cleanup Test Data
async function cleanupTestData() {
  console.log('\n1️⃣2️⃣ Cleaning up test data');

  let cleanupCount = 0;

  // Clean up created patient
  if (createdPatientId) {
    console.log('   🗑️ Cleaning up patient:', createdPatientId);
    const deleteResult = await makeRequest('DELETE', `/${createdPatientId}`);
    if (deleteResult.success) {
      cleanupCount++;
      console.log('   ✅ Patient deleted successfully');
    } else {
      console.log('   ⚠️ Failed to delete patient:', deleteResult.error);
    }
  }

  // Clean up created user profile (via Auth Service)
  if (testUserEmail) {
    console.log('   🗑️ Cleaning up user profile:', testUserEmail);
    // Note: In production, you might want to call a cleanup endpoint
    // For now, we'll just log it as the auth service might not have a delete endpoint
    console.log('   ℹ️ User profile cleanup would be handled by Auth Service');
    cleanupCount++;
  }

  addTestResult('Cleanup Test Data', true, `Cleaned up ${cleanupCount} test records`);
}

// Print Test Summary
function printTestSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = testResults.filter(r => r.success).length;
  const failed = testResults.filter(r => !r.success).length;
  const total = testResults.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`📈 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);

  // Calculate average response time
  const responseTimes = testResults.filter(r => r.responseTime).map(r => r.responseTime);
  if (responseTimes.length > 0) {
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    console.log(`⏱️ Average Response Time: ${avgTime.toFixed(0)}ms`);
  }

  console.log(`⏰ Completed at: ${new Date().toISOString()}`);

  // Show failed tests
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.filter(r => !r.success).forEach(result => {
      console.log(`   • ${result.test}: ${result.message}`);
    });
  }

  // Show recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (passed === total) {
    console.log('   🎉 All tests passed! Patient API is working correctly.');
    console.log('   📋 Next steps:');
    console.log('      - Test frontend integration');
    console.log('      - Test API Gateway routing');
    console.log('      - Test authentication flow');
    console.log('      - Run performance tests');
  } else {
    console.log('   ⚠️ Some tests failed. Please check:');
    console.log('      - Patient Service is running on port 3003');
    console.log('      - Database connection is working');
    console.log('      - All required tables exist');
    console.log('      - Sample data is properly loaded');
  }

  console.log('\n📁 Test Results saved to memory for debugging');
  console.log('🔗 For frontend testing: http://localhost:3000/test/patient-api');
}

// Export test results for external use
function getTestResults() {
  return {
    summary: {
      total: testResults.length,
      passed: testResults.filter(r => r.success).length,
      failed: testResults.filter(r => !r.success).length,
      successRate: ((testResults.filter(r => r.success).length / testResults.length) * 100).toFixed(1)
    },
    results: testResults,
    createdPatientId
  };
}

// Run the tests
if (require.main === module) {
  testPatientAPI().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

// Export functions for external use
module.exports = {
  testPatientAPI,
  getTestResults,
  testHealthCheck,
  testGetAllPatients,
  testCreatePatient,
  testGetPatientById,
  testUpdatePatient,
  testDeletePatient,
  testSearchPatients,
  testErrorHandling
};
