/**
 * Test Create Payment Link for New Invoice
 */

const axios = require('axios');

const INVOICE_ID = 'INV-202511-TEST1594';
const APPOINTMENT_ID = '2025-APT-023529-071';

async function createPaymentLink() {
  try {
    console.log('\n========================================');
    console.log('🔗 CREATING PAYMENT LINK');
    console.log('========================================');
    console.log('Invoice ID:', INVOICE_ID);
    console.log('Appointment ID:', APPOINTMENT_ID);
    console.log('========================================\n');

    const response = await axios.post(
      `http://localhost:3009/api/v1/billing/invoices/${INVOICE_ID}/payment-link`,
      {
        appointmentId: APPOINTMENT_ID,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Response Status:', response.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.paymentUrl) {
      console.log('\n🔗 Payment URL:', response.data.paymentUrl);
      
      // Extract order code from URL
      const urlParams = new URL(response.data.paymentUrl).searchParams;
      const orderCode = urlParams.get('vnp_TxnRef');
      
      console.log('📋 Order Code:', orderCode);
      console.log('\n========================================');
      console.log('✅ PAYMENT LINK CREATED!');
      console.log('========================================\n');
      
      console.log('💡 Next: Run webhook test with this order code');
      console.log(`   Update test-vnpay-webhook-new-invoice.js:`);
      console.log(`   const ORDER_CODE = ${orderCode};`);
    }

  } catch (error) {
    console.error('\n❌ Error creating payment link:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    console.log('\n========================================');
    console.log('❌ FAILED');
    console.log('========================================\n');
  }
}

// Run
createPaymentLink();

