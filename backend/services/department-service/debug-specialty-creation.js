#!/usr/bin/env node

/**
 * 🔍 DEBUG SPECIALTY CREATION
 * 
 * Test specialty creation with detailed logging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function debugSpecialtyCreation() {
  console.log('🔍 DEBUG SPECIALTY CREATION');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Simple specialty creation
    console.log('\n1️⃣ Testing simple specialty creation...');
    
    const newSpecialty = {
      specialty_name: 'Test Debug Specialty',
      department_id: 'DEPT001',
      description: 'Debug test specialty'
    };
    
    console.log('Request data:', JSON.stringify(newSpecialty, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/specialties`, newSpecialty, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.status || 'NO_RESPONSE');
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error:', JSON.stringify(error.response?.data, null, 2));
  }
  
  try {
    // Test 2: Check logs from service
    console.log('\n2️⃣ Checking service logs...');
    
    // This would show the console.log from our debug code
    
  } catch (error) {
    console.log('❌ Could not check logs');
  }
}

// Run debug
debugSpecialtyCreation().catch(console.error);
