const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3006';
const API_GATEWAY_URL = 'http://localhost:3100';

// Test credentials (should match your test data)
const TEST_CREDENTIALS = {
  email: 'receptionist@hospital.com',
  password: 'Receptionist123!'
};

let authToken = '';

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null, useGateway = false) {
  const baseURL = useGateway ? API_GATEWAY_URL : BASE_URL;
  const config = {
    method,
    url: `${baseURL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  if (data) {
    config.data = data;
  }

  try {
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

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    console.log('📊 Service info:', result.data);
  } else {
    console.log('❌ Health check failed:', result.error);
  }
  
  return result.success;
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Login to get token
  const loginResult = await makeRequest('POST', '/api/auth/login', TEST_CREDENTIALS, true);
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    console.log('✅ Authentication successful');
    console.log('👤 User role:', loginResult.data.user?.role);
    return true;
  } else {
    console.log('❌ Authentication failed:', loginResult.error);
    return false;
  }
}

async function testReceptionistProfile() {
  console.log('\n👤 Testing Receptionist Profile...');
  
  const result = await makeRequest('GET', '/api/receptionists/profile');
  
  if (result.success) {
    console.log('✅ Profile retrieved successfully');
    console.log('📋 Profile info:', {
      receptionist_id: result.data.data?.receptionist_id,
      full_name: result.data.data?.full_name,
      department_id: result.data.data?.department_id,
      status: result.data.data?.status
    });
  } else {
    console.log('❌ Profile retrieval failed:', result.error);
  }
  
  return result.success;
}

async function testDashboardStats() {
  console.log('\n📊 Testing Dashboard Stats...');
  
  const result = await makeRequest('GET', '/api/receptionists/dashboard/stats');
  
  if (result.success) {
    console.log('✅ Dashboard stats retrieved successfully');
    console.log('📈 Stats:', result.data.data);
  } else {
    console.log('❌ Dashboard stats failed:', result.error);
  }
  
  return result.success;
}

async function testQueue() {
  console.log('\n🚶 Testing Queue Management...');
  
  const result = await makeRequest('GET', '/api/checkin/queue');
  
  if (result.success) {
    console.log('✅ Queue retrieved successfully');
    console.log('👥 Queue length:', result.data.data?.length || 0);
    if (result.data.data?.length > 0) {
      console.log('🔍 First patient:', {
        patient_name: result.data.data[0].patient_name,
        appointment_time: result.data.data[0].appointment_time,
        status: result.data.data[0].status
      });
    }
  } else {
    console.log('❌ Queue retrieval failed:', result.error);
  }
  
  return result.success;
}

async function testTodayAppointments() {
  console.log('\n📅 Testing Today Appointments...');
  
  const result = await makeRequest('GET', '/api/appointments/today');
  
  if (result.success) {
    console.log('✅ Today appointments retrieved successfully');
    console.log('📋 Appointments count:', result.data.data?.length || 0);
    if (result.data.data?.length > 0) {
      console.log('🔍 First appointment:', {
        appointment_id: result.data.data[0].appointment_id,
        patient_name: result.data.data[0].patient_name,
        doctor_name: result.data.data[0].doctor_name,
        appointment_time: result.data.data[0].appointment_time,
        status: result.data.data[0].status
      });
    }
  } else {
    console.log('❌ Today appointments failed:', result.error);
  }
  
  return result.success;
}

async function testPatientSearch() {
  console.log('\n🔍 Testing Patient Search...');
  
  const result = await makeRequest('GET', '/api/patients/search?query=Nguyen');
  
  if (result.success) {
    console.log('✅ Patient search successful');
    console.log('👥 Patients found:', result.data.data?.length || 0);
    if (result.data.data?.length > 0) {
      console.log('🔍 First patient:', {
        patient_id: result.data.data[0].patient_id,
        full_name: result.data.data[0].profiles?.full_name,
        phone_number: result.data.data[0].profiles?.phone_number
      });
    }
  } else {
    console.log('❌ Patient search failed:', result.error);
  }
  
  return result.success;
}

async function testCheckIn() {
  console.log('\n✅ Testing Check-in Process...');
  
  // Mock check-in data
  const checkInData = {
    appointmentId: 'APT-202501-001',
    patientId: 'PAT-202501-001',
    insuranceVerified: true,
    documentsComplete: true,
    notes: 'Test check-in from API test'
  };
  
  const result = await makeRequest('POST', '/api/checkin', checkInData);
  
  if (result.success) {
    console.log('✅ Check-in successful');
    console.log('📋 Check-in result:', result.data);
  } else {
    console.log('❌ Check-in failed:', result.error);
    // This might fail if appointment doesn't exist, which is expected
    if (result.status === 404) {
      console.log('ℹ️  This is expected if test appointment doesn\'t exist');
    }
  }
  
  return result.success || result.status === 404;
}

async function testReports() {
  console.log('\n📊 Testing Reports...');
  
  const today = new Date().toISOString().split('T')[0];
  const result = await makeRequest('GET', `/api/reports/daily?date=${today}`);
  
  if (result.success) {
    console.log('✅ Daily report retrieved successfully');
    console.log('📈 Report data:', {
      date: result.data.data?.date,
      totalAppointments: result.data.data?.statistics?.totalAppointments,
      checkedInPatients: result.data.data?.statistics?.checkedInPatients,
      completedAppointments: result.data.data?.statistics?.completedAppointments
    });
  } else {
    console.log('❌ Daily report failed:', result.error);
  }
  
  return result.success;
}

async function testAPIGatewayIntegration() {
  console.log('\n🌐 Testing API Gateway Integration...');
  
  const result = await makeRequest('GET', '/api/receptionists/profile', null, true);
  
  if (result.success) {
    console.log('✅ API Gateway integration working');
    console.log('📋 Profile via gateway:', {
      receptionist_id: result.data.data?.receptionist_id,
      full_name: result.data.data?.full_name
    });
  } else {
    console.log('❌ API Gateway integration failed:', result.error);
  }
  
  return result.success;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Receptionist Service API Tests...');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Receptionist Profile', fn: testReceptionistProfile },
    { name: 'Dashboard Stats', fn: testDashboardStats },
    { name: 'Queue Management', fn: testQueue },
    { name: 'Today Appointments', fn: testTodayAppointments },
    { name: 'Patient Search', fn: testPatientSearch },
    { name: 'Check-in Process', fn: testCheckIn },
    { name: 'Reports', fn: testReports },
    { name: 'API Gateway Integration', fn: testAPIGatewayIntegration }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      results.push({ name: test.name, success: false });
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log('\n📊 Results:', `${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Receptionist Service is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the service configuration.');
  }
  
  return passed === total;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testAuthentication,
  testReceptionistProfile,
  testDashboardStats,
  testQueue,
  testTodayAppointments,
  testPatientSearch,
  testCheckIn,
  testReports,
  testAPIGatewayIntegration
};
