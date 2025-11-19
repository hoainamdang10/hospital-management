/**
 * Test VNPAY Webhook with New Invoice
 */

const crypto = require('crypto');
const axios = require('axios');

// VNPAY Configuration
const VNPAY_TMN_CODE = 'JV4I3QQ0';
const VNPAY_HASH_SECRET = 'PS1017YBR2B1ALS3BRVY2JZ6XOVSL5YV';

// New invoice data
const INVOICE_ID = 'INV-202511-9268';
const APPOINTMENT_ID = '2025-APT-023529-071';
const TOTAL_AMOUNT = 200000; // VND
const ORDER_CODE = 999888777; // Fixed order code matching database

// VNPAY IPN Parameters
const vnpayParams = {
  vnp_TmnCode: VNPAY_TMN_CODE,
  vnp_Amount: (TOTAL_AMOUNT * 100).toString(),
  vnp_BankCode: 'NCB',
  vnp_BankTranNo: 'VNP' + Date.now(),
  vnp_CardType: 'ATM',
  vnp_OrderInfo: `Thanh toan hoa don ${INVOICE_ID}`,
  vnp_PayDate: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
  vnp_ResponseCode: '00', // Success
  vnp_TxnRef: ORDER_CODE.toString(),
  vnp_TransactionNo: '14' + Date.now(),
  vnp_TransactionStatus: '00', // Success
  vnp_SecureHashType: 'SHA256',
};

function generateVnpaySecureHash(params) {
  const signParams = { ...params };
  delete signParams.vnp_SecureHash;
  delete signParams.vnp_SecureHashType;

  const sortedKeys = Object.keys(signParams).sort();
  const queryString = sortedKeys
    .map(key => {
      const value = signParams[key];
      const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
      return `${key}=${encodedValue}`;
    })
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
  hmac.update(queryString);
  return hmac.digest('hex').toUpperCase();
}

async function sendWebhook() {
  try {
    console.log('\n========================================');
    console.log('🚀 TESTING VNPAY WEBHOOK - NEW INVOICE');
    console.log('========================================');
    console.log('Invoice ID:', INVOICE_ID);
    console.log('Appointment ID:', APPOINTMENT_ID);
    console.log('Amount:', TOTAL_AMOUNT, 'VND');
    console.log('Order Code:', ORDER_CODE);
    console.log('========================================\n');

    // Generate secure hash
    const secureHash = generateVnpaySecureHash(vnpayParams);
    vnpayParams.vnp_SecureHash = secureHash;

    console.log('🔐 Generated Signature:', secureHash, '\n');

    // Build webhook URL
    const baseUrl = 'http://localhost:3009/api/v1/billing/invoices/payos/webhook';
    const queryString = Object.keys(vnpayParams)
      .map(key => `${key}=${encodeURIComponent(vnpayParams[key])}`)
      .join('&');
    const webhookUrl = `${baseUrl}?${queryString}`;

    console.log('📡 Sending GET request to webhook endpoint...\n');

    // Send GET request
    const response = await axios.get(webhookUrl, {
      headers: {
        'User-Agent': 'VNPAY-IPN/1.0',
      },
    });

    console.log('\n✅ Response Status:', response.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n========================================');
    console.log('✅ WEBHOOK PROCESSED SUCCESSFULLY!');
    console.log('========================================\n');

    console.log('💡 Next: Check appointment status in database');
    console.log(`   SELECT appointment_id, status, payment_status, confirmed_by`);
    console.log(`   FROM appointments_schema.appointments`);
    console.log(`   WHERE appointment_id = '${APPOINTMENT_ID}';`);

  } catch (error) {
    console.error('\n❌ Error sending webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    console.log('\n========================================');
    console.log('❌ WEBHOOK FAILED');
    console.log('========================================\n');
  }
}

// Run test
sendWebhook();

