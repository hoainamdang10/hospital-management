#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatusStructure() {
  console.log('🔍 Testing status_values structure step by step...\n');

  // Test 1: Just status_type
  console.log('1. Testing with just status_type...');
  try {
    const { error } = await supabase
      .from('status_values')
      .insert({ status_type: 'test1' });
    console.log(error ? `❌ ${error.message}` : '✅ Works');
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }

  // Test 2: status_type + status_value
  console.log('\n2. Testing with status_type + status_value...');
  try {
    const { error } = await supabase
      .from('status_values')
      .insert({ 
        status_type: 'test2',
        status_value: 'test_value'
      });
    console.log(error ? `❌ ${error.message}` : '✅ Works');
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }

  // Test 3: Add status_label
  console.log('\n3. Testing with status_type + status_value + status_label...');
  try {
    const { error } = await supabase
      .from('status_values')
      .insert({ 
        status_type: 'test3',
        status_value: 'test_value',
        status_label: 'Test Label'
      });
    console.log(error ? `❌ ${error.message}` : '✅ Works');
    
    if (!error) {
      // Clean up successful insert
      await supabase.from('status_values').delete().eq('status_type', 'test3');
    }
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }

  // Test 4: Check what columns exist by trying to select
  console.log('\n4. Checking existing records structure...');
  try {
    const { data, error } = await supabase
      .from('status_values')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Select error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ Found record with columns: ${Object.keys(data[0]).join(', ')}`);
    } else {
      console.log('⚠️ No records found');
    }
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
}

checkStatusStructure().catch(console.error);
