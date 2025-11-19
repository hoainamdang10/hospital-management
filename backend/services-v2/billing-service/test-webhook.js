/**
 * Test VNPAY Webhook Script
 * Simulates VNPAY IPN callback with valid signature
 * 
 * Usage: node test-webhook.js
 */

const crypto = require('crypto');
const axios = require('axios');

// VNPAY Configuration (must match billing-service .env)
const VNPAY_HASH_SECRET = 'PS1017YBR2B1ALS3BRVY2JZ6XOVSL5YV'; // From VNPAY_HASH_SECRET in .env
const BILLING_SERVICE_URL = 'http://localhost:3009';

// Test data - replace with actual invoice data
const testData = {
  vnp_TmnCode: 'JV4I3QQ0',
  vnp_Amount: '22000000', // 220,000 VND * 100
  vnp_BankCode: 'NCB',
  vnp_BankTranNo: '20251119123456',
  vnp_CardType: 'ATM',
  vnp_OrderInfo: 'Thanh toan hoa don INV-202511-2854',
  vnp_PayDate: '20251119120833',
  vnp_ResponseCode: '00', // Success
  vnp_TmnCode: 'JV4I3QQ0',
  vnp_TransactionNo: '14123456',
  vnp_TransactionStatus: '00',
  vnp_TxnRef: '1763554082', // orderCode
};

/**
 * Generate VNPAY secure hash (HMAC SHA512)
 * Must match backend implementation exactly
 */
function generateSecureHash(params) {
  // Sort params alphabetically
  const sortedKeys = Object.keys(params).sort();

  // Build query string with VNPAY encoding (space as +, not %20)
  const queryString = sortedKeys
    .map(key => {
      const encodedValue = encodeURIComponent(params[key]).replace(/%20/g, '+');
      return `${key}=${encodedValue}`;
    })
    .join('&');

  // Generate HMAC SHA512 and convert to UPPERCASE
  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
  hmac.update(queryString);
  return hmac.digest('hex').toUpperCase();
}

/**
 * Send webhook to billing service
 */
async function sendWebhook() {
  try {
    console.log('🚀 Sending VNPAY webhook...\n');
    
    // Generate signature
    const secureHash = generateSecureHash(testData);
    console.log('📝 Test Data:', JSON.stringify(testData, null, 2));
    console.log('\n🔐 Generated Signature:', secureHash);
    
    // Add signature to params
    const webhookParams = {
      ...testData,
      vnp_SecureHash: secureHash
    };
    
    // Build query string
    const queryString = Object.keys(webhookParams)
      .map(key => `${key}=${encodeURIComponent(webhookParams[key])}`)
      .join('&');
    
    const webhookUrl = `${BILLING_SERVICE_URL}/api/v1/billing/invoices/payos/webhook?${queryString}`;
    
    console.log('\n📡 Webhook URL:', webhookUrl);
    console.log('\n⏳ Sending GET request...\n');
    
    // Send GET request (VNPAY uses GET for IPN)
    const response = await axios.get(webhookUrl, {
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('\n✅ Webhook processed successfully!');
      console.log('🔍 Check database for:');
      console.log('   - Invoice status should be "paid"');
      console.log('   - Payment record should exist');
      console.log('   - Appointment status should be "CONFIRMED"');
    } else {
      console.log('\n❌ Webhook failed!');
      console.log('Error:', response.data);
    }
    
  } catch (error) {
    console.error('\n❌ Error sending webhook:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run test
console.log('='.repeat(60));
console.log('VNPAY WEBHOOK TEST SCRIPT');
console.log('='.repeat(60));
console.log('\n⚠️  Make sure:');
console.log('   1. Billing service is running on port 3009');
console.log('   2. VNPAY_HASH_SECRET matches .env file');
console.log('   3. Invoice INV-202511-2854 exists in database');
console.log('   4. Appointment 2025-APT-111954-170 exists\n');
console.log('='.repeat(60));
console.log('\n');

sendWebhook();

