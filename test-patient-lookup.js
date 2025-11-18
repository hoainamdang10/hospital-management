/**
 * Test Patient Lookup Flow
 * Tests: Login -> Get User -> Get PatientId -> Book Appointment
 */

const BASE_URL = 'http://localhost:3101'; // API Gateway

async function testPatientLookup() {
  console.log('🔍 Testing Patient Lookup Flow\n');
  
  // Step 1: Login
  console.log('1️⃣  Login...');
  const loginResponse = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'dangngocthien20122003@gmail.com',
      password: 'Thien20122003.',
    }),
  });

  if (!loginResponse.ok) {
    console.error('❌ Login failed:', loginResponse.status);
    const error = await loginResponse.text();
    console.error(error);
    return;
  }

  const loginData = await loginResponse.json();
  console.log('✅ Login successful');
  
  // Extract cookies
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('🍪 Cookies:', cookies ? 'Received' : 'None');

  // Step 2: Get current user
  console.log('\n2️⃣  Get current user...');
  const userResponse = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || '',
    },
  });

  if (!userResponse.ok) {
    console.error('❌ Get user failed:', userResponse.status);
    const error = await userResponse.text();
    console.error(error);
    return;
  }

  const userData = await userResponse.json();
  console.log('✅ User data:', {
    userId: userData.user?.userId,
    email: userData.user?.email,
    role: userData.user?.role,
  });

  const userId = userData.user?.userId;
  if (!userId) {
    console.error('❌ No userId found');
    return;
  }

  // Step 3: Get patient by userId
  console.log('\n3️⃣  Get patient by userId...');
  const patientResponse = await fetch(`${BASE_URL}/api/v1/patients/user/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || '',
    },
  });

  console.log('Response status:', patientResponse.status);
  const patientText = await patientResponse.text();
  console.log('Response body:', patientText);

  if (!patientResponse.ok) {
    console.error('❌ Get patient failed:', patientResponse.status);
    return;
  }

  const patientData = JSON.parse(patientText);
  console.log('✅ Patient data:', {
    patientId: patientData.data?.patientId,
    fullName: patientData.data?.fullName,
    userId: patientData.data?.userId,
  });

  console.log('\n✨ Test completed successfully!');
  console.log('📋 Summary:');
  console.log(`   - User ID: ${userId}`);
  console.log(`   - Patient ID: ${patientData.data?.patientId}`);
  console.log(`   - Full Name: ${patientData.data?.fullName}`);
}

testPatientLookup().catch(err => {
  console.error('💥 Test failed:', err);
});
