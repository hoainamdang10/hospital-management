/**
 * Twilio SMS Delivery Test
 * Tests Twilio integration with actual SMS delivery
 */

require('dotenv').config();
const twilio = require('twilio');

// Configure Twilio
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

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

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// Test 1: Simple SMS
async function testSimpleSMS(toNumber) {
  console.log('\n📱 TEST 1: Simple SMS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const message = `✅ Test SMS from Hospital Management System\n\nThis is a test message from Notifications Service.\n\nTime: ${new Date().toLocaleString('vi-VN')}`;

  try {
    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: toNumber
    });
    
    console.log('✅ SMS sent successfully!');
    console.log('   SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   To:', result.to);
    console.log('   From:', result.from);
    console.log('   Date:', result.dateCreated);
    return true;
  } catch (error) {
    console.error('❌ Failed to send SMS');
    console.error('   Error:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    return false;
  }
}

// Test 2: Account activated SMS (ACCOUNT_ACTIVATED)
async function testAccountActivatedSMS(toNumber) {
  console.log('\n📱 TEST 2: Account Activated SMS (ACCOUNT_ACTIVATED)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const templateData = {
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    hospitalName: 'BV Đa khoa Kutou'
  };

  const message = `🎉 Tài khoản đã kích hoạt!\n\nKính gửi ${templateData.firstName} ${templateData.lastName},\n\nTài khoản của bạn tại ${templateData.hospitalName} đã được kích hoạt thành công.\n\nBạn có thể đăng nhập ngay bây giờ.\n\nTrân trọng,\n${templateData.hospitalName}`;

  try {
    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: toNumber
    });
    
    console.log('✅ Account activated SMS sent successfully!');
    console.log('   SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   Template: ACCOUNT_ACTIVATED (Identity Service)');
    return true;
  } catch (error) {
    console.error('❌ Failed to send account activated SMS');
    console.error('   Error:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    return false;
  }
}

// Test 3: Patient welcome SMS (PATIENT_WELCOME)
async function testPatientWelcomeSMS(toNumber) {
  console.log('\n📱 TEST 3: Patient Welcome SMS (PATIENT_WELCOME)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const templateData = {
    patientName: 'Trần Thị B',
    patientId: 'PT-2025-001',
    hospitalName: 'BV Đa khoa Kutou',
    contactPhone: '1900-xxxx'
  };

  const message = `🏥 Chào mừng đến với ${templateData.hospitalName}!\n\nKính gửi ${templateData.patientName},\n\nHồ sơ bệnh nhân của bạn đã được tạo.\n\nMã BN: ${templateData.patientId}\n\nHotline: ${templateData.contactPhone}\n\nTrân trọng,\n${templateData.hospitalName}`;

  try {
    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: toNumber
    });
    
    console.log('✅ Patient welcome SMS sent successfully!');
    console.log('   SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   Template: PATIENT_WELCOME (Patient Registry)');
    console.log('   Patient:', templateData.patientName);
    return true;
  } catch (error) {
    console.error('❌ Failed to send patient welcome SMS');
    console.error('   Error:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    return false;
  }
}

// Test 4: Appointment reminder SMS
async function testAppointmentReminderSMS(toNumber) {
  console.log('\n📱 TEST 4: Appointment Reminder SMS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const templateData = {
    patientName: 'Lê Văn C',
    appointmentDate: '15/11/2025',
    appointmentTime: '09:00',
    doctorName: 'BS. Nguyễn Thị D',
    department: 'Khoa Nội',
    hospitalName: 'BV Đa khoa Kutou'
  };

  const message = `🗓️ Nhắc hẹn khám bệnh\n\nKính gửi ${templateData.patientName},\n\nBạn có lịch hẹn:\n📅 ${templateData.appointmentDate} ${templateData.appointmentTime}\n👨‍⚕️ ${templateData.doctorName}\n🏥 ${templateData.department}\n\nVui lòng đến đúng giờ.\n\n${templateData.hospitalName}`;

  try {
    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: toNumber
    });
    
    console.log('✅ Appointment reminder SMS sent successfully!');
    console.log('   SID:', result.sid);
    console.log('   Status:', result.status);
    console.log('   Template: APPOINTMENT_REMINDER');
    return true;
  } catch (error) {
    console.error('❌ Failed to send appointment reminder SMS');
    console.error('   Error:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  TWILIO SMS DELIVERY TEST SUITE                         ║');
  console.log('║  Notifications Service - Hospital Management System     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  console.log('\n📋 Configuration:');
  console.log('   Account SID:', ACCOUNT_SID.substring(0, 10) + '...');
  console.log('   From Number:', FROM_NUMBER);
  
  // Prompt for test phone number
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question('\n📞 Enter phone number to test (E.164 format, e.g., +84912345678): ', async (testNumber) => {
      readline.close();
      
      if (!testNumber || !testNumber.startsWith('+')) {
        console.error('\n❌ Invalid phone number format. Must start with + (E.164 format)');
        console.log('\nExamples:');
        console.log('  Vietnam: +84912345678');
        console.log('  US: +14155552671');
        process.exit(1);
      }

      console.log('\n   Test Number:', testNumber);
      console.log('\n⚠️  WARNING: Real SMS will be sent to this number!');
      console.log('   Make sure this is YOUR phone number for testing.\n');

      const results = {
        total: 4,
        passed: 0,
        failed: 0
      };

      // Run tests
      if (await testSimpleSMS(testNumber)) results.passed++;
      else results.failed++;

      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between tests

      if (await testAccountActivatedSMS(testNumber)) results.passed++;
      else results.failed++;

      await new Promise(resolve => setTimeout(resolve, 3000));

      if (await testPatientWelcomeSMS(testNumber)) results.passed++;
      else results.failed++;

      await new Promise(resolve => setTimeout(resolve, 3000));

      if (await testAppointmentReminderSMS(testNumber)) results.passed++;
      else results.failed++;

      // Summary
      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║  TEST SUMMARY                                            ║');
      console.log('╚══════════════════════════════════════════════════════════╝');
      console.log(`\n📊 Results: ${results.passed}/${results.total} tests passed`);
      
      if (results.passed === results.total) {
        console.log('\n✅ ALL TESTS PASSED!');
        console.log('   Twilio SMS integration is working correctly.');
        console.log('   Check your phone:', testNumber);
        console.log('   You should have received 4 test SMS messages.');
      } else {
        console.log(`\n⚠️  ${results.failed} TEST(S) FAILED`);
        console.log('   Please check the errors above.');
        console.log('\nCommon issues:');
        console.log('  - Phone number not verified (Twilio trial)');
        console.log('  - Invalid credentials');
        console.log('  - Insufficient balance');
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      resolve();
    });
  });
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
