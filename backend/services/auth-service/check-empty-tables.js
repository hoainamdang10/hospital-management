#!/usr/bin/env node

/**
 * Check structure of empty enum tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmptyTables() {
  console.log('🔍 Checking structure of empty enum tables...\n');
  
  const emptyTables = ['diagnosis', 'medications', 'status_values'];
  
  for (const table of emptyTables) {
    try {
      console.log(`📋 Table: ${table}`);
      
      // Try to insert a dummy record to see what columns are expected
      const dummyData = {};
      const { error } = await supabase.from(table).insert(dummyData);
      
      if (error) {
        console.log(`❌ Error (shows required columns): ${error.message}`);
      }
      
      // Also try to select to see if there are any existing columns
      const { data, error: selectError } = await supabase
        .from(table)
        .select('*')
        .limit(0);
        
      if (!selectError) {
        console.log(`✅ Table accessible`);
      }
      
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
    console.log('');
  }
}

checkEmptyTables().catch(console.error);
