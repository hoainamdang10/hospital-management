/**
 * Test SendGrid Configuration
 * Verify that SendGrid credentials are loaded correctly from .env
 */

require('dotenv').config();

console.log('='.repeat(60));
console.log('📧 SendGrid Configuration Test');
console.log('='.repeat(60));

const config = {
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL,
  fromName: process.env.SENDGRID_FROM_NAME,
  enabled: process.env.SENDGRID_ENABLED === 'true'
};

console.log('\n✅ Configuration loaded:');
console.log(`   API Key: ${config.apiKey ? '✓ Present (' + config.apiKey.substring(0, 10) + '...' + config.apiKey.substring(config.apiKey.length - 5) + ')' : '✗ Missing'}`);
console.log(`   From Email: ${config.fromEmail || '✗ Missing'}`);
console.log(`   From Name: ${config.fromName || '✗ Missing'}`);
console.log(`   Enabled: ${config.enabled ? '✓ Yes' : '✗ No'}`);

// Validate configuration
const isValid = config.apiKey && 
                config.apiKey.startsWith('SG.') && 
                config.fromEmail && 
                config.fromName &&
                config.enabled;

console.log('\n' + '='.repeat(60));
if (isValid) {
  console.log('✅ SendGrid configuration is VALID and READY');
  console.log('\n📝 Next steps:');
  console.log('   1. Build the service: npm run build');
  console.log('   2. Start the service: npm run dev');
  console.log('   3. Test email sending via API');
  process.exit(0);
} else {
  console.log('❌ SendGrid configuration is INVALID or INCOMPLETE');
  console.log('\n📝 Please check your .env file');
  process.exit(1);
}
