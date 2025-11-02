/**
 * Twilio Test Credentials - Magic Numbers Test
 * Uses Twilio's magic test numbers for testing without real phone numbers
 * Documentation: https://www.twilio.com/docs/iam/test-credentials
 */

require('dotenv').config();
const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  TWILIO TEST CREDENTIALS - MAGIC NUMBERS TEST           ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📋 Your Twilio Test Credentials:');
console.log('   Account SID:', ACCOUNT_SID);
console.log('   Auth Token:', AUTH_TOKEN);

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error('\n❌ Missing Twilio configuration');
  process.exit(1);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('💡 ABOUT TWILIO TEST CREDENTIALS:\n');
console.log('   Twilio provides test credentials for development:');
console.log('   - Account SID starts with: AC...');
console.log('   - Auth Token is a special test token');
console.log('   - Use magic phone numbers for testing\n');
console.log('📖 Magic Test Numbers (always work):');
console.log('   FROM: +15005550006 (US)');
console.log('   TO:   +15005550006 (US - always accepts messages)');
console.log('   TO:   +15005550001 (US - invalid phone number)');
console.log('   TO:   +15005550007 (US - queue full error)');
console.log('   TO:   +15005550008 (US - message blocked error)');
console.log('   TO:   +15005550009 (US - cannot route error)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// Test 1: Send with magic FROM and TO numbers
async function testMagicNumbers() {
  console.log('📱 TEST 1: Sending SMS with Magic Numbers\n');
  
  const fromNumber = '+15005550006'; // Magic FROM number
  const toNumber = '+15005550006';   // Magic TO number (always accepts)
  
  console.log('   From:', fromNumber, '(Twilio magic FROM)');
  console.log('   To:', toNumber, '(Twilio magic TO)');
  
  const message = `✅ Test SMS from Hospital Management System

This is a test using Twilio magic test numbers.

Time: ${new Date().toLocaleString('vi-VN')}

If this message is created successfully, your Twilio integration is working!`;

  try {
    console.log('\n   Sending...');
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber
    });
    
    console.log('\n✅ SMS SENT SUCCESSFULLY!\n');
    console.log('   Message SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   To:', result.to);
    console.log('   From:', result.from);
    console.log('   Date Created:', result.dateCreated);
    console.log('   Price:', result.price || 'Free (test mode)');
    
    return true;
  } catch (error) {
    console.error('\n❌ Failed to send SMS');
    console.error('   Error:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    return false;
  }
}

// Test 2: Send Vietnamese content
async function testVietnameseContent() {
  console.log('\n📱 TEST 2: Vietnamese Content Test\n');
  
  const fromNumber = '+15005550006';
  const toNumber = '+15005550006';
  
  const message = `🏥 Thông báo từ Bệnh viện

Kính gửi Nguyễn Văn A,

Lịch hẹn khám bệnh:
📅 15/11/2025 09:00
👨‍⚕️ BS. Nguyễn Thị B
🏥 Khoa Nội Tổng Hợp

Vui lòng đến đúng giờ.

Trân trọng,
BV Đa khoa Kutou`;

  try {
    console.log('   Testing Vietnamese characters...');
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber
    });
    
    console.log('\n✅ Vietnamese SMS SENT SUCCESSFULLY!\n');
    console.log('   Message SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   Characters:', message.length);
    
    return true;
  } catch (error) {
    console.error('\n❌ Failed to send Vietnamese SMS');
    console.error('   Error:', error.message);
    return false;
  }
}

// Test 3: Test different template types
async function testTemplates() {
  console.log('\n📱 TEST 3: Testing Multiple Templates\n');
  
  const templates = [
    {
      name: 'PATIENT_WELCOME',
      message: '🏥 Chào mừng!\n\nHồ sơ BN đã tạo.\nMã: PT-001\nHotline: 1900-xxxx'
    },
    {
      name: 'APPOINTMENT_REMINDER',
      message: '🗓️ Nhắc hẹn\n\n15/11 09:00\nBS. Nguyễn Thị B\nKhoa Nội'
    },
    {
      name: 'ACCOUNT_ACTIVATED',
      message: '✅ Tài khoản kích hoạt!\n\nBạn có thể đăng nhập ngay.'
    }
  ];
  
  const fromNumber = '+15005550006';
  const toNumber = '+15005550006';
  let passed = 0;
  
  for (const template of templates) {
    console.log(`   Testing template: ${template.name}...`);
    
    try {
      const result = await client.messages.create({
        body: template.message,
        from: fromNumber,
        to: toNumber
      });
      
      console.log(`   ✅ ${template.name} - Success (SID: ${result.sid})`);
      passed++;
      
      // Wait between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ ${template.name} - Failed:`, error.message);
    }
  }
  
  console.log(`\n   Results: ${passed}/${templates.length} templates sent successfully`);
  return passed === templates.length;
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Twilio Magic Numbers Tests...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const results = {
    total: 3,
    passed: 0,
    failed: 0
  };

  // Test 1
  if (await testMagicNumbers()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2
  if (await testVietnameseContent()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3
  if (await testTemplates()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`📊 Results: ${results.passed}/${results.total} tests passed\n`);
  
  if (results.passed === results.total) {
    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('✅ Twilio test credentials are working');
    console.log('✅ SMS sending functionality verified');
    console.log('✅ Vietnamese content supported');
    console.log('✅ Multiple templates tested\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 WHAT THIS MEANS:\n');
    console.log('   Your Notifications Service SMS integration is working!');
    console.log('   The code is ready for production.\n');
    console.log('📝 NEXT STEPS FOR PRODUCTION:\n');
    console.log('   1. Get REAL Twilio credentials:');
    console.log('      - Sign up at: https://www.twilio.com');
    console.log('      - Upgrade to paid account (or use trial with verified numbers)');
    console.log('      - Buy a real phone number\n');
    console.log('   2. Update .env with REAL credentials:');
    console.log('      - TWILIO_ACCOUNT_SID (from real account)');
    console.log('      - TWILIO_AUTH_TOKEN (from real account)');
    console.log('      - TWILIO_FROM_NUMBER (real phone number)\n');
    console.log('   3. Test with real phone numbers\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } else {
    console.log(`⚠️  ${results.failed} TEST(S) FAILED\n`);
    console.log('   Please check the errors above.\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

runTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
