#!/usr/bin/env node

/**
 * Check actual database schema to see what columns really exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTableColumns(tableName) {
  console.log(`\n🔍 Checking ${tableName.toUpperCase()} table columns:`);
  console.log('='.repeat(50));
  
  try {
    // Try to get table structure using information_schema
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      console.log('❌ Error using RPC, trying direct query...');
      
      // Try alternative method - select from table with limit 0
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
        
      if (sampleError) {
        console.log('❌ Error:', sampleError.message);
        return;
      }
      
      console.log('✅ Table exists, but cannot get column details');
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ No columns found or table does not exist');
      return;
    }

    console.log('📋 Columns found:');
    data.forEach((col, index) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });

  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
}

async function main() {
  console.log('🔍 CHECKING ACTUAL DATABASE SCHEMA');
  console.log('==================================================');
  
  await checkTableColumns('doctors');
  await checkTableColumns('patients');
  await checkTableColumns('profiles');
  
  console.log('\n🎯 Schema check completed');
}

main().catch(console.error);
