const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');

/**
 * Simple GraphQL Schema Test
 * Tests schema compilation without TypeScript compilation
 */
async function testSchema() {
  try {
    console.log('🔍 Testing GraphQL Schema compilation...\n');
    
    // Read schema files directly
    const schemaDir = path.join(__dirname, 'src', 'schema');
    
    const baseSchema = fs.readFileSync(path.join(schemaDir, 'index.ts'), 'utf8');
    const doctorSchema = fs.readFileSync(path.join(schemaDir, 'doctor.schema.ts'), 'utf8');
    const patientSchema = fs.readFileSync(path.join(schemaDir, 'patient.schema.ts'), 'utf8');
    const appointmentSchema = fs.readFileSync(path.join(schemaDir, 'appointment.schema.ts'), 'utf8');
    const departmentSchema = fs.readFileSync(path.join(schemaDir, 'department.schema.ts'), 'utf8');
    const medicalRecordSchema = fs.readFileSync(path.join(schemaDir, 'medical-record.schema.ts'), 'utf8');
    
    console.log('📋 Schema files loaded:');
    console.log(`   - Base schema: ${baseSchema.length} characters`);
    console.log(`   - Doctor schema: ${doctorSchema.length} characters`);
    console.log(`   - Patient schema: ${patientSchema.length} characters`);
    console.log(`   - Appointment schema: ${appointmentSchema.length} characters`);
    console.log(`   - Department schema: ${departmentSchema.length} characters`);
    console.log(`   - Medical Record schema: ${medicalRecordSchema.length} characters`);
    
    // Extract GraphQL content from template literals
    function extractGraphQL(content) {
      const match = content.match(/gql`([\s\S]*?)`/);
      return match ? match[1] : '';
    }
    
    const baseTypeDefs = extractGraphQL(baseSchema);
    const doctorTypeDefs = extractGraphQL(doctorSchema);
    const patientTypeDefs = extractGraphQL(patientSchema);
    const appointmentTypeDefs = extractGraphQL(appointmentSchema);
    const departmentTypeDefs = extractGraphQL(departmentSchema);
    const medicalRecordTypeDefs = extractGraphQL(medicalRecordSchema);
    
    console.log('\n🔍 Checking for duplicate field definitions:');
    
    // Check for medicalRecord query
    const medicalRecordQueries = [];
    if (medicalRecordTypeDefs.includes('medicalRecord(')) {
      medicalRecordQueries.push('medical-record.schema.ts');
    }
    if (departmentTypeDefs.includes('medicalRecord(')) {
      medicalRecordQueries.push('department.schema.ts');
    }
    if (patientTypeDefs.includes('medicalRecord(')) {
      medicalRecordQueries.push('patient.schema.ts');
    }
    if (doctorTypeDefs.includes('medicalRecord(')) {
      medicalRecordQueries.push('doctor.schema.ts');
    }
    if (appointmentTypeDefs.includes('medicalRecord(')) {
      medicalRecordQueries.push('appointment.schema.ts');
    }
    
    console.log(`   - medicalRecord query found in: ${medicalRecordQueries.join(', ') || 'none'}`);
    
    // Check for patientMedicalRecords query
    const patientMedicalRecordsQueries = [];
    if (medicalRecordTypeDefs.includes('patientMedicalRecords(')) {
      patientMedicalRecordsQueries.push('medical-record.schema.ts');
    }
    if (departmentTypeDefs.includes('patientMedicalRecords(')) {
      patientMedicalRecordsQueries.push('department.schema.ts');
    }
    if (patientTypeDefs.includes('patientMedicalRecords(')) {
      patientMedicalRecordsQueries.push('patient.schema.ts');
    }
    if (doctorTypeDefs.includes('patientMedicalRecords(')) {
      patientMedicalRecordsQueries.push('doctor.schema.ts');
    }
    if (appointmentTypeDefs.includes('patientMedicalRecords(')) {
      patientMedicalRecordsQueries.push('appointment.schema.ts');
    }
    
    console.log(`   - patientMedicalRecords query found in: ${patientMedicalRecordsQueries.join(', ') || 'none'}`);
    
    // Report conflicts
    if (medicalRecordQueries.length > 1) {
      console.log(`   ❌ CONFLICT: medicalRecord query defined in multiple files: ${medicalRecordQueries.join(', ')}`);
    }
    
    if (patientMedicalRecordsQueries.length > 1) {
      console.log(`   ❌ CONFLICT: patientMedicalRecords query defined in multiple files: ${patientMedicalRecordsQueries.join(', ')}`);
    }
    
    if (medicalRecordQueries.length <= 1 && patientMedicalRecordsQueries.length <= 1) {
      console.log('   ✅ No duplicate field definitions found');
    }
    
    console.log('\n🔨 Building GraphQL schema...');
    
    // Combine all schemas
    const combinedSchema = [
      baseTypeDefs,
      doctorTypeDefs,
      patientTypeDefs,
      appointmentTypeDefs,
      departmentTypeDefs,
      medicalRecordTypeDefs
    ].join('\n');
    
    console.log(`   Combined length: ${combinedSchema.length} characters`);
    
    // Try to build the schema
    const builtSchema = buildSchema(combinedSchema);
    
    console.log('✅ Schema compilation successful!');
    console.log(`   - Query fields: ${Object.keys(builtSchema.getQueryType().getFields()).length}`);
    console.log(`   - Mutation fields: ${Object.keys(builtSchema.getMutationType().getFields()).length}`);
    
    if (builtSchema.getSubscriptionType()) {
      console.log(`   - Subscription fields: ${Object.keys(builtSchema.getSubscriptionType().getFields()).length}`);
    }
    
  } catch (error) {
    console.error('❌ Schema compilation failed:');
    console.error(error.message);
    
    // Try to provide more specific error information
    if (error.message.includes('can only be defined once')) {
      console.error('\n💡 Duplicate definition detected!');
      const lines = error.message.split('\n');
      for (const line of lines) {
        if (line.includes('can only be defined once')) {
          console.error(`   - ${line}`);
        }
      }
    }
    
    if (error.message.includes('undefined')) {
      console.error('\n💡 This appears to be an undefined type error.');
      console.error('   Check for missing type definitions or imports.');
    }
    
    process.exit(1);
  }
}

// Run the test
testSchema();
