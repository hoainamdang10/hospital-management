#!/usr/bin/env node

/**
 * 🏥 ADD SAMPLE DATA TO DEPARTMENT SERVICE
 * 
 * This script adds sample departments, specialties, and rooms
 * to populate the hospital management system with realistic data.
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

// Sample data
const sampleDepartments = [
  {
    department_name: 'Khoa Tim mạch',
    department_code: 'CARD',
    description: 'Chuyên khoa điều trị các bệnh lý về tim mạch, mạch máu',
    location: 'Tầng 3, Tòa nhà A',
    phone_number: '0123456789',
    email: 'cardiology@hospital.com'
  },
  {
    department_name: 'Khoa Thần kinh',
    department_code: 'NEUR',
    description: 'Chuyên khoa điều trị các bệnh lý về thần kinh',
    location: 'Tầng 4, Tòa nhà A',
    phone_number: '0123456790',
    email: 'neurology@hospital.com'
  },
  {
    department_name: 'Khoa Nhi',
    department_code: 'PEDI',
    description: 'Chuyên khoa điều trị cho trẻ em từ 0-16 tuổi',
    location: 'Tầng 2, Tòa nhà B',
    phone_number: '0123456791',
    email: 'pediatrics@hospital.com'
  },
  {
    department_name: 'Khoa Sản phụ khoa',
    department_code: 'OBGY',
    description: 'Chuyên khoa sản khoa và phụ khoa',
    location: 'Tầng 5, Tòa nhà B',
    phone_number: '0123456792',
    email: 'obstetrics@hospital.com'
  },
  {
    department_name: 'Khoa Ngoại tổng hợp',
    department_code: 'SURG',
    description: 'Khoa phẫu thuật tổng hợp',
    location: 'Tầng 6, Tòa nhà A',
    phone_number: '0123456793',
    email: 'surgery@hospital.com'
  },
  {
    department_name: 'Khoa Cấp cứu',
    department_code: 'EMER',
    description: 'Khoa cấp cứu 24/7',
    location: 'Tầng 1, Tòa nhà A',
    phone_number: '0123456794',
    email: 'emergency@hospital.com'
  }
];

const sampleSpecialties = [
  {
    specialty_name: 'Tim mạch can thiệp',
    department_id: 'DEPT001', // Will be updated after departments are created
    description: 'Chuyên khoa can thiệp tim mạch qua da',
    average_consultation_time: 45,
    consultation_fee_range: { min: 500000, max: 1000000 }
  },
  {
    specialty_name: 'Siêu âm tim',
    department_id: 'DEPT001',
    description: 'Chẩn đoán hình ảnh tim mạch',
    average_consultation_time: 30,
    consultation_fee_range: { min: 300000, max: 500000 }
  },
  {
    specialty_name: 'Thần kinh cột sống',
    department_id: 'DEPT002',
    description: 'Điều trị các bệnh lý cột sống và thần kinh',
    average_consultation_time: 40,
    consultation_fee_range: { min: 400000, max: 800000 }
  },
  {
    specialty_name: 'Nhi tim mạch',
    department_id: 'DEPT003',
    description: 'Chuyên khoa tim mạch trẻ em',
    average_consultation_time: 35,
    consultation_fee_range: { min: 350000, max: 600000 }
  }
];

const sampleRooms = [
  {
    room_number: 'A301',
    department_id: 'DEPT001',
    room_type: 'consultation',
    capacity: 2,
    location: { floor: 3, wing: 'A' },
    notes: 'Phòng khám tim mạch có thiết bị ECG'
  },
  {
    room_number: 'A302',
    department_id: 'DEPT001',
    room_type: 'consultation',
    capacity: 2,
    location: { floor: 3, wing: 'A' },
    notes: 'Phòng khám tim mạch có thiết bị siêu âm'
  },
  {
    room_number: 'A401',
    department_id: 'DEPT002',
    room_type: 'consultation',
    capacity: 2,
    location: { floor: 4, wing: 'A' },
    notes: 'Phòng khám thần kinh'
  },
  {
    room_number: 'B201',
    department_id: 'DEPT003',
    room_type: 'ward',
    capacity: 4,
    location: { floor: 2, wing: 'B' },
    notes: 'Phòng bệnh nhi'
  },
  {
    room_number: 'A601',
    department_id: 'DEPT005',
    room_type: 'surgery',
    capacity: 8,
    location: { floor: 6, wing: 'A' },
    notes: 'Phòng phẫu thuật tổng hợp'
  },
  {
    room_number: 'A101',
    department_id: 'DEPT006',
    room_type: 'emergency',
    capacity: 6,
    location: { floor: 1, wing: 'A' },
    notes: 'Phòng cấp cứu'
  }
];

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
      fullError: error.response?.data
    };
  }
}

async function addSampleData() {
  log('🏥 ADDING SAMPLE DATA TO DEPARTMENT SERVICE', 'cyan');
  log('=' .repeat(60), 'cyan');

  let createdDepartments = [];

  try {
    // Step 1: Add Departments
    log('\n1️⃣ Adding sample departments...', 'yellow');
    
    for (const dept of sampleDepartments) {
      const result = await makeRequest('POST', `${DEPARTMENT_SERVICE_URL}/api/departments`, dept);
      
      if (result.success) {
        createdDepartments.push(result.data.data);
        log(`✅ Created department: ${dept.department_name} (${result.data.data.department_id})`, 'green');
      } else {
        log(`❌ Failed to create department ${dept.department_name}: ${result.error}`, 'red');
      }
    }

    // Step 2: Add Specialties
    log('\n2️⃣ Adding sample specialties...', 'yellow');
    
    // Update specialty department IDs based on created departments
    const updatedSpecialties = sampleSpecialties.map((spec, index) => ({
      ...spec,
      department_id: createdDepartments[Math.floor(index / 2)]?.department_id || 'DEPT001'
    }));

    for (const specialty of updatedSpecialties) {
      const result = await makeRequest('POST', `${DEPARTMENT_SERVICE_URL}/api/specialties`, specialty);
      
      if (result.success) {
        log(`✅ Created specialty: ${specialty.specialty_name}`, 'green');
      } else {
        log(`❌ Failed to create specialty ${specialty.specialty_name}: ${result.error}`, 'red');
      }
    }

    // Step 3: Add Rooms
    log('\n3️⃣ Adding sample rooms...', 'yellow');
    
    // Update room department IDs based on created departments
    const updatedRooms = sampleRooms.map((room, index) => ({
      ...room,
      department_id: createdDepartments[index % createdDepartments.length]?.department_id || 'DEPT001'
    }));

    for (const room of updatedRooms) {
      const result = await makeRequest('POST', `${DEPARTMENT_SERVICE_URL}/api/rooms`, room);
      
      if (result.success) {
        log(`✅ Created room: ${room.room_number} (${room.room_type})`, 'green');
      } else {
        log(`❌ Failed to create room ${room.room_number}: ${result.error}`, 'red');
      }
    }

    // Step 4: Verify data
    log('\n4️⃣ Verifying created data...', 'yellow');
    
    const deptResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments`);
    const specResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/specialties`);
    const roomResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/rooms`);

    if (deptResult.success && specResult.success && roomResult.success) {
      log('✅ Data verification successful:', 'green');
      log(`   Departments: ${deptResult.data.data?.length || 0}`, 'white');
      log(`   Specialties: ${specResult.data.data?.length || 0}`, 'white');
      log(`   Rooms: ${roomResult.data.data?.length || 0}`, 'white');
    }

    log('\n🎉 SAMPLE DATA ADDED SUCCESSFULLY!', 'green');
    log('You can now test the Department Service with realistic data.', 'cyan');

  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
  }
}

// Run the script
if (require.main === module) {
  addSampleData().catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });
}

module.exports = { addSampleData };
