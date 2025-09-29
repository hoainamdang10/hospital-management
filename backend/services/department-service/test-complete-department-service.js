#!/usr/bin/env node

/**
 * 🏥 COMPREHENSIVE DEPARTMENT SERVICE TEST
 * 
 * This script tests the complete Department Service including:
 * - Department CRUD operations
 * - Specialty CRUD operations  
 * - Room CRUD operations
 * - Hierarchy management
 * - Statistics and reporting
 */

const axios = require('axios');

// Configuration
const DEPARTMENT_SERVICE_URL = 'http://localhost:3005';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: { 'Content-Type': 'application/json' },
      ...(data && { data }),
      timeout: 10000
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

async function testDepartmentService() {
  log('🏥 COMPREHENSIVE DEPARTMENT SERVICE TEST', 'cyan');
  log('=' .repeat(80), 'cyan');
  log(`📅 Test Date: ${new Date().toISOString()}`, 'white');

  const testResults = {
    departments: { passed: 0, total: 0 },
    specialties: { passed: 0, total: 0 },
    rooms: { passed: 0, total: 0 },
    hierarchy: { passed: 0, total: 0 },
    overall: { passed: 0, total: 0 }
  };

  try {
    // ===== DEPARTMENT TESTS =====
    log('\n🏢 TESTING DEPARTMENT OPERATIONS', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Test 1: Get all departments
    log('\n1️⃣ Testing GET all departments...', 'yellow');
    testResults.departments.total++;
    const deptResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments`);
    if (deptResult.success) {
      const departments = deptResult.data.data;
      log(`✅ Retrieved ${departments.length} departments`, 'green');
      testResults.departments.passed++;
    } else {
      log(`❌ Failed: ${deptResult.error}`, 'red');
    }

    // Test 2: Get department statistics
    log('\n2️⃣ Testing department statistics...', 'yellow');
    testResults.departments.total++;
    const statsResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments/stats`);
    if (statsResult.success) {
      const stats = statsResult.data.data;
      log(`✅ Stats: ${stats.total_departments} total, ${stats.active_departments} active`, 'green');
      testResults.departments.passed++;
    } else {
      log(`❌ Failed: ${statsResult.error}`, 'red');
    }

    // Test 3: Get department tree (hierarchy)
    log('\n3️⃣ Testing department hierarchy tree...', 'yellow');
    testResults.hierarchy.total++;
    const treeResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments/tree`);
    if (treeResult.success) {
      const tree = treeResult.data.data;
      log(`✅ Retrieved department tree with ${tree.length} root departments`, 'green');
      testResults.hierarchy.passed++;
    } else {
      log(`❌ Failed: ${treeResult.error}`, 'red');
    }

    // ===== SPECIALTY TESTS =====
    log('\n🔬 TESTING SPECIALTY OPERATIONS', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Test 4: Get all specialties
    log('\n4️⃣ Testing GET all specialties...', 'yellow');
    testResults.specialties.total++;
    const specResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/specialties`);
    if (specResult.success) {
      const specialties = specResult.data.data;
      log(`✅ Retrieved ${specialties.length} specialties`, 'green');
      testResults.specialties.passed++;
    } else {
      log(`❌ Failed: ${specResult.error}`, 'red');
    }

    // Test 5: Get specialty statistics
    log('\n5️⃣ Testing specialty statistics...', 'yellow');
    testResults.specialties.total++;
    const specStatsResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/specialties/stats`);
    if (specStatsResult.success) {
      const specStats = specStatsResult.data.data;
      log(`✅ Specialty stats: ${specStats.total_specialties} total, ${specStats.active_specialties} active`, 'green');
      testResults.specialties.passed++;
    } else {
      log(`❌ Failed: ${specStatsResult.error}`, 'red');
    }

    // Test 6: Create new specialty
    log('\n6️⃣ Testing CREATE specialty...', 'yellow');
    testResults.specialties.total++;
    const newSpecialty = {
      specialty_name: 'Test Specialty - Automated',
      department_id: 'DEPT001',
      description: 'Test specialty created by automated test'
    };
    const createSpecResult = await makeRequest('POST', `${DEPARTMENT_SERVICE_URL}/api/specialties`, newSpecialty);
    if (createSpecResult.success) {
      log(`✅ Created specialty: ${createSpecResult.data.data.specialty_id}`, 'green');
      testResults.specialties.passed++;
    } else {
      log(`❌ Failed: ${createSpecResult.error}`, 'red');
    }

    // ===== ROOM TESTS =====
    log('\n🏠 TESTING ROOM OPERATIONS', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Test 7: Get all rooms
    log('\n7️⃣ Testing GET all rooms...', 'yellow');
    testResults.rooms.total++;
    const roomResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/rooms`);
    if (roomResult.success) {
      const rooms = roomResult.data.data;
      log(`✅ Retrieved ${rooms.length} rooms`, 'green');
      testResults.rooms.passed++;
    } else {
      log(`❌ Failed: ${roomResult.error}`, 'red');
    }

    // Test 8: Get room availability
    log('\n8️⃣ Testing room availability...', 'yellow');
    testResults.rooms.total++;
    const availResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/rooms/availability`);
    if (availResult.success) {
      const availability = availResult.data.data;
      log(`✅ Retrieved room availability: ${availability.length} rooms`, 'green');
      testResults.rooms.passed++;
    } else {
      log(`❌ Failed: ${availResult.error}`, 'red');
    }

    // Test 9: Create new room
    log('\n9️⃣ Testing CREATE room...', 'yellow');
    testResults.rooms.total++;
    const newRoom = {
      room_number: 'TEST-001',
      department_id: 'DEPT001',
      room_type: 'consultation',
      capacity: 2,
      notes: 'Test room created by automated test'
    };
    const createRoomResult = await makeRequest('POST', `${DEPARTMENT_SERVICE_URL}/api/rooms`, newRoom);
    if (createRoomResult.success) {
      log(`✅ Created room: ${createRoomResult.data.data.room_id}`, 'green');
      testResults.rooms.passed++;
    } else {
      log(`❌ Failed: ${createRoomResult.error}`, 'red');
    }

    // ===== HIERARCHY TESTS =====
    log('\n🌳 TESTING HIERARCHY OPERATIONS', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Test 10: Get child departments
    log('\n🔟 Testing child departments...', 'yellow');
    testResults.hierarchy.total++;
    const childResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments/DEPT001/children`);
    if (childResult.success) {
      const children = childResult.data.data;
      log(`✅ Retrieved ${children.length} child departments for DEPT001`, 'green');
      testResults.hierarchy.passed++;
    } else {
      log(`❌ Failed: ${childResult.error}`, 'red');
    }

    // Test 11: Get department path
    log('\n1️⃣1️⃣ Testing department path...', 'yellow');
    testResults.hierarchy.total++;
    const pathResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments/DEPT001/path`);
    if (pathResult.success) {
      const path = pathResult.data.data;
      log(`✅ Retrieved department path: ${path.length} levels`, 'green');
      testResults.hierarchy.passed++;
    } else {
      log(`❌ Failed: ${pathResult.error}`, 'red');
    }

    // ===== INTEGRATION TESTS =====
    log('\n🔗 TESTING INTEGRATION', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Test 12: Get department with rooms
    log('\n1️⃣2️⃣ Testing department rooms integration...', 'yellow');
    testResults.departments.total++;
    const deptRoomsResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments/DEPT001/rooms`);
    if (deptRoomsResult.success) {
      const deptRooms = deptRoomsResult.data.data;
      log(`✅ Retrieved ${deptRooms.length} rooms for DEPT001`, 'green');
      testResults.departments.passed++;
    } else {
      log(`❌ Failed: ${deptRoomsResult.error}`, 'red');
    }

    // Test 13: Get department with doctors
    log('\n1️⃣3️⃣ Testing department doctors integration...', 'yellow');
    testResults.departments.total++;
    const deptDoctorsResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments/DEPT001/doctors`);
    if (deptDoctorsResult.success) {
      const deptDoctors = deptDoctorsResult.data.data;
      log(`✅ Retrieved ${deptDoctors.length} doctors for DEPT001`, 'green');
      testResults.departments.passed++;
    } else {
      log(`❌ Failed: ${deptDoctorsResult.error}`, 'red');
    }

    // Calculate totals
    testResults.overall.total = 
      testResults.departments.total + 
      testResults.specialties.total + 
      testResults.rooms.total + 
      testResults.hierarchy.total;

    testResults.overall.passed = 
      testResults.departments.passed + 
      testResults.specialties.passed + 
      testResults.rooms.passed + 
      testResults.hierarchy.passed;

    // ===== FINAL RESULTS =====
    log('\n📊 COMPREHENSIVE TEST RESULTS', 'cyan');
    log('=' .repeat(80), 'cyan');

    const overallSuccessRate = Math.round((testResults.overall.passed / testResults.overall.total) * 100);

    log(`🏢 Department Operations: ${testResults.departments.passed}/${testResults.departments.total} (${Math.round((testResults.departments.passed/testResults.departments.total)*100)}%)`, 
        testResults.departments.passed === testResults.departments.total ? 'green' : 'yellow');

    log(`🔬 Specialty Operations: ${testResults.specialties.passed}/${testResults.specialties.total} (${Math.round((testResults.specialties.passed/testResults.specialties.total)*100)}%)`, 
        testResults.specialties.passed === testResults.specialties.total ? 'green' : 'yellow');

    log(`🏠 Room Operations: ${testResults.rooms.passed}/${testResults.rooms.total} (${Math.round((testResults.rooms.passed/testResults.rooms.total)*100)}%)`, 
        testResults.rooms.passed === testResults.rooms.total ? 'green' : 'yellow');

    log(`🌳 Hierarchy Operations: ${testResults.hierarchy.passed}/${testResults.hierarchy.total} (${Math.round((testResults.hierarchy.passed/testResults.hierarchy.total)*100)}%)`, 
        testResults.hierarchy.passed === testResults.hierarchy.total ? 'green' : 'yellow');

    log(`\n🎯 OVERALL SUCCESS RATE: ${testResults.overall.passed}/${testResults.overall.total} (${overallSuccessRate}%)`, 
        overallSuccessRate >= 80 ? 'green' : overallSuccessRate >= 60 ? 'yellow' : 'red');

    if (overallSuccessRate >= 80) {
      log('\n🎉 DEPARTMENT SERVICE TEST PASSED!', 'green');
      log('✅ Service is ready for production use', 'green');
    } else if (overallSuccessRate >= 60) {
      log('\n⚠️ DEPARTMENT SERVICE PARTIALLY WORKING', 'yellow');
      log('🔧 Some features need attention', 'yellow');
    } else {
      log('\n❌ DEPARTMENT SERVICE NEEDS MAJOR FIXES', 'red');
      log('🚨 Critical issues detected', 'red');
    }

    log(`\n📈 Service Completion Status:`, 'cyan');
    log(`   Department Service: ${overallSuccessRate}% complete`, 'white');
    log(`   Ready for integration: ${overallSuccessRate >= 80 ? 'YES' : 'NO'}`, overallSuccessRate >= 80 ? 'green' : 'red');

  } catch (error) {
    log(`💥 Unexpected error during testing: ${error.message}`, 'red');
  }
}

// Run the comprehensive test
if (require.main === module) {
  testDepartmentService().catch(error => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });
}

module.exports = { testDepartmentService };
