/**
 * Simple SMS Test for Test Credentials
 * Works with Twilio test credentials that have limited API access
 */

require('dotenv').config();
const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  TWILIO SMS TEST (Test Credentials)                    ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📋 Configuration:');
console.log('   Account SID:', ACCOUNT_SID);
console.log('   Auth Token:', AUTH_TOKEN);
console.log('   From Number:', FROM_NUMBER);

if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
  console.error('\n❌ Missing Twilio configuration in .env');
  process.exit(1);
}

console.log('\n💡 NOTE: Using Twilio TEST credentials');
console.log('   These credentials have limited API access but can send test SMS.\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

async function sendTestSMS(toNumber) {
  console.log('📱 Sending Test SMS...\n');
  
  // Twilio has magic test phone numbers that always work
  // See: https://www.twilio.com/docs/iam/test-credentials
  const testNumbers = [
    '+15005550006', // Valid test number (US)
    toNumber || '+15005550006'
  ];
  
  const useNumber = toNumber || testNumbers[0];
  
  console.log('   To:', useNumber);
  console.log('   From:', FROM_NUMBER);
  
  if (useNumber === '+15005550006') {
    console.log('\n   ℹ️  Using Twilio magic test number: +15005550006');
    console.log('   This number always accepts SMS when using test credentials.');
  }
  
  const message = `✅ Test SMS from Hospital Management System

This is a test message from Notifications Service.

Time: ${new Date().toLocaleString('vi-VN')}

If you receive this, Twilio integration is working!`;

  try {
    console.log('\n   Sending...');
    
    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: useNumber
    });
    
    console.log('\n✅ SMS SENT SUCCESSFULLY!\n');
    console.log('   Message SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   To:', result.to);
    console.log('   From:', result.from);
    console.log('   Date Created:', result.dateCreated);
    console.log('   Direction:', result.direction);
    
    if (result.errorCode) {
      console.log('   Error Code:', result.errorCode);
      console.log('   Error Message:', result.errorMessage);
    }
    
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  TEST RESULT: SUCCESS ✅                                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log('🎉 Twilio SMS integration is working!');
    
    if (useNumber === '+15005550006') {
      console.log('\n💡 NOTE: This was sent to a test number.');
      console.log('   In production, use real phone numbers.');
      console.log('\n📋 For testing with real numbers:');
      console.log('   - Upgrade to a paid Twilio account, OR');
      console.log('   - Verify phone numbers in trial account');
      console.log('   - Run: node test-sms-simple.js +84912345678');
    } else {
      console.log('\n📱 Check your phone:', useNumber);
      console.log('   You should receive the test SMS.');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return true;
  } catch (error) {
    console.error('\n╔══════════════════════════════════════════════════════════╗');
    console.error('║  TEST RESULT: FAILED ❌                                  ║');
    console.error('╚══════════════════════════════════════════════════════════╝\n');
    console.error('❌ Failed to send SMS');
    console.error('   Error:', error.message);
    
    if (error.code) {
      console.error('   Error Code:', error.code);
      
      if (error.code === 21211) {
        console.error('\n📋 Phone number not verified');
        console.error('   For trial accounts, verify the number at:');
        console.error('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      } else if (error.code === 20008) {
        console.error('\n📋 Test credentials limitation');
        console.error('   Your test credentials may have restricted access.');
        console.error('   Try using Twilio magic test number: +15005550006');
      } else if (error.code === 21606) {
        console.error('\n📋 Invalid From number');
        console.error('   The FROM number', FROM_NUMBER, 'is not valid.');
        console.error('   Check your Twilio phone numbers.');
      }
    }
    
    if (error.moreInfo) {
      console.error('\n   More info:', error.moreInfo);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return false;
  }
}

// Get phone number from command line
const testNumber = process.argv[2];

sendTestSMS(testNumber);
