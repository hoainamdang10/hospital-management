#!/usr/bin/env node

/**
 * 🔍 DEBUG ROOM CREATION
 * 
 * Test room creation with detailed logging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function debugRoomCreation() {
  console.log('🔍 DEBUG ROOM CREATION');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Minimal room creation
    console.log('\n1️⃣ Testing minimal room creation...');
    
    const newRoom = {
      room_number: 'TEST-DEBUG-001',
      department_id: 'DEPT001',
      capacity: 2
    };
    
    console.log('Request data:', JSON.stringify(newRoom, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/rooms`, newRoom, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.status || 'NO_RESPONSE');
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.details) {
      console.log('\n📋 Validation Details:');
      error.response.data.details.forEach((detail, index) => {
        console.log(`${index + 1}. ${detail.msg} (${detail.param})`);
      });
    }
  }
  
  try {
    // Test 2: Room creation with room_type_id
    console.log('\n2️⃣ Testing room creation with room_type_id...');
    
    const newRoomWithType = {
      room_number: 'TEST-DEBUG-002',
      department_id: 'DEPT001',
      room_type_id: 'RT0006',
      capacity: 2
    };
    
    console.log('Request data:', JSON.stringify(newRoomWithType, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/rooms`, newRoomWithType, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.status || 'NO_RESPONSE');
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.details) {
      console.log('\n📋 Validation Details:');
      error.response.data.details.forEach((detail, index) => {
        console.log(`${index + 1}. ${detail.msg} (${detail.param})`);
      });
    }
  }
}

// Run debug
debugRoomCreation().catch(console.error);
