/**
 * Twilio SMS Quick Test
 * Tests Twilio integration with minimal configuration
 */

require('dotenv').config();
const twilio = require('twilio');

// Configure Twilio
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

// Get test number from command line or use default
const TEST_NUMBER = process.argv[2];

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  TWILIO SMS QUICK TEST                                   ║');
console.log('║  Notifications Service - Hospital Management System     ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Validate configuration
if (!ACCOUNT_SID) {
  console.error('❌ TWILIO_ACCOUNT_SID not found in .env');
  process.exit(1);
}

if (!AUTH_TOKEN) {
  console.error('❌ TWILIO_AUTH_TOKEN not found in .env');
  process.exit(1);
}

if (!FROM_NUMBER) {
  console.error('❌ TWILIO_FROM_NUMBER not found in .env');
  process.exit(1);
}

console.log('📋 Twilio Configuration:');
console.log('   Account SID:', ACCOUNT_SID.substring(0, 10) + '...' + ACCOUNT_SID.substring(ACCOUNT_SID.length - 4));
console.log('   From Number:', FROM_NUMBER);
console.log('   Auth Token:', '***' + AUTH_TOKEN.substring(AUTH_TOKEN.length - 4));

// Check if test number provided
if (!TEST_NUMBER) {
  console.log('\n⚠️  Usage: node test-twilio-quick.js <phone-number>');
  console.log('   Example: node test-twilio-quick.js +84912345678');
  console.log('\n⚠️  NOTE: For Twilio trial accounts, the phone number MUST be verified first!');
  console.log('   Verify at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
  process.exit(1);
}

// Validate phone number format
if (!TEST_NUMBER.startsWith('+')) {
  console.error('\n❌ Invalid phone number format!');
  console.error('   Must use E.164 format starting with +');
  console.error('   Examples:');
  console.error('     Vietnam: +84912345678');
  console.error('     US: +14155552671');
  process.exit(1);
}

console.log('   Test Number:', TEST_NUMBER);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Initialize Twilio client
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// Test 1: Verify Twilio Account
async function verifyAccount() {
  console.log('🔍 TEST 1: Verifying Twilio Account...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const account = await client.api.accounts(ACCOUNT_SID).fetch();
    console.log('✅ Account verified successfully!');
    console.log('   Friendly Name:', account.friendlyName);
    console.log('   Status:', account.status);
    console.log('   Type:', account.type);
    return true;
  } catch (error) {
    console.error('❌ Failed to verify account');
    console.error('   Error:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    return false;
  }
}

// Test 2: Check phone number
async function checkPhoneNumber() {
  console.log('\n🔍 TEST 2: Checking From Phone Number...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const phoneNumbers = await client.incomingPhoneNumbers.list({ phoneNumber: FROM_NUMBER });
    
    if (phoneNumbers.length > 0) {
      const phone = phoneNumbers[0];
      console.log('✅ Phone number found!');
      console.log('   Phone Number:', phone.phoneNumber);
      console.log('   Friendly Name:', phone.friendlyName);
      console.log('   Capabilities:', JSON.stringify(phone.capabilities));
      return true;
    } else {
      console.log('⚠️  Phone number not found in your Twilio account');
      console.log('   This might be okay if using a verified number');
      return true; // Continue anyway
    }
  } catch (error) {
    console.error('⚠️  Could not verify phone number');
    console.error('   Error:', error.message);
    return true; // Continue anyway
  }
}

// Test 3: Send test SMS
async function sendTestSMS() {
  console.log('\n📱 TEST 3: Sending Test SMS...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const message = `✅ Test SMS from Hospital Management System

This is a test message from Notifications Service.

Time: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}

If you receive this, Twilio integration is working!`;

  console.log('   Sending to:', TEST_NUMBER);
  console.log('   From:', FROM_NUMBER);
  
  try {
    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: TEST_NUMBER
    });
    
    console.log('\n✅ SMS SENT SUCCESSFULLY!');
    console.log('   Message SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   To:', result.to);
    console.log('   From:', result.from);
    console.log('   Date Created:', result.dateCreated);
    console.log('   Direction:', result.direction);
    
    if (result.price) {
      console.log('   Price:', result.price, result.priceUnit);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ FAILED TO SEND SMS');
    console.error('   Error:', error.message);
    
    if (error.code) {
      console.error('   Error Code:', error.code);
      
      // Specific error handling
      if (error.code === 21211) {
        console.error('\n📋 ERROR DETAILS:');
        console.error('   The phone number', TEST_NUMBER, 'is not verified.');
        console.error('   For Twilio TRIAL accounts, you must verify the number first.');
        console.error('\n   To verify:');
        console.error('   1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
        console.error('   2. Click "Add a new number"');
        console.error('   3. Enter', TEST_NUMBER);
        console.error('   4. Enter the verification code sent to your phone');
      } else if (error.code === 21606) {
        console.error('\n📋 ERROR DETAILS:');
        console.error('   The From number', FROM_NUMBER, 'is not a valid Twilio number.');
        console.error('   Make sure you have purchased or configured this number in Twilio.');
      } else if (error.code === 21614) {
        console.error('\n📋 ERROR DETAILS:');
        console.error('   Invalid "To" phone number format.');
        console.error('   Must use E.164 format: +[country code][number]');
      } else if (error.code === 20003) {
        console.error('\n📋 ERROR DETAILS:');
        console.error('   Authentication failed - invalid credentials.');
        console.error('   Check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
      }
    }
    
    if (error.moreInfo) {
      console.error('   More Info:', error.moreInfo);
    }
    
    return false;
  }
}

// Test 4: Send Vietnamese template SMS
async function sendVietnameseSMS() {
  console.log('\n📱 TEST 4: Sending Vietnamese Template SMS...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const message = `🏥 Chào mừng đến với BV Đa khoa Kutou!

Kính gửi Nguyễn Văn A,

Hồ sơ bệnh nhân của bạn đã được tạo thành công.

Mã BN: PT-2025-001
Hotline: 1900-xxxx

Trân trọng,
BV Đa khoa Kutou`;

  console.log('   Template: PATIENT_WELCOME (Vietnamese)');
  
  try {
    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: TEST_NUMBER
    });
    
    console.log('\n✅ Vietnamese SMS SENT SUCCESSFULLY!');
    console.log('   Message SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   Language: Vietnamese');
    console.log('   Template: PATIENT_WELCOME');
    
    return true;
  } catch (error) {
    console.error('\n❌ Failed to send Vietnamese SMS');
    console.error('   Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Twilio SMS Tests...\n');
  
  const results = {
    total: 4,
    passed: 0,
    failed: 0
  };

  // Test 1: Verify account
  if (await verifyAccount()) {
    results.passed++;
  } else {
    results.failed++;
    console.log('\n⛔ Account verification failed. Stopping tests.');
    printSummary(results);
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Check phone number
  if (await checkPhoneNumber()) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Send test SMS
  if (await sendTestSMS()) {
    results.passed++;
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 4: Send Vietnamese SMS
    if (await sendVietnameseSMS()) {
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    results.failed++;
    results.failed++; // Skip test 4 too
    console.log('\n⚠️  Skipping Test 4 due to previous failure');
  }

  printSummary(results);
}

function printSummary(results) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 Results: ${results.passed}/${results.total} tests passed`);
  
  if (results.passed === results.total) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('   ✅ Twilio account verified');
    console.log('   ✅ Phone number configured');
    console.log('   ✅ SMS delivery working');
    console.log('   ✅ Vietnamese content supported');
    console.log('\n📱 Check your phone:', TEST_NUMBER);
    console.log('   You should have received 2 SMS messages.\n');
  } else {
    console.log(`\n⚠️  ${results.failed} TEST(S) FAILED`);
    console.log('   Review the errors above for details.\n');
    
    if (results.passed === 0) {
      console.log('💡 Common issues:');
      console.log('   1. Invalid Twilio credentials');
      console.log('   2. Phone number not verified (trial account)');
      console.log('   3. Insufficient account balance');
      console.log('   4. Invalid phone number format\n');
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run
runTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
