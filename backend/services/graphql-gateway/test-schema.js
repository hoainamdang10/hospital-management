const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');

/**
 * Test GraphQL Schema Compilation
 * Checks for type conflicts and schema validity
 */
async function testSchema() {
  try {
    console.log('🔍 Testing GraphQL Schema compilation...\n');
    
    // Import the schema
    const { typeDefs } = require('./dist/index.js');
    
    console.log('📋 Schema files loaded:');
    console.log(`   - Total schema definitions: ${typeDefs.length}`);
    
    // Convert GraphQL documents to string
    let schemaString = '';
    for (const typeDef of typeDefs) {
      if (typeof typeDef === 'string') {
        schemaString += typeDef + '\n';
      } else if (typeDef && typeDef.loc && typeDef.loc.source) {
        schemaString += typeDef.loc.source.body + '\n';
      }
    }
    
    console.log(`   - Combined schema length: ${schemaString.length} characters\n`);
    
    // Try to build the schema
    console.log('🔨 Building GraphQL schema...');
    const schema = buildSchema(schemaString);
    
    console.log('✅ Schema compilation successful!\n');
    
    // Get schema info
    const typeMap = schema.getTypeMap();
    const types = Object.keys(typeMap).filter(name => !name.startsWith('__'));
    
    console.log('📊 Schema Statistics:');
    console.log(`   - Total types: ${types.length}`);
    console.log(`   - Query fields: ${Object.keys(schema.getQueryType().getFields()).length}`);
    console.log(`   - Mutation fields: ${Object.keys(schema.getMutationType().getFields()).length}`);
    
    if (schema.getSubscriptionType()) {
      console.log(`   - Subscription fields: ${Object.keys(schema.getSubscriptionType().getFields()).length}`);
    }
    
    console.log('\n🎉 All schema conflicts have been resolved!');
    console.log('   GraphQL Gateway is ready for deployment.');
    
  } catch (error) {
    console.error('❌ Schema compilation failed:');
    console.error(error.message);
    
    // Try to provide more specific error information
    if (error.message.includes('duplicate')) {
      console.error('\n💡 This appears to be a duplicate type/field error.');
      console.error('   Check for duplicate type definitions across schema files.');
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
