import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.SENDGRID_API_KEY || '';
const fromEmail = process.env.EMAIL_FROM || 'ngocthien20122003@gmail.com';
const fromName = process.env.EMAIL_FROM_NAME || 'Hospital Management System';

console.log('=== SendGrid Debug Test ===\n');
console.log('API Key:', apiKey.substring(0, 30) + '...');
console.log('From Email:', fromEmail);
console.log('From Name:', fromName);
console.log('To Email: patient.hms.test@gmail.com\n');

sgMail.setApiKey(apiKey);

const msg = {
  to: 'patient.hms.test@gmail.com',
  from: {
    email: fromEmail,
    name: fromName
  },
  subject: 'Debug Test - Hospital Management System',
  html: '<h1>Debug Test Email</h1><p>This is a debug test email from SendGrid.</p>'
};

console.log('Sending email...\n');

sgMail
  .send(msg)
  .then((result) => {
    console.log('✅ SUCCESS!');
    console.log('Status Code:', result[0].statusCode);
    console.log('Message ID:', result[0].headers['x-message-id']);
    console.log('Response Body:', JSON.stringify(result[0].body, null, 2));
    console.log('Response Headers:', JSON.stringify(result[0].headers, null, 2));
  })
  .catch((error: any) => {
    console.error('❌ FAILED!');
    console.error('\n=== Error Details ===');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('\n=== Response Details ===');
      console.error('Status Code:', error.response.statusCode);
      console.error('Status Message:', error.response.statusMessage);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      
      if (error.response.body) {
        console.error('\n=== Response Body ===');
        console.error(JSON.stringify(error.response.body, null, 2));
        
        if (error.response.body.errors) {
          console.error('\n=== SendGrid Errors ===');
          error.response.body.errors.forEach((err: any, index: number) => {
            console.error(`Error ${index + 1}:`);
            console.error('  Message:', err.message);
            console.error('  Field:', err.field);
            console.error('  Help:', err.help);
          });
        }
      }
    }
    
    console.error('\n=== Full Error Object ===');
    console.error(JSON.stringify(error, null, 2));
  });

