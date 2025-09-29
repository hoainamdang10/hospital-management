const { buildSchema } = require('graphql');

/**
 * Debug GraphQL Schema Conflicts
 * Analyzes each schema file individually to identify conflicts
 */
async function debugSchema() {
  try {
    console.log('🔍 Debugging GraphQL Schema conflicts...\n');
    
    // Import individual schemas
    const { baseTypeDefs } = require('./dist/index.js');
    const doctorTypeDefs = require('./dist/doctor.schema.js').default;
    const patientTypeDefs = require('./dist/patient.schema.js').default;
    const appointmentTypeDefs = require('./dist/appointment.schema.js').default;
    const departmentTypeDefs = require('./dist/department.schema.js').default;
    const medicalRecordTypeDefs = require('./dist/medical-record.schema.js').default;
    
    const schemas = [
      { name: 'Base', schema: baseTypeDefs },
      { name: 'Doctor', schema: doctorTypeDefs },
      { name: 'Patient', schema: patientTypeDefs },
      { name: 'Appointment', schema: appointmentTypeDefs },
      { name: 'Department', schema: departmentTypeDefs },
      { name: 'Medical Record', schema: medicalRecordTypeDefs }
    ];
    
    console.log('📋 Individual Schema Analysis:');
    
    // Test each schema individually
    for (const { name, schema } of schemas) {
      try {
        let schemaString = '';
        if (typeof schema === 'string') {
          schemaString = schema;
        } else if (schema && schema.loc && schema.loc.source) {
          schemaString = schema.loc.source.body;
        }
        
        console.log(`   ✅ ${name}: ${schemaString.length} characters`);
        
        // Check for specific patterns
        if (schemaString.includes('type VitalSigns')) {
          console.log(`      ⚠️  Contains VitalSigns type definition`);
        }
        if (schemaString.includes('type LabResult')) {
          console.log(`      ⚠️  Contains LabResult type definition`);
        }
        if (schemaString.includes('type MedicalAttachment')) {
          console.log(`      ⚠️  Contains MedicalAttachment type definition`);
        }
        if (schemaString.includes('medicalRecord(')) {
          console.log(`      ⚠️  Contains medicalRecord query`);
        }
        if (schemaString.includes('patientMedicalRecords(')) {
          console.log(`      ⚠️  Contains patientMedicalRecords query`);
        }
        
      } catch (error) {
        console.log(`   ❌ ${name}: Error - ${error.message}`);
      }
    }
    
    console.log('\n🔨 Testing combined schema...');
    
    // Combine all schemas
    let combinedSchema = '';
    for (const { schema } of schemas) {
      if (typeof schema === 'string') {
        combinedSchema += schema + '\n';
      } else if (schema && schema.loc && schema.loc.source) {
        combinedSchema += schema.loc.source.body + '\n';
      }
    }
    
    console.log(`   Combined length: ${combinedSchema.length} characters`);
    
    // Try to build
    const builtSchema = buildSchema(combinedSchema);
    console.log('✅ Schema compilation successful!');
    
    // Get schema info
    const typeMap = builtSchema.getTypeMap();
    const types = Object.keys(typeMap).filter(name => !name.startsWith('__'));
    
    console.log('\n📊 Schema Statistics:');
    console.log(`   - Total types: ${types.length}`);
    console.log(`   - Query fields: ${Object.keys(builtSchema.getQueryType().getFields()).length}`);
    console.log(`   - Mutation fields: ${Object.keys(builtSchema.getMutationType().getFields()).length}`);
    
    if (builtSchema.getSubscriptionType()) {
      console.log(`   - Subscription fields: ${Object.keys(builtSchema.getSubscriptionType().getFields()).length}`);
    }
    
  } catch (error) {
    console.error('❌ Schema compilation failed:');
    console.error(error.message);
    
    // Analyze the error
    if (error.message.includes('can only be defined once')) {
      console.error('\n💡 Duplicate definition detected!');
      const lines = error.message.split('\n');
      for (const line of lines) {
        if (line.includes('can only be defined once')) {
          console.error(`   - ${line}`);
        }
      }
    }
  }
}

// Run the debug
debugSchema();
