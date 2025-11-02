/**
 * SendGrid Email Delivery Test
 * Tests SendGrid integration with actual email delivery
 */

require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Hospital Management System';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found in .env');
  process.exit(1);
}

if (!FROM_EMAIL) {
  console.error('❌ SENDGRID_FROM_EMAIL not found in .env');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

// Test 1: Simple text email
async function testSimpleEmail() {
  console.log('\n📧 TEST 1: Simple Text Email');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const msg = {
    to: FROM_EMAIL, // Send to self for testing
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: '✅ Test Email from Notifications Service',
    text: 'This is a test email from Hospital Management System Notifications Service.\n\nIf you receive this, SendGrid integration is working!',
    html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #10b981;">✅ Test Email Successful</h2><p>This is a test email from <strong>Hospital Management System</strong> Notifications Service.</p><p>If you receive this, <strong>SendGrid integration is working!</strong></p><hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 14px;">Sent at: ' + new Date().toLocaleString('vi-VN') + '</p></div>'
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully!');
    console.log('   Status:', response[0].statusCode);
    console.log('   To:', msg.to);
    console.log('   From:', msg.from.email);
    console.log('   Subject:', msg.subject);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body);
    }
    return false;
  }
}

// Test 2: Welcome email template (USER_WELCOME)
async function testWelcomeTemplate() {
  console.log('\n📧 TEST 2: Welcome Email Template (USER_WELCOME)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const templateData = {
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    email: FROM_EMAIL,
    role: 'PATIENT',
    hospitalName: 'Bệnh viện Đa khoa Kutou',
    contactPhone: '1900-xxxx'
  };

  const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Chào mừng đến với ${templateData.hospitalName}!</h2>
  <p>Kính gửi <strong>${templateData.firstName} ${templateData.lastName}</strong>,</p>
  <p>Tài khoản của bạn đã được tạo thành công.</p>
  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Email:</strong> ${templateData.email}</p>
    <p style="margin: 5px 0;"><strong>Vai trò:</strong> ${templateData.role}</p>
  </div>
  <p>Vui lòng xác thực email để kích hoạt tài khoản.</p>
  <p style="margin-top: 30px;">Trân trọng,<br/><strong>${templateData.hospitalName}</strong></p>
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
  <p style="color: #6b7280; font-size: 12px;">🧪 This is a TEST email from Notifications Service</p>
</div>`;

  const msg = {
    to: FROM_EMAIL,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: `Chào mừng đến với ${templateData.hospitalName}`,
    text: `Kính gửi ${templateData.firstName} ${templateData.lastName},\n\nChào mừng bạn đến với ${templateData.hospitalName}!\n\nTài khoản của bạn đã được tạo thành công:\n- Email: ${templateData.email}\n- Vai trò: ${templateData.role}\n\nVui lòng xác thực email của bạn để kích hoạt tài khoản.\n\nTrân trọng,\n${templateData.hospitalName}`,
    html: htmlContent
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Welcome email sent successfully!');
    console.log('   Status:', response[0].statusCode);
    console.log('   Template: USER_WELCOME (Identity Service)');
    console.log('   Recipient:', templateData.firstName, templateData.lastName);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body);
    }
    return false;
  }
}

// Test 3: Patient welcome template (PATIENT_WELCOME)
async function testPatientWelcomeTemplate() {
  console.log('\n📧 TEST 3: Patient Welcome Template (PATIENT_WELCOME)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const templateData = {
    patientName: 'Trần Thị B',
    patientId: 'PT-2025-001',
    phone: '+84 912 345 678',
    hospitalName: 'Bệnh viện Đa khoa Kutou',
    contactPhone: '1900-xxxx'
  };

  const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #10b981;">🏥 Chào mừng đến với ${templateData.hospitalName}!</h2>
  <p>Kính gửi <strong>${templateData.patientName}</strong>,</p>
  <p>Hồ sơ bệnh nhân của bạn đã được tạo thành công.</p>
  <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
    <p style="margin: 5px 0;"><strong>Mã bệnh nhân:</strong> ${templateData.patientId}</p>
    <p style="margin: 5px 0;"><strong>Số điện thoại:</strong> ${templateData.phone}</p>
  </div>
  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">🏥 Quy trình sử dụng</h3>
    <ol style="padding-left: 20px;">
      <li>Đăng nhập cổng thông tin</li>
      <li>Đặt lịch hẹn khám bệnh</li>
      <li>Xem kết quả xét nghiệm</li>
      <li>Theo dõi lịch sử khám bệnh</li>
    </ol>
  </div>
  <p style="margin-top: 30px;">Hotline: <strong>${templateData.contactPhone}</strong></p>
  <p>Trân trọng,<br/><strong>${templateData.hospitalName}</strong></p>
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
  <p style="color: #6b7280; font-size: 12px;">🧪 This is a TEST email from Notifications Service</p>
</div>`;

  const msg = {
    to: FROM_EMAIL,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: `Chào mừng đến với ${templateData.hospitalName}`,
    text: `Kính gửi ${templateData.patientName},\n\nChào mừng bạn đến với ${templateData.hospitalName}!\n\nHồ sơ bệnh nhân của bạn đã được tạo thành công:\n- Mã bệnh nhân: ${templateData.patientId}\n- Số điện thoại: ${templateData.phone}\n\nTrân trọng,\n${templateData.hospitalName}`,
    html: htmlContent
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Patient welcome email sent successfully!');
    console.log('   Status:', response[0].statusCode);
    console.log('   Template: PATIENT_WELCOME (Patient Registry)');
    console.log('   Patient:', templateData.patientName);
    console.log('   Patient ID:', templateData.patientId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send patient welcome email');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body);
    }
    return false;
  }
}

// Test 4: Password reset template (PASSWORD_RESET)
async function testPasswordResetTemplate() {
  console.log('\n📧 TEST 4: Password Reset Template (PASSWORD_RESET)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const templateData = {
    firstName: 'Lê',
    lastName: 'Văn C',
    email: FROM_EMAIL,
    resetLink: 'https://hospital.example.com/reset-password?token=abc123',
    resetToken: 'ABC-123-XYZ',
    hospitalName: 'Bệnh viện Đa khoa Kutou',
    contactPhone: '1900-xxxx'
  };

  const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #ef4444;">🔒 Đặt lại mật khẩu</h2>
  <p>Kính gửi <strong>${templateData.firstName} ${templateData.lastName}</strong>,</p>
  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho <strong>${templateData.email}</strong>.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${templateData.resetLink}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Đặt Lại Mật Khẩu</a>
  </div>
  <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
    <p style="margin: 5px 0; color: #991b1b;"><strong>⚠️ LƯU Ý BẢO MẬT:</strong></p>
    <ul style="margin: 10px 0; padding-left: 20px; color: #991b1b;">
      <li>Không chia sẻ link này</li>
      <li>Tạo mật khẩu mạnh (8+ ký tự)</li>
      <li>Link có hiệu lực trong 1 giờ</li>
    </ul>
  </div>
  <p style="margin-top: 30px;">Trân trọng,<br/><strong>${templateData.hospitalName}</strong></p>
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
  <p style="color: #6b7280; font-size: 12px;">🧪 This is a TEST email from Notifications Service</p>
</div>`;

  const msg = {
    to: FROM_EMAIL,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: `🔒 Yêu cầu đặt lại mật khẩu - ${templateData.hospitalName}`,
    text: `Kính gửi ${templateData.firstName} ${templateData.lastName},\n\nChúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${templateData.email}.\n\nNhấn vào link dưới đây để đặt lại mật khẩu (có hiệu lực trong 1 giờ):\n${templateData.resetLink}\n\nMã xác nhận: ${templateData.resetToken}\n\nTrân trọng,\n${templateData.hospitalName}`,
    html: htmlContent
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Password reset email sent successfully!');
    console.log('   Status:', response[0].statusCode);
    console.log('   Template: PASSWORD_RESET (Identity Service)');
    console.log('   Priority: HIGH');
    return true;
  } catch (error) {
    console.error('❌ Failed to send password reset email');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body);
    }
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  SENDGRID EMAIL DELIVERY TEST SUITE                     ║');
  console.log('║  Notifications Service - Hospital Management System     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  console.log('\n📋 Configuration:');
  console.log('   API Key:', SENDGRID_API_KEY.substring(0, 20) + '...');
  console.log('   From Email:', FROM_EMAIL);
  console.log('   From Name:', FROM_NAME);
  console.log('   Test Recipient:', FROM_EMAIL, '(sending to self)');
  
  const results = {
    total: 4,
    passed: 0,
    failed: 0
  };

  // Run tests
  if (await testSimpleEmail()) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests

  if (await testWelcomeTemplate()) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 2000));

  if (await testPatientWelcomeTemplate()) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 2000));

  if (await testPasswordResetTemplate()) results.passed++;
  else results.failed++;

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Results: ${results.passed}/${results.total} tests passed`);
  
  if (results.passed === results.total) {
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('   SendGrid integration is working correctly.');
    console.log('   Check your inbox:', FROM_EMAIL);
    console.log('   You should have received 4 test emails.');
  } else {
    console.log(`\n⚠️  ${results.failed} TEST(S) FAILED`);
    console.log('   Please check the errors above.');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
