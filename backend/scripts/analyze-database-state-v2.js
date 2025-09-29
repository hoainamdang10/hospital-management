/**
 * Analyze Current Supabase Database State - V2
 * Enhanced version that works with schema-per-service architecture
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

/**
 * Database Analysis Results
 */
const analysisResults = {
  projectInfo: {
    url: supabaseUrl,
    projectId: supabaseUrl.split('//')[1].split('.')[0]
  },
  schemas: {},
  tables: {},
  dataVolume: {},
  usage: {},
  recommendations: [],
  timestamp: new Date().toISOString(),
};

/**
 * Get known tables for each schema based on our architecture
 */
function getKnownTablesForSchema(schemaName) {
  const knownTables = {
    'public': ['profiles', 'departments'],
    'auth_schema': ['user_profiles', 'healthcare_roles', 'healthcare_permissions', 'role_permissions', 'user_role_assignments', 'failed_login_attempts', 'audit_logs'],
    'patient_schema': ['patient_profiles', 'patient_medical_history', 'patient_emergency_contacts', 'patient_insurance'],
    'doctor_schema': ['doctor_profiles', 'doctor_specializations', 'doctor_schedules', 'doctor_availability'],
    'appointment_schema': ['appointments', 'appointment_slots', 'appointment_history'],
    'medical_records_schema': ['medical_records', 'prescriptions', 'lab_results', 'diagnoses'],
    'payment_schema': ['payments', 'payment_methods', 'invoices', 'billing_history'],
    'file_schema': ['file_uploads', 'document_metadata', 'file_access_logs']
  };
  
  return knownTables[schemaName] || [];
}

/**
 * Analyze database schemas by testing access to known schemas
 */
async function analyzeSchemas() {
  console.log('🔍 Analyzing database schemas...');
  
  const knownSchemas = ['public', 'auth_schema', 'patient_schema', 'doctor_schema', 'appointment_schema', 'medical_records_schema', 'payment_schema', 'file_schema'];
  const existingSchemas = [];
  
  for (const schemaName of knownSchemas) {
    try {
      console.log(`  🔍 Testing schema: ${schemaName}`);
      
      // Create schema-specific client
      const schemaClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: schemaName }
      });
      
      // Try to access the schema by querying a simple table or system view
      const { data, error } = await schemaClient
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', schemaName)
        .limit(1);
      
      if (!error || error.message.includes('does not exist')) {
        // Schema exists, even if no tables
        existingSchemas.push({
          schema_name: schemaName,
          accessible: !error,
          error_message: error?.message
        });
        console.log(`    ✅ Schema ${schemaName}: ${error ? 'exists but empty' : 'accessible'}`);
      }
    } catch (e) {
      console.log(`    ❌ Schema ${schemaName}: not accessible`);
    }
  }
  
  analysisResults.schemas = existingSchemas;
  console.log(`✅ Found ${existingSchemas.length} schemas`);
}

/**
 * Analyze tables in each schema using schema-specific clients
 */
async function analyzeTables() {
  console.log('🔍 Analyzing database tables...');
  
  for (const schemaInfo of analysisResults.schemas) {
    const schemaName = schemaInfo.schema_name;
    
    try {
      console.log(`  📋 Checking schema: ${schemaName}`);
      
      // Create schema-specific client
      const schemaClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: schemaName }
      });
      
      // Get known tables for this schema and test their existence
      const knownTables = getKnownTablesForSchema(schemaName);
      const existingTables = [];
      
      for (const tableName of knownTables) {
        try {
          const { data, error: tableError } = await schemaClient
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!tableError) {
            existingTables.push({ 
              table_name: tableName, 
              table_type: 'BASE TABLE',
              accessible: true
            });
            console.log(`    ✅ Found table: ${tableName}`);
          } else if (tableError.message.includes('does not exist')) {
            console.log(`    ⚪ Table ${tableName}: not created yet`);
          } else {
            console.log(`    ⚠️ Table ${tableName}: ${tableError.message}`);
          }
        } catch (e) {
          console.log(`    ❌ Table ${tableName}: access error`);
        }
      }
      
      // Also try to discover any other tables
      try {
        const { data: discoveredTables, error } = await schemaClient
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', schemaName)
          .eq('table_type', 'BASE TABLE');
        
        if (!error && discoveredTables) {
          for (const table of discoveredTables) {
            if (!existingTables.find(t => t.table_name === table.table_name)) {
              existingTables.push({
                table_name: table.table_name,
                table_type: 'BASE TABLE',
                accessible: true,
                discovered: true
              });
              console.log(`    🔍 Discovered table: ${table.table_name}`);
            }
          }
        }
      } catch (e) {
        // Information schema not accessible, that's ok
      }
      
      analysisResults.tables[schemaName] = existingTables;
      console.log(`    ✅ Found ${existingTables.length} tables in ${schemaName}`);
      
      // Get row counts for each accessible table
      analysisResults.dataVolume[schemaName] = {};
      for (const table of existingTables) {
        if (table.accessible) {
          try {
            const { count, error: countError } = await schemaClient
              .from(table.table_name)
              .select('*', { count: 'exact', head: true });
            
            if (!countError) {
              analysisResults.dataVolume[schemaName][table.table_name] = count || 0;
              console.log(`    📊 ${table.table_name}: ${count || 0} rows`);
            } else {
              console.log(`    📊 ${table.table_name}: count failed - ${countError.message}`);
            }
          } catch (countError) {
            console.log(`    📊 ${table.table_name}: count error`);
          }
        }
      }
      
    } catch (error) {
      console.warn(`  ⚠️ Error analyzing schema ${schemaName}:`, error.message);
    }
  }
}

/**
 * Analyze database usage and storage
 */
async function analyzeUsage() {
  console.log('🔍 Analyzing database usage...');
  
  try {
    // Calculate total row counts
    let totalRows = 0;
    let totalTables = 0;
    
    for (const schema in analysisResults.dataVolume) {
      for (const table in analysisResults.dataVolume[schema]) {
        totalRows += analysisResults.dataVolume[schema][table];
        totalTables++;
      }
    }
    
    analysisResults.usage.totalRows = totalRows;
    analysisResults.usage.totalTables = totalTables;
    analysisResults.usage.estimatedSizeMB = Math.ceil(totalRows * 0.001); // Rough estimate
    analysisResults.usage.freetierUsagePercent = Math.round((analysisResults.usage.estimatedSizeMB / 500) * 100);
    
    console.log(`📊 Total tables: ${totalTables}`);
    console.log(`📊 Total rows: ${totalRows}`);
    console.log(`📊 Estimated size: ${analysisResults.usage.estimatedSizeMB}MB`);
    console.log(`📊 Free tier usage: ${analysisResults.usage.freetierUsagePercent}%`);
    
  } catch (error) {
    console.warn('⚠️ Usage analysis failed:', error.message);
  }
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations() {
  console.log('💡 Generating recommendations...');
  
  const recommendations = [];
  
  // Check schema implementation status
  const implementedSchemas = analysisResults.schemas.filter(s => s.accessible).length;
  const totalSchemas = analysisResults.schemas.length;
  
  if (implementedSchemas === totalSchemas) {
    recommendations.push({
      type: 'SUCCESS',
      category: 'Schema Architecture',
      issue: `All ${totalSchemas} schemas are accessible`,
      action: 'Schema-per-service architecture is properly implemented',
      priority: 'INFO'
    });
  }
  
  // Check table implementation status
  let totalExpectedTables = 0;
  let totalImplementedTables = 0;
  
  for (const schema in analysisResults.tables) {
    const expectedTables = getKnownTablesForSchema(schema);
    const implementedTables = analysisResults.tables[schema].filter(t => t.accessible);
    
    totalExpectedTables += expectedTables.length;
    totalImplementedTables += implementedTables.length;
    
    if (implementedTables.length === 0 && expectedTables.length > 0) {
      recommendations.push({
        type: 'OPPORTUNITY',
        category: 'V2 System Implementation',
        issue: `Schema ${schema} is ready for implementation (0/${expectedTables.length} tables)`,
        action: `Implement ${schema} tables for V2 system`,
        priority: 'HIGH'
      });
    } else if (implementedTables.length < expectedTables.length) {
      recommendations.push({
        type: 'INFO',
        category: 'Schema Implementation',
        issue: `Schema ${schema} partially implemented (${implementedTables.length}/${expectedTables.length} tables)`,
        action: `Complete remaining tables in ${schema}`,
        priority: 'MEDIUM'
      });
    }
  }
  
  // Overall implementation status
  const implementationPercent = Math.round((totalImplementedTables / totalExpectedTables) * 100);
  recommendations.push({
    type: 'INFO',
    category: 'Overall Progress',
    issue: `Database implementation: ${implementationPercent}% complete (${totalImplementedTables}/${totalExpectedTables} tables)`,
    action: implementationPercent < 50 ? 'Focus on core schema implementation' : 'Complete remaining features',
    priority: implementationPercent < 50 ? 'HIGH' : 'MEDIUM'
  });
  
  // Free tier recommendations
  const usage = analysisResults.usage.freeiterUsagePercent || 0;
  if (usage > 80) {
    recommendations.push({
      type: 'WARNING',
      category: 'Storage Usage',
      issue: `Database size approaching free tier limit (${usage}%)`,
      action: 'Consider data archiving or upgrade to Pro plan',
      priority: 'HIGH'
    });
  } else {
    recommendations.push({
      type: 'SUCCESS',
      category: 'Free Tier Status',
      issue: `Free tier usage is healthy (${usage}%)`,
      action: 'Continue with current optimization strategies',
      priority: 'INFO'
    });
  }
  
  analysisResults.recommendations = recommendations;
}

/**
 * Display analysis results
 */
function displayResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUPABASE DATABASE ANALYSIS RESULTS - V2');
  console.log('='.repeat(80));
  
  // Project Info
  console.log('\n🏥 PROJECT INFORMATION:');
  console.log(`   URL: ${analysisResults.projectInfo.url}`);
  console.log(`   Project ID: ${analysisResults.projectInfo.projectId}`);
  console.log(`   Analysis Time: ${analysisResults.timestamp}`);
  
  // Schemas
  console.log('\n📋 SCHEMAS STATUS:');
  for (const schema of analysisResults.schemas) {
    const tableCount = analysisResults.tables[schema.schema_name]?.length || 0;
    const rowCount = Object.values(analysisResults.dataVolume[schema.schema_name] || {}).reduce((sum, count) => sum + count, 0);
    const status = schema.accessible ? '✅' : '❌';
    console.log(`   ${status} ${schema.schema_name}: ${tableCount} tables, ${rowCount} rows`);
  }
  
  // Usage Summary
  console.log('\n📊 USAGE SUMMARY:');
  console.log(`   Total Tables: ${analysisResults.usage.totalTables || 0}`);
  console.log(`   Total Rows: ${analysisResults.usage.totalRows || 0}`);
  console.log(`   Estimated Size: ${analysisResults.usage.estimatedSizeMB || 0}MB / 500MB`);
  console.log(`   Free Tier Usage: ${analysisResults.usage.freeiterUsagePercent || 0}%`);
  console.log(`   Status: ${(analysisResults.usage.freeiterUsagePercent || 0) < 80 ? '✅ HEALTHY' : '⚠️ APPROACHING LIMIT'}`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  analysisResults.recommendations.forEach((rec, index) => {
    const icon = rec.type === 'CRITICAL' ? '🚨' : rec.type === 'WARNING' ? '⚠️' : rec.type === 'SUCCESS' ? '✅' : rec.type === 'OPPORTUNITY' ? '🚀' : 'ℹ️';
    console.log(`   ${index + 1}. ${icon} [${rec.priority}] ${rec.category}`);
    console.log(`      ${rec.issue}`);
    console.log(`      → ${rec.action}`);
    console.log('');
  });
}

/**
 * Save results to file
 */
function saveResults() {
  const outputPath = path.join(__dirname, '../docs/database-analysis-report-v2.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysisResults, null, 2));
  console.log(`💾 Analysis results saved to: ${outputPath}`);
}

/**
 * Main analysis function
 */
async function main() {
  console.log('🔍 Starting Enhanced Supabase Database Analysis...\n');
  
  try {
    await analyzeSchemas();
    await analyzeTables();
    await analyzeUsage();
    generateRecommendations();
    displayResults();
    saveResults();
    
    console.log('\n✅ Enhanced database analysis completed successfully!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run analysis
if (require.main === module) {
  main();
}

module.exports = { main, analysisResults };
