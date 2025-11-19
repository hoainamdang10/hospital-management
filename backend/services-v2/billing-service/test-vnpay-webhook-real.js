/**
 * Test VNPAY Webhook with Real Parameters
 * This simulates actual VNPAY IPN (Instant Payment Notification)
 */

const crypto = require('crypto');
const axios = require('axios');

// VNPAY Configuration (from .env)
const VNPAY_TMN_CODE = 'JV4I3QQ0';
const VNPAY_HASH_SECRET = 'PS1017YBR2B1ALS3BRVY2JZ6XOVSL5YV';

// Invoice data from database
const INVOICE_ID = 'INV-202511-4013';
const TOTAL_AMOUNT = 220000; // VND
const ORDER_CODE = Date.now(); // Unique order code

// VNPAY IPN Parameters (based on VNPAY documentation)
// Ref: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
const vnpayParams = {
  vnp_TmnCode: VNPAY_TMN_CODE,
  vnp_Amount: (TOTAL_AMOUNT * 100).toString(), // Amount in smallest unit (VND * 100)
  vnp_BankCode: 'NCB', // Bank code
  vnp_BankTranNo: 'VNP' + Date.now(), // Bank transaction number
  vnp_CardType: 'ATM', // Card type
  vnp_OrderInfo: `Thanh toan hoa don ${INVOICE_ID}`, // Order description
  vnp_PayDate: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14), // YYYYMMDDHHmmss
  vnp_ResponseCode: '00', // Success code
  vnp_TxnRef: ORDER_CODE.toString(), // Transaction reference (orderCode)
  vnp_TransactionNo: '14' + Date.now(), // VNPAY transaction number
  vnp_TransactionStatus: '00', // Transaction status (00 = success)
  vnp_SecureHashType: 'SHA256', // Hash type (VNPAY uses SHA256 or HMACSHA512)
};

/**
 * Generate VNPAY secure hash
 * Algorithm: HMAC-SHA512
 */
function generateVnpaySecureHash(params) {
  // Remove vnp_SecureHash and vnp_SecureHashType from params
  const signParams = { ...params };
  delete signParams.vnp_SecureHash;
  delete signParams.vnp_SecureHashType;

  // Sort parameters by key
  const sortedKeys = Object.keys(signParams).sort();

  // Build query string with URL encoding
  const queryString = sortedKeys
    .map(key => {
      const value = signParams[key];
      // VNPAY uses encodeURIComponent and replaces %20 with +
      const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
      return `${key}=${encodedValue}`;
    })
    .join('&');

  console.log('\n📝 Query String for Signature:');
  console.log(queryString);

  // Generate HMAC-SHA512 hash
  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
  hmac.update(queryString);
  const secureHash = hmac.digest('hex').toUpperCase();

  console.log('\n🔐 Generated Signature:');
  console.log(secureHash);

  return secureHash;
}

/**
 * Send webhook to test endpoint
 */
async function sendWebhook() {
  try {
    console.log('\n========================================');
    console.log('🧪 TESTING VNPAY WEBHOOK');
    console.log('========================================');
    console.log('Invoice ID:', INVOICE_ID);
    console.log('Amount:', TOTAL_AMOUNT, 'VND');
    console.log('Order Code:', ORDER_CODE);
    console.log('========================================\n');

    // Generate secure hash
    const secureHash = generateVnpaySecureHash(vnpayParams);
    vnpayParams.vnp_SecureHash = secureHash;

    // Build webhook URL with query parameters
    const baseUrl = 'http://localhost:3009/api/v1/billing/invoices/payos/webhook-test';
    const queryString = Object.keys(vnpayParams)
      .map(key => `${key}=${encodeURIComponent(vnpayParams[key])}`)
      .join('&');
    const webhookUrl = `${baseUrl}?${queryString}`;

    console.log('📡 Sending GET request to test endpoint...\n');

    // Send GET request (VNPAY uses GET for IPN)
    const response = await axios.get(webhookUrl, {
      headers: {
        'User-Agent': 'VNPAY-IPN/1.0',
      },
    });

    console.log('\n✅ Response Status:', response.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n========================================');
    console.log('✅ TEST COMPLETED');
    console.log('========================================');
    console.log('\n💡 Next Steps:');
    console.log('1. Check billing service logs: docker logs hospital-billing-v2 --tail 100');
    console.log('2. Look for "VNPAY WEBHOOK RAW DATA" section');
    console.log('3. Compare actual VNPAY parameters with our test');
    console.log('4. Verify signature calculation matches');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error sending webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run test
sendWebhook();

