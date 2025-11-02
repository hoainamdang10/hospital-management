/**
 * Verify Twilio Credentials
 * Quick test to verify auth token and account status
 */

require('dotenv').config();
const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  TWILIO CREDENTIALS VERIFICATION                        ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📋 Configuration:');
console.log('   Account SID:', ACCOUNT_SID);
console.log('   Auth Token:', AUTH_TOKEN);
console.log('   From Number:', FROM_NUMBER);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

async function verifyCredentials() {
  console.log('🔍 Verifying Twilio credentials...\n');
  
  try {
    // Test 1: Fetch account info
    console.log('1️⃣ Fetching account information...');
    const account = await client.api.accounts(ACCOUNT_SID).fetch();
    console.log('   ✅ Success!');
    console.log('   Friendly Name:', account.friendlyName);
    console.log('   Status:', account.status);
    console.log('   Type:', account.type);
    console.log('   Date Created:', account.dateCreated);
    
    // Test 2: Check balance (if available)
    console.log('\n2️⃣ Checking account balance...');
    try {
      const balance = await client.balance.fetch();
      console.log('   ✅ Balance retrieved!');
      console.log('   Currency:', balance.currency);
      console.log('   Balance:', balance.balance);
    } catch (err) {
      console.log('   ⚠️  Balance API not available (might be trial account)');
    }
    
    // Test 3: List phone numbers
    console.log('\n3️⃣ Checking phone numbers...');
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 5 });
    console.log('   ✅ Found', phoneNumbers.length, 'phone number(s)');
    
    if (phoneNumbers.length > 0) {
      console.log('\n   📱 Your Twilio Phone Numbers:');
      phoneNumbers.forEach((phone, idx) => {
        console.log(`   ${idx + 1}. ${phone.phoneNumber} (${phone.friendlyName})`);
        if (phone.phoneNumber === FROM_NUMBER) {
          console.log('      👆 This is your configured FROM_NUMBER ✅');
        }
      });
    }
    
    // Test 4: Check capabilities
    console.log('\n4️⃣ Checking FROM number capabilities...');
    const fromNumbers = await client.incomingPhoneNumbers.list({ phoneNumber: FROM_NUMBER });
    
    if (fromNumbers.length > 0) {
      const phone = fromNumbers[0];
      console.log('   ✅ FROM number found!');
      console.log('   Phone:', phone.phoneNumber);
      console.log('   Friendly Name:', phone.friendlyName);
      console.log('   Capabilities:');
      console.log('      - Voice:', phone.capabilities.voice ? '✅' : '❌');
      console.log('      - SMS:', phone.capabilities.sms ? '✅' : '❌');
      console.log('      - MMS:', phone.capabilities.mms ? '✅' : '❌');
      console.log('      - Fax:', phone.capabilities.fax ? '✅' : '❌');
      
      if (!phone.capabilities.sms) {
        console.log('\n   ⚠️  WARNING: This number cannot send SMS!');
      }
    } else {
      console.log('   ⚠️  FROM number not found in your account');
      console.log('   This might be okay for trial accounts with verified numbers');
    }
    
    // Summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  VERIFICATION RESULT                                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log('✅ CREDENTIALS VALID!');
    console.log('   Your Twilio auth token is working correctly.');
    console.log('   Account status:', account.status.toUpperCase());
    
    if (account.type === 'Trial') {
      console.log('\n📋 TRIAL ACCOUNT NOTES:');
      console.log('   - You have a Twilio trial account');
      console.log('   - Can only send SMS to verified phone numbers');
      console.log('   - Messages will have "Sent from your Twilio trial account" prefix');
      console.log('   - To verify numbers: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    }
    
    console.log('\n🚀 READY FOR SMS TESTING!');
    console.log('   Run: node test-twilio-quick.js <verified-phone-number>');
    console.log('   Example: node test-twilio-quick.js +84912345678\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  VERIFICATION FAILED                                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.error('❌ ERROR:', error.message);
    
    if (error.code) {
      console.error('   Error Code:', error.code);
      
      if (error.code === 20003) {
        console.error('\n📋 AUTHENTICATION FAILED');
        console.error('   Your credentials are invalid.');
        console.error('   Please check:');
        console.error('   - TWILIO_ACCOUNT_SID in .env');
        console.error('   - TWILIO_AUTH_TOKEN in .env');
        console.error('\n   Get credentials from: https://console.twilio.com');
      }
    }
    
    if (error.moreInfo) {
      console.error('\n   More info:', error.moreInfo);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

verifyCredentials();
