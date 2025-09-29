#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE DATABASE SCHEMA CHECKER
 * 
 * This script checks all tables in the hospital management database
 * and compares them with the expected schema for a complete system.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Expected schema for a complete hospital management system
const EXPECTED_SCHEMA = {
  profiles: {
    required: ['id', 'email', 'full_name', 'phone_number', 'date_of_birth', 'role', 'is_active', 'created_at'],
    optional: ['avatar_url', 'address', 'emergency_contact', 'email_verified', 'phone_verified', 'updated_at']
  },
  
  departments: {
    required: ['department_id', 'department_name', 'department_code', 'description', 'is_active', 'created_at'],
    optional: ['parent_department_id', 'head_doctor_id', 'location', 'phone_number', 'email', 'updated_at']
  },
  
  specialties: {
    required: ['specialty_id', 'specialty_name', 'department_id', 'is_active', 'created_at'],
    optional: ['description', 'average_consultation_time', 'consultation_fee_min', 'consultation_fee_max', 
               'required_certifications', 'equipment_required', 'updated_at']
  },
  
  doctors: {
    required: ['doctor_id', 'profile_id', 'specialty', 'qualification', 'department_id', 'license_number', 
               'gender', 'is_active', 'created_at'],
    optional: ['bio', 'experience_years', 'consultation_fee', 'languages_spoken', 'availability_status', 
               'rating', 'total_reviews', 'updated_at']
  },
  
  patients: {
    required: ['patient_id', 'profile_id', 'gender', 'status', 'created_at'],
    optional: ['blood_type', 'address', 'emergency_contact', 'medical_history', 'allergies', 'notes', 'updated_at']
  },
  
  appointments: {
    required: ['appointment_id', 'doctor_id', 'patient_id', 'appointment_date', 'appointment_time', 'status', 'created_at'],
    optional: ['appointment_type', 'notes', 'consultation_fee', 'updated_at']
  },
  
  medical_records: {
    required: ['record_id', 'appointment_id', 'doctor_id', 'patient_id', 'visit_date', 'status', 'created_at'],
    optional: ['chief_complaint', 'diagnosis', 'treatment_plan', 'notes', 'updated_at']
  },
  
  rooms: {
    required: ['room_id', 'room_number', 'department_id', 'room_type', 'capacity', 'status', 'is_active', 'created_at'],
    optional: ['equipment_ids', 'location', 'notes', 'updated_at']
  },
  
  doctor_schedules: {
    required: ['schedule_id', 'doctor_id', 'day_of_week', 'start_time', 'end_time', 'is_available', 'created_at'],
    optional: ['break_start', 'break_end', 'max_appointments', 'slot_duration', 'updated_at']
  },
  
  doctor_reviews: {
    required: ['review_id', 'doctor_id', 'patient_id', 'rating', 'review_date', 'created_at'],
    optional: ['review_text', 'is_verified', 'updated_at']
  }
};

async function checkTableSchema(tableName) {
  try {
    log(`\n📋 Checking table: ${tableName}`, 'cyan');
    log('=' .repeat(50), 'cyan');
    
    // Get sample data to see actual columns
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      log(`❌ Error accessing table: ${error.message}`, 'red');
      return { exists: false, columns: [], missing: [], extra: [] };
    }
    
    const actualColumns = data && data.length > 0 ? Object.keys(data[0]) : [];
    const expectedSchema = EXPECTED_SCHEMA[tableName];
    
    if (!expectedSchema) {
      log(`⚠️ No expected schema defined for ${tableName}`, 'yellow');
      log(`📊 Actual columns (${actualColumns.length}):`, 'white');
      actualColumns.forEach(col => log(`   ✓ ${col}`, 'green'));
      return { exists: true, columns: actualColumns, missing: [], extra: [] };
    }
    
    const requiredColumns = expectedSchema.required || [];
    const optionalColumns = expectedSchema.optional || [];
    const allExpectedColumns = [...requiredColumns, ...optionalColumns];
    
    // Find missing and extra columns
    const missingRequired = requiredColumns.filter(col => !actualColumns.includes(col));
    const missingOptional = optionalColumns.filter(col => !actualColumns.includes(col));
    const extraColumns = actualColumns.filter(col => !allExpectedColumns.includes(col));
    
    // Display results
    log(`📊 Schema Analysis:`, 'white');
    log(`   Expected columns: ${allExpectedColumns.length} (${requiredColumns.length} required, ${optionalColumns.length} optional)`, 'white');
    log(`   Actual columns: ${actualColumns.length}`, 'white');
    
    if (missingRequired.length > 0) {
      log(`\n❌ Missing REQUIRED columns (${missingRequired.length}):`, 'red');
      missingRequired.forEach(col => log(`   - ${col}`, 'red'));
    }
    
    if (missingOptional.length > 0) {
      log(`\n⚠️ Missing OPTIONAL columns (${missingOptional.length}):`, 'yellow');
      missingOptional.forEach(col => log(`   - ${col}`, 'yellow'));
    }
    
    if (extraColumns.length > 0) {
      log(`\n🔍 Extra columns not in expected schema (${extraColumns.length}):`, 'blue');
      extraColumns.forEach(col => log(`   + ${col}`, 'blue'));
    }
    
    log(`\n✅ Present columns (${actualColumns.length}):`, 'green');
    actualColumns.forEach(col => {
      const isRequired = requiredColumns.includes(col);
      const isOptional = optionalColumns.includes(col);
      const status = isRequired ? '[REQ]' : isOptional ? '[OPT]' : '[EXTRA]';
      const color = isRequired ? 'green' : isOptional ? 'cyan' : 'blue';
      log(`   ✓ ${col} ${status}`, color);
    });
    
    // Get record count
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    log(`\n📈 Records in table: ${count || 0}`, 'white');
    
    return {
      exists: true,
      columns: actualColumns,
      missing: [...missingRequired, ...missingOptional],
      missingRequired,
      missingOptional,
      extra: extraColumns,
      recordCount: count || 0
    };
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
    return { exists: false, columns: [], missing: [], extra: [] };
  }
}

async function generateSchemaReport() {
  log('🏥 HOSPITAL MANAGEMENT DATABASE SCHEMA ANALYSIS', 'cyan');
  log('=' .repeat(80), 'cyan');
  log(`📅 Analysis Date: ${new Date().toISOString()}`, 'white');
  
  const tables = Object.keys(EXPECTED_SCHEMA);
  const results = {};
  
  for (const table of tables) {
    results[table] = await checkTableSchema(table);
  }
  
  // Generate summary report
  log('\n\n📊 SUMMARY REPORT', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  let totalMissingRequired = 0;
  let totalMissingOptional = 0;
  let totalExtra = 0;
  let totalRecords = 0;
  
  tables.forEach(table => {
    const result = results[table];
    if (result.exists) {
      totalMissingRequired += result.missingRequired?.length || 0;
      totalMissingOptional += result.missingOptional?.length || 0;
      totalExtra += result.extra?.length || 0;
      totalRecords += result.recordCount || 0;
      
      const status = result.missingRequired?.length > 0 ? '❌' : 
                    result.missingOptional?.length > 0 ? '⚠️' : '✅';
      log(`${status} ${table}: ${result.columns.length} columns, ${result.recordCount} records`, 'white');
    } else {
      log(`❌ ${table}: Table not accessible`, 'red');
    }
  });
  
  log(`\n🎯 OVERALL STATUS:`, 'cyan');
  log(`   Tables analyzed: ${tables.length}`, 'white');
  log(`   Total records: ${totalRecords}`, 'white');
  log(`   Missing required columns: ${totalMissingRequired}`, totalMissingRequired > 0 ? 'red' : 'green');
  log(`   Missing optional columns: ${totalMissingOptional}`, totalMissingOptional > 0 ? 'yellow' : 'green');
  log(`   Extra columns: ${totalExtra}`, 'blue');
  
  // Recommendations
  log(`\n💡 RECOMMENDATIONS:`, 'cyan');
  if (totalMissingRequired > 0) {
    log(`   🔥 CRITICAL: Add missing required columns immediately`, 'red');
  }
  if (totalMissingOptional > 0) {
    log(`   ⚠️ ENHANCEMENT: Consider adding optional columns for better functionality`, 'yellow');
  }
  if (totalMissingRequired === 0 && totalMissingOptional === 0) {
    log(`   🎉 EXCELLENT: Database schema is complete!`, 'green');
  }
  
  return results;
}

// Run the analysis
if (require.main === module) {
  generateSchemaReport().catch(error => {
    console.error('❌ Schema analysis failed:', error);
    process.exit(1);
  });
}

module.exports = { generateSchemaReport, checkTableSchema };
