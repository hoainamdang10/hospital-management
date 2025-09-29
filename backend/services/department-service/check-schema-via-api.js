#!/usr/bin/env node

/**
 * 🔍 CHECK DATABASE SCHEMA VIA API
 * 
 * This script checks database schema by calling the Department Service API
 * and analyzing the actual data structure returned.
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

// Expected schema for hospital management system
const EXPECTED_SCHEMA = {
  departments: {
    required: ['department_id', 'department_name', 'department_code', 'is_active', 'created_at'],
    recommended: ['description', 'location', 'phone_number', 'email', 'head_doctor_id', 'parent_department_id', 'updated_at']
  },
  specialties: {
    required: ['specialty_id', 'specialty_name', 'department_id', 'is_active', 'created_at'],
    recommended: ['description', 'average_consultation_time', 'consultation_fee_min', 'consultation_fee_max', 'required_certifications', 'updated_at']
  },
  rooms: {
    required: ['room_id', 'room_number', 'department_id', 'room_type', 'capacity', 'status', 'is_active', 'created_at'],
    recommended: ['location', 'equipment_ids', 'notes', 'updated_at']
  }
};

async function analyzeTableSchema(tableName, apiEndpoint, expectedSchema) {
  log(`\n📋 Analyzing ${tableName.toUpperCase()} table schema`, 'cyan');
  log('=' .repeat(60), 'cyan');
  
  const result = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}${apiEndpoint}`);
  
  if (!result.success) {
    log(`❌ Failed to fetch ${tableName}: ${result.error}`, 'red');
    return { success: false, analysis: null };
  }
  
  const data = result.data.data;
  if (!data || data.length === 0) {
    log(`⚠️ No data found in ${tableName} table`, 'yellow');
    return { success: true, analysis: { columns: [], recordCount: 0 } };
  }
  
  // Analyze first record to get column structure
  const firstRecord = data[0];
  const actualColumns = Object.keys(firstRecord);
  const recordCount = data.length;
  
  log(`📊 Found ${recordCount} records in ${tableName}`, 'white');
  log(`📋 Actual columns (${actualColumns.length}):`, 'white');
  
  // Check against expected schema
  const requiredColumns = expectedSchema.required || [];
  const recommendedColumns = expectedSchema.recommended || [];
  const allExpectedColumns = [...requiredColumns, ...recommendedColumns];
  
  const missingRequired = requiredColumns.filter(col => !actualColumns.includes(col));
  const missingRecommended = recommendedColumns.filter(col => !actualColumns.includes(col));
  const extraColumns = actualColumns.filter(col => !allExpectedColumns.includes(col));
  
  // Display column analysis
  actualColumns.forEach(col => {
    const value = firstRecord[col];
    const type = typeof value;
    const isRequired = requiredColumns.includes(col);
    const isRecommended = recommendedColumns.includes(col);
    
    let status = '';
    let color = 'white';
    
    if (isRequired) {
      status = '[REQUIRED]';
      color = 'green';
    } else if (isRecommended) {
      status = '[RECOMMENDED]';
      color = 'cyan';
    } else {
      status = '[EXTRA]';
      color = 'blue';
    }
    
    log(`   ✓ ${col} (${type}) ${status}`, color);
  });
  
  // Show missing columns
  if (missingRequired.length > 0) {
    log(`\n❌ Missing REQUIRED columns (${missingRequired.length}):`, 'red');
    missingRequired.forEach(col => log(`   - ${col}`, 'red'));
  }
  
  if (missingRecommended.length > 0) {
    log(`\n⚠️ Missing RECOMMENDED columns (${missingRecommended.length}):`, 'yellow');
    missingRecommended.forEach(col => log(`   - ${col}`, 'yellow'));
  }
  
  if (extraColumns.length > 0) {
    log(`\n🔍 Extra columns (${extraColumns.length}):`, 'blue');
    extraColumns.forEach(col => log(`   + ${col}`, 'blue'));
  }
  
  // Show sample data
  log(`\n📄 Sample record:`, 'white');
  log(JSON.stringify(firstRecord, null, 2), 'white');
  
  return {
    success: true,
    analysis: {
      tableName,
      columns: actualColumns,
      recordCount,
      missingRequired,
      missingRecommended,
      extraColumns,
      sampleRecord: firstRecord
    }
  };
}

async function checkDatabaseSchema() {
  log('🏥 HOSPITAL MANAGEMENT DATABASE SCHEMA CHECK', 'cyan');
  log('=' .repeat(80), 'cyan');
  log(`📅 Check Date: ${new Date().toISOString()}`, 'white');
  
  const analyses = [];
  
  // Check Departments
  const deptResult = await analyzeTableSchema('departments', '/api/departments', EXPECTED_SCHEMA.departments);
  if (deptResult.success && deptResult.analysis) {
    analyses.push(deptResult.analysis);
  }
  
  // Check Specialties
  const specResult = await analyzeTableSchema('specialties', '/api/specialties', EXPECTED_SCHEMA.specialties);
  if (specResult.success && specResult.analysis) {
    analyses.push(specResult.analysis);
  }
  
  // Check Rooms
  const roomResult = await analyzeTableSchema('rooms', '/api/rooms', EXPECTED_SCHEMA.rooms);
  if (roomResult.success && roomResult.analysis) {
    analyses.push(roomResult.analysis);
  }
  
  // Generate summary report
  log('\n\n📊 COMPREHENSIVE SCHEMA ANALYSIS SUMMARY', 'cyan');
  log('=' .repeat(80), 'cyan');
  
  let totalTables = analyses.length;
  let totalRecords = 0;
  let totalMissingRequired = 0;
  let totalMissingRecommended = 0;
  let totalExtraColumns = 0;
  
  analyses.forEach(analysis => {
    totalRecords += analysis.recordCount;
    totalMissingRequired += analysis.missingRequired?.length || 0;
    totalMissingRecommended += analysis.missingRecommended?.length || 0;
    totalExtraColumns += analysis.extraColumns?.length || 0;
    
    const status = analysis.missingRequired?.length > 0 ? '❌' : 
                  analysis.missingRecommended?.length > 0 ? '⚠️' : '✅';
    
    log(`${status} ${analysis.tableName}: ${analysis.columns.length} columns, ${analysis.recordCount} records`, 'white');
  });
  
  log(`\n🎯 OVERALL DATABASE STATUS:`, 'cyan');
  log(`   Tables analyzed: ${totalTables}`, 'white');
  log(`   Total records: ${totalRecords}`, 'white');
  log(`   Missing required columns: ${totalMissingRequired}`, totalMissingRequired > 0 ? 'red' : 'green');
  log(`   Missing recommended columns: ${totalMissingRecommended}`, totalMissingRecommended > 0 ? 'yellow' : 'green');
  log(`   Extra columns: ${totalExtraColumns}`, 'blue');
  
  // Detailed recommendations
  log(`\n💡 DETAILED RECOMMENDATIONS:`, 'cyan');
  
  if (totalMissingRequired > 0) {
    log(`\n🔥 CRITICAL ISSUES TO FIX:`, 'red');
    analyses.forEach(analysis => {
      if (analysis.missingRequired?.length > 0) {
        log(`   ${analysis.tableName}:`, 'red');
        analysis.missingRequired.forEach(col => {
          log(`     - ADD COLUMN ${col}`, 'red');
        });
      }
    });
  }
  
  if (totalMissingRecommended > 0) {
    log(`\n⚠️ RECOMMENDED ENHANCEMENTS:`, 'yellow');
    analyses.forEach(analysis => {
      if (analysis.missingRecommended?.length > 0) {
        log(`   ${analysis.tableName}:`, 'yellow');
        analysis.missingRecommended.forEach(col => {
          log(`     - CONSIDER ADDING ${col}`, 'yellow');
        });
      }
    });
  }
  
  if (totalMissingRequired === 0) {
    log(`\n🎉 EXCELLENT: All required columns are present!`, 'green');
    if (totalMissingRecommended === 0) {
      log(`🏆 PERFECT: Database schema is complete and optimal!`, 'green');
    }
  }
  
  // Generate SQL commands for missing columns
  if (totalMissingRequired > 0 || totalMissingRecommended > 0) {
    log(`\n🔧 SQL COMMANDS TO ADD MISSING COLUMNS:`, 'cyan');
    log('=' .repeat(50), 'cyan');
    
    analyses.forEach(analysis => {
      const allMissing = [...(analysis.missingRequired || []), ...(analysis.missingRecommended || [])];
      if (allMissing.length > 0) {
        log(`\n-- ${analysis.tableName.toUpperCase()} table`, 'white');
        allMissing.forEach(col => {
          const sqlType = getSQLType(col);
          log(`ALTER TABLE ${analysis.tableName} ADD COLUMN ${col} ${sqlType};`, 'cyan');
        });
      }
    });
  }
  
  return analyses;
}

function getSQLType(columnName) {
  // Suggest appropriate SQL types based on column names
  if (columnName.includes('time') || columnName.includes('duration')) return 'INTEGER';
  if (columnName.includes('fee') || columnName.includes('cost') || columnName.includes('price')) return 'DECIMAL(10,2)';
  if (columnName.includes('_at') || columnName.includes('date')) return 'TIMESTAMP';
  if (columnName.includes('is_') || columnName.includes('active')) return 'BOOLEAN DEFAULT true';
  if (columnName.includes('id')) return 'VARCHAR(20)';
  if (columnName.includes('email')) return 'VARCHAR(255)';
  if (columnName.includes('phone')) return 'VARCHAR(20)';
  if (columnName.includes('description') || columnName.includes('notes')) return 'TEXT';
  if (columnName.includes('certifications') || columnName.includes('equipment')) return 'TEXT[]';
  return 'VARCHAR(255)';
}

// Run the schema check
if (require.main === module) {
  checkDatabaseSchema().catch(error => {
    console.error('❌ Schema check failed:', error);
    process.exit(1);
  });
}

module.exports = { checkDatabaseSchema, analyzeTableSchema };
