/**
 * Check SendGrid Email Delivery Status
 * Kiểm tra trạng thái gửi email và troubleshoot
 */

import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.SENDGRID_API_KEY || '';
const fromEmail = process.env.EMAIL_FROM || 'ngocthien20122003@gmail.com';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           SENDGRID DELIVERY STATUS CHECK                       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📋 Troubleshooting Steps:\n');

console.log('1️⃣  KIỂM TRA CẤU HÌNH:');
console.log('─────────────────────────────────────────────────────────────────');
console.log(`   API Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 10)}`);
console.log(`   From Email: ${fromEmail}`);
console.log(`   To Email: patient.hms.test@gmail.com\n`);

console.log('2️⃣  CÁC NGUYÊN NHÂN THƯỜNG GẶP:\n');

console.log('   ❌ Email vào Spam/Junk folder');
console.log('      → Kiểm tra folder Spam, Junk, Promotions trong Gmail\n');

console.log('   ❌ Gmail blocking email từ SendGrid');
console.log('      → Gmail có thể block email từ sender chưa có domain authentication\n');

console.log('   ❌ SendGrid đang xử lý (queued)');
console.log('      → Email có thể mất 5-10 phút để deliver\n');

console.log('   ❌ Sender reputation thấp');
console.log('      → Email mới tạo có thể bị Gmail đánh giá thấp\n');

console.log('3️⃣  CÁCH KIỂM TRA:\n');

console.log('   📊 SendGrid Activity Feed:');
console.log('      → https://app.sendgrid.com/email_activity');
console.log('      → Tìm Message ID: c6ZSDfAMR8emgk1lDfhq9A');
console.log('      → Xem status: Delivered, Bounced, Dropped, Deferred\n');

console.log('   📧 Gmail Settings:');
console.log('      → Kiểm tra tất cả folders: Inbox, Spam, Promotions, Social, Updates');
console.log('      → Search: "from:ngocthien20122003@gmail.com"');
console.log('      → Search: "Hospital Management System"\n');

console.log('4️⃣  GIẢI PHÁP:\n');

console.log('   ✅ Gửi email test đến email khác (không phải Gmail):');
console.log('      → Outlook, Yahoo, ProtonMail để test');
console.log('      → Xác định xem có phải Gmail block không\n');

console.log('   ✅ Whitelist sender email:');
console.log('      → Thêm ngocthien20122003@gmail.com vào Contacts');
console.log('      → Gmail sẽ tin tưởng email từ contact\n');

console.log('   ✅ Setup Domain Authentication (khuyến nghị):');
console.log('      → https://app.sendgrid.com/settings/sender_auth');
console.log('      → Authenticate domain để tăng deliverability\n');

console.log('5️⃣  TEST NGAY BÂY GIỜ:\n');
console.log('─────────────────────────────────────────────────────────────────');

const testEmails = [
  'patient.hms.test@gmail.com',
  'ngocthien20122003@gmail.com' // Gửi về chính email sender để test
];

console.log(`   Đang gửi test email đến ${testEmails.length} địa chỉ...\n`);

sgMail.setApiKey(apiKey);

async function sendTestEmails() {
  for (const email of testEmails) {
    try {
      const msg = {
        to: email,
        from: {
          email: fromEmail,
          name: 'Hospital Management System'
        },
        subject: `✅ Test Email ${new Date().toLocaleTimeString('vi-VN')}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">🏥 SendGrid Test Email</h2>
            <p>Nếu bạn nhận được email này, SendGrid đang hoạt động!</p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
              <p><strong>Gửi đến:</strong> ${email}</p>
              <p><strong>From:</strong> ${fromEmail}</p>
            </div>
            <p style="color: #666; font-size: 12px;">
              Nếu email này vào Spam, vui lòng đánh dấu "Not Spam" và thêm sender vào Contacts.
            </p>
          </div>
        `,
        text: `SendGrid Test Email - ${new Date().toLocaleString('vi-VN')}`
      };

      const result = await sgMail.send(msg);
      
      console.log(`   ✅ Gửi thành công đến: ${email}`);
      console.log(`      Status: ${result[0].statusCode}`);
      console.log(`      Message ID: ${result[0].headers['x-message-id']}\n`);
      
    } catch (error: any) {
      console.error(`   ❌ Lỗi khi gửi đến ${email}:`);
      console.error(`      ${error.message}\n`);
    }
  }
}

sendTestEmails().then(() => {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    ✅ TEST HOÀN TẤT                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📝 HƯỚNG DẪN KIỂM TRA:\n');
  
  console.log('1. Kiểm tra inbox của patient.hms.test@gmail.com');
  console.log('2. Kiểm tra inbox của ngocthien20122003@gmail.com (sender email)');
  console.log('3. Nếu không thấy, kiểm tra Spam folder');
  console.log('4. Search trong Gmail: "Hospital Management System"');
  console.log('5. Kiểm tra SendGrid Activity: https://app.sendgrid.com/email_activity\n');
  
  console.log('💡 LƯU Ý:\n');
  console.log('- Email có thể mất 1-10 phút để deliver');
  console.log('- Gmail có thể block email từ sender mới');
  console.log('- Thêm sender vào Contacts để tăng deliverability');
  console.log('- Nếu vẫn không nhận được, cần setup Domain Authentication\n');
  
  process.exit(0);
}).catch((error) => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});

