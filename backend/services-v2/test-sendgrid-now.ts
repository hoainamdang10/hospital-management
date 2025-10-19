/**
 * SendGrid Email Test Script
 * Test gửi email verification qua SendGrid API
 * 
 * Usage: npx ts-node test-sendgrid-now.ts
 */

import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.SENDGRID_API_KEY || '';
const fromEmail = process.env.EMAIL_FROM || 'ngocthien20122003@gmail.com';
const fromName = process.env.EMAIL_FROM_NAME || 'Hospital Management System';
const toEmail = 'patient.hms.test@gmail.com';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         SENDGRID EMAIL TEST - HOSPITAL MANAGEMENT V2           ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📋 Configuration:');
console.log('─────────────────────────────────────────────────────────────────');
console.log(`API Key:        ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
console.log(`API Key Length: ${apiKey.length} characters`);
console.log(`Starts with:    ${apiKey.startsWith('SG.') ? '✅ SG.' : '❌ Invalid format'}`);
console.log(`From Email:     ${fromEmail}`);
console.log(`From Name:      ${fromName}`);
console.log(`To Email:       ${toEmail}`);
console.log('─────────────────────────────────────────────────────────────────\n');

// Validate API Key
if (!apiKey || apiKey.length < 50) {
  console.error('❌ ERROR: SENDGRID_API_KEY is missing or invalid!');
  console.error('Please check your .env file.\n');
  process.exit(1);
}

if (!apiKey.startsWith('SG.')) {
  console.error('❌ ERROR: SENDGRID_API_KEY format is invalid!');
  console.error('SendGrid API keys should start with "SG."\n');
  process.exit(1);
}

// Initialize SendGrid
sgMail.setApiKey(apiKey);

// Create email message
const msg = {
  to: toEmail,
  from: {
    email: fromEmail,
    name: fromName
  },
  subject: '🏥 Test Email - Hospital Management System V2',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 14px;
          margin: 10px 0;
        }
        .info-box {
          background: white;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 Hospital Management System V2</h1>
        <p>SendGrid Email Integration Test</p>
      </div>
      
      <div class="content">
        <h2>✅ Email Test Successful!</h2>
        
        <p>Chào bạn,</p>
        
        <p>Đây là email test từ <strong>Hospital Management System V2</strong> để xác nhận tích hợp SendGrid đã hoạt động thành công.</p>
        
        <div class="badge">✓ SendGrid API Connected</div>
        <div class="badge">✓ Email Service Working</div>
        <div class="badge">✓ Sender Verified</div>
        
        <div class="info-box">
          <h3>📊 Test Information:</h3>
          <ul>
            <li><strong>Service:</strong> Identity Service</li>
            <li><strong>Email Provider:</strong> SendGrid</li>
            <li><strong>From:</strong> ${fromEmail}</li>
            <li><strong>To:</strong> ${toEmail}</li>
            <li><strong>Timestamp:</strong> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</li>
          </ul>
        </div>
        
        <p>Nếu bạn nhận được email này, có nghĩa là:</p>
        <ul>
          <li>✅ SendGrid API Key đã được cấu hình đúng</li>
          <li>✅ Sender email đã được verify thành công</li>
          <li>✅ Hệ thống có thể gửi email verification cho user</li>
          <li>✅ Email service đã sẵn sàng cho production</li>
        </ul>
        
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Test user registration flow từ frontend</li>
          <li>Kiểm tra email verification link</li>
          <li>Test resend verification email</li>
          <li>Test password reset email</li>
        </ol>
      </div>
      
      <div class="footer">
        <p>© 2025 Hospital Management System V2</p>
        <p>Powered by SendGrid Email API</p>
        <p style="color: #999; font-size: 10px;">
          This is an automated test email. Please do not reply.
        </p>
      </div>
    </body>
    </html>
  `,
  text: `
    Hospital Management System V2 - Email Test
    
    ✅ Email Test Successful!
    
    Đây là email test từ Hospital Management System V2 để xác nhận tích hợp SendGrid đã hoạt động thành công.
    
    Test Information:
    - Service: Identity Service
    - Email Provider: SendGrid
    - From: ${fromEmail}
    - To: ${toEmail}
    - Timestamp: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
    
    Nếu bạn nhận được email này, có nghĩa là:
    ✅ SendGrid API Key đã được cấu hình đúng
    ✅ Sender email đã được verify thành công
    ✅ Hệ thống có thể gửi email verification cho user
    ✅ Email service đã sẵn sàng cho production
    
    © 2025 Hospital Management System V2
    Powered by SendGrid Email API
  `
};

console.log('📧 Sending test email...\n');
console.log('Message Details:');
console.log('─────────────────────────────────────────────────────────────────');
console.log(`Subject: ${msg.subject}`);
console.log(`From:    ${msg.from.name} <${msg.from.email}>`);
console.log(`To:      ${msg.to}`);
console.log('─────────────────────────────────────────────────────────────────\n');

// Send email
sgMail
  .send(msg)
  .then((result) => {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SUCCESS - EMAIL SENT!                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Response Details:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`Status Code:  ${result[0].statusCode}`);
    console.log(`Status Text:  ${result[0].statusCode === 202 ? 'Accepted (Email queued for delivery)' : 'Unknown'}`);
    console.log(`Message ID:   ${result[0].headers['x-message-id']}`);
    console.log('─────────────────────────────────────────────────────────────────\n');
    
    console.log('✅ Email đã được gửi thành công!');
    console.log('📬 Vui lòng kiểm tra inbox của patient.hms.test@gmail.com\n');
    
    console.log('💡 Tips:');
    console.log('  - Nếu không thấy email trong Inbox, kiểm tra Spam/Junk folder');
    console.log('  - Email có thể mất 1-2 phút để được deliver');
    console.log('  - Kiểm tra SendGrid Activity Feed: https://app.sendgrid.com/email_activity\n');
    
    console.log('🎉 SendGrid integration is working perfectly!');
    console.log('🚀 Ready for production use.\n');
    
    process.exit(0);
  })
  .catch((error: any) => {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ❌ ERROR - EMAIL FAILED!                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.error('❌ Failed to send email!\n');
    
    console.error('🔍 Error Details:');
    console.error('─────────────────────────────────────────────────────────────────');
    console.error(`Error Code:    ${error.code || 'N/A'}`);
    console.error(`Error Message: ${error.message || 'Unknown error'}`);
    console.error('─────────────────────────────────────────────────────────────────\n');
    
    if (error.response) {
      console.error('📡 SendGrid API Response:');
      console.error('─────────────────────────────────────────────────────────────────');
      console.error(`HTTP Status:   ${error.response.statusCode} ${error.response.statusMessage || ''}`);
      console.error('─────────────────────────────────────────────────────────────────\n');
      
      if (error.response.body) {
        console.error('📄 Response Body:');
        console.error('─────────────────────────────────────────────────────────────────');
        console.error(JSON.stringify(error.response.body, null, 2));
        console.error('─────────────────────────────────────────────────────────────────\n');
        
        if (error.response.body.errors && Array.isArray(error.response.body.errors)) {
          console.error('🚨 SendGrid Error Messages:');
          console.error('─────────────────────────────────────────────────────────────────');
          error.response.body.errors.forEach((err: any, index: number) => {
            console.error(`\nError ${index + 1}:`);
            console.error(`  Message: ${err.message || 'N/A'}`);
            console.error(`  Field:   ${err.field || 'N/A'}`);
            console.error(`  Help:    ${err.help || 'N/A'}`);
          });
          console.error('─────────────────────────────────────────────────────────────────\n');
        }
      }
      
      if (error.response.headers) {
        console.error('📋 Response Headers:');
        console.error('─────────────────────────────────────────────────────────────────');
        console.error(JSON.stringify(error.response.headers, null, 2));
        console.error('─────────────────────────────────────────────────────────────────\n');
      }
    }
    
    console.error('💡 Common Solutions:');
    console.error('─────────────────────────────────────────────────────────────────');
    
    if (error.response?.statusCode === 401) {
      console.error('  ❌ 401 Unauthorized - Possible causes:');
      console.error('     1. API Key is invalid or revoked');
      console.error('     2. API Key format is incorrect');
      console.error('     3. API Key permissions are insufficient');
      console.error('     → Solution: Create new API Key with Full Access');
      console.error('     → URL: https://app.sendgrid.com/settings/api_keys\n');
    } else if (error.response?.statusCode === 403) {
      console.error('  ❌ 403 Forbidden - Possible causes:');
      console.error('     1. Sender email not verified');
      console.error('     2. Domain not authenticated');
      console.error('     3. Account suspended or limited');
      console.error('     → Solution: Verify sender email');
      console.error('     → URL: https://app.sendgrid.com/settings/sender_auth\n');
    } else if (error.response?.statusCode === 400) {
      console.error('  ❌ 400 Bad Request - Possible causes:');
      console.error('     1. Invalid email format');
      console.error('     2. Missing required fields');
      console.error('     3. Invalid message content');
      console.error('     → Solution: Check email message format\n');
    } else {
      console.error('  ❌ Unknown error - Check:');
      console.error('     1. Internet connection');
      console.error('     2. SendGrid service status');
      console.error('     3. Firewall/proxy settings');
      console.error('     → URL: https://status.sendgrid.com/\n');
    }
    
    console.error('─────────────────────────────────────────────────────────────────\n');
    
    console.error('📚 Additional Resources:');
    console.error('  - SendGrid Docs: https://docs.sendgrid.com/');
    console.error('  - API Reference: https://docs.sendgrid.com/api-reference/');
    console.error('  - Activity Feed: https://app.sendgrid.com/email_activity');
    console.error('  - Support: https://support.sendgrid.com/\n');
    
    process.exit(1);
  });
