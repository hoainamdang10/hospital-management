/**
 * Test script to verify doctor search by department
 * Tests the /api/v1/staff/search endpoint with DERM department
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3003'; // provider-staff-service
const DERM_DEPT_ID = '8a7410ea-2739-4be2-b90f-e44a947b5b21';

async function testDoctorSearch() {
  console.log('🔍 Testing doctor search by department...\n');
  
  try {
    // Test 1: Search by departmentId (UUID)
    console.log('Test 1: Search by departmentId (UUID)');
    console.log(`GET ${API_BASE}/api/v1/staff/search?departmentId=${DERM_DEPT_ID}&staffType=doctor&status=active&isActive=true`);
    
    const response1 = await axios.get(`${API_BASE}/api/v1/staff/search`, {
      params: {
        departmentId: DERM_DEPT_ID,
        staffType: 'doctor',
        status: 'active',
        isActive: true,
        limit: 20
      }
    });
    
    console.log('✅ Response:', {
      success: response1.data.success,
      message: response1.data.message,
      count: response1.data.data?.items?.length || 0,
      total: response1.data.data?.pagination?.total || 0
    });
    
    if (response1.data.data?.items?.length > 0) {
      console.log('\n👨‍⚕️ Sample doctor:');
      const doctor = response1.data.data.items[0];
      console.log({
        staffId: doctor.staffId,
        name: doctor.personalInfo?.fullName,
        department: doctor.professionalInfo?.department,
        departmentAssignments: doctor.departmentAssignments
      });
    }
    
    // Test 2: Search by departmentCode
    console.log('\n\nTest 2: Search by departmentCode (DERM)');
    console.log(`GET ${API_BASE}/api/v1/staff/search?departmentId=DERM&staffType=doctor&status=active&isActive=true`);
    
    const response2 = await axios.get(`${API_BASE}/api/v1/staff/search`, {
      params: {
        departmentId: 'DERM', // Try departmentCode instead of UUID
        staffType: 'doctor',
        status: 'active',
        isActive: true,
        limit: 20
      }
    });
    
    console.log('✅ Response:', {
      success: response2.data.success,
      message: response2.data.message,
      count: response2.data.data?.items?.length || 0,
      total: response2.data.data?.pagination?.total || 0
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDoctorSearch();
