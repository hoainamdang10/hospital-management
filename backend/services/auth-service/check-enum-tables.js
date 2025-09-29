#!/usr/bin/env node

/**
 * Check enum tables structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Checking enum tables structure...\n');
  
  const tables = [
    'specialties', 
    'departments', 
    'room_types', 
    'diagnosis', 
    'medications', 
    'status_values', 
    'payment_methods'
  ];
  
  for (const table of tables) {
    try {
      console.log(`📋 Table: ${table}`);
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`✅ Exists - Columns: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log(`⚠️  Table exists but empty`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
    console.log('');
  }
}

checkTables().catch(console.error);
