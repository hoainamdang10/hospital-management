/**
 * PayOS Integration Test Script
 * Kiểm tra tích hợp PayOS cho Hospital Management System
 *
 * USAGE:
 * - node test-payos-integration.js basic    (test cơ bản không cần PayOS)
 * - node test-payos-integration.js full     (test đầy đủ với PayOS)
 */

const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

// Configuration
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:3009";
const FILE_SERVICE_URL = "http://localhost:3107";
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:3100";

// Test data
const testPayment = {
  appointmentId: "APT-202501-TEST",
  amount: 500000, // 500,000 VND
  description: "Test thanh toán khám bệnh - PayOS Integration",
  serviceName: "Khám tổng quát",
  patientInfo: {
    doctorName: "BS. Nguyễn Văn Test",
    department: "Khoa Nội tổng hợp",
    appointmentDate: "2025-01-20",
    timeSlot: "09:00 - 10:00",
  },
};

// Test credentials (for demo)
const testUser = {
  email: "patient@hospital.com",
  password: "Patient123",
};

let authToken = "";
let testOrderCode = "";

// Utility functions
function log(message, color = "white") {
  const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, url, data = null, useAuth = true) {
  try {
    const config = {
      method,
      url,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        ...(useAuth && authToken && { Authorization: `Bearer ${authToken}` }),
      },
    };

    if (data) {
      config.data = data;
    }

    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    return {
      success: true,
      status: response.status,
      data: response.data,
      duration,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data?.message || error.message,
      duration: 0,
    };
  }
}

// Test functions
async function authenticateTestUser() {
  log("\n🔐 Authenticating test user...", "yellow");

  const result = await makeRequest(
    "POST",
    `${API_GATEWAY_URL}/api/auth/login`,
    testUser,
    false
  );

  if (result.success && result.data.token) {
    authToken = result.data.token;
    log("✅ Authentication successful", "green");
    return true;
  } else {
    log(`❌ Authentication failed: ${result.error}`, "red");
    return false;
  }
}

async function testPaymentServiceHealth() {
  log("\n🏥 Testing Payment Service Health...", "yellow");

  const result = await makeRequest(
    "GET",
    `${PAYMENT_SERVICE_URL}/health`,
    null,
    false
  );

  if (result.success) {
    log("✅ Payment Service is healthy", "green");
    log(
      `📊 Features: ${JSON.stringify(result.data.features, null, 2)}`,
      "cyan"
    );
    return true;
  } else {
    log(`❌ Payment Service health check failed: ${result.error}`, "red");
    return false;
  }
}

async function testCreatePayOSPayment() {
  log("\n💳 Testing PayOS Payment Creation...", "yellow");

  const result = await makeRequest(
    "POST",
    `${API_GATEWAY_URL}/api/payments/payos/create`,
    testPayment,
    true
  );

  if (result.success && result.data.checkoutUrl) {
    testOrderCode = result.data.orderCode;
    log("✅ PayOS payment created successfully", "green");
    log(`🔗 Checkout URL: ${result.data.checkoutUrl}`, "cyan");
    log(`📋 Order Code: ${testOrderCode}`, "cyan");
    log(`💰 Amount: ${result.data.amount.toLocaleString("vi-VN")} VND`, "cyan");
    return true;
  } else {
    log(`❌ PayOS payment creation failed: ${result.error}`, "red");
    return false;
  }
}

async function testPaymentHistory() {
  log("\n📜 Testing Payment History...", "yellow");

  const result = await makeRequest(
    "GET",
    `${API_GATEWAY_URL}/api/payments/history`,
    null,
    true
  );

  if (result.success) {
    log("✅ Payment history retrieved successfully", "green");
    log(`📊 Total payments: ${result.data.data.length}`, "cyan");

    if (result.data.data.length > 0) {
      const latestPayment = result.data.data[0];
      log(
        `🔍 Latest payment: ${latestPayment.order_code} - ${latestPayment.status}`,
        "cyan"
      );
    }
    return true;
  } else {
    log(`❌ Payment history retrieval failed: ${result.error}`, "red");
    return false;
  }
}

async function testWebhookEndpoint() {
  log("\n🔗 Testing Webhook Endpoint...", "yellow");

  const result = await makeRequest(
    "GET",
    `${PAYMENT_SERVICE_URL}/api/webhooks/payos/test`,
    null,
    false
  );

  if (result.success) {
    log("✅ Webhook endpoint is accessible", "green");
    log(`🌍 Environment: ${result.data.environment.environment}`, "cyan");
    return true;
  } else {
    log(`❌ Webhook endpoint test failed: ${result.error}`, "red");
    return false;
  }
}

async function testPayOSConfiguration() {
  log("\n⚙️ Testing PayOS Configuration...", "yellow");

  // Check environment variables
  const requiredEnvVars = [
    "PAYOS_CLIENT_ID",
    "PAYOS_API_KEY",
    "PAYOS_CHECKSUM_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    log(`❌ Missing environment variables: ${missingVars.join(", ")}`, "red");
    return false;
  }

  log("✅ All PayOS environment variables are configured", "green");
  log(`🌍 Environment: ${process.env.PAYOS_ENVIRONMENT || "sandbox"}`, "cyan");
  return true;
}

// Main test runner
async function runPayOSTests() {
  log("🚀 Starting PayOS Integration Tests", "cyan");
  log("=".repeat(50), "cyan");

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  const tests = [
    { name: "PayOS Configuration", fn: testPayOSConfiguration },
    { name: "Payment Service Health", fn: testPaymentServiceHealth },
    { name: "User Authentication", fn: authenticateTestUser },
    { name: "PayOS Payment Creation", fn: testCreatePayOSPayment },
    { name: "Payment History", fn: testPaymentHistory },
    { name: "Webhook Endpoint", fn: testWebhookEndpoint },
  ];

  for (const test of tests) {
    testResults.total++;
    try {
      const success = await test.fn();
      if (success) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }
    } catch (error) {
      log(`❌ Test "${test.name}" threw an error: ${error.message}`, "red");
      testResults.failed++;
    }
  }

  // Summary
  log("\n📊 TEST SUMMARY", "cyan");
  log("=".repeat(50), "cyan");
  log(`Total Tests: ${testResults.total}`, "white");
  log(`Passed: ${testResults.passed}`, "green");
  log(`Failed: ${testResults.failed}`, "red");
  log(
    `Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`,
    "yellow"
  );

  if (testOrderCode) {
    log("\n🔗 NEXT STEPS", "cyan");
    log("=".repeat(50), "cyan");
    log("1. Open the checkout URL above to test payment flow", "white");
    log("2. Use PayOS test cards for sandbox testing:", "white");
    log("   - Visa: 4111111111111111", "cyan");
    log("   - Mastercard: 5555555555554444", "cyan");
    log("3. Check webhook logs for payment status updates", "white");
    log("4. Verify payment status in database", "white");
  }

  log("\n✨ PayOS Integration Test Complete!", "green");
}

async function testFileServiceHealth() {
  log("\n📁 Testing File Service Health...", "yellow");

  const result = await makeRequest(
    "GET",
    `${FILE_SERVICE_URL}/health`,
    null,
    false
  );

  if (result.success) {
    log("✅ File Service is healthy", "green");
    log(`📊 Service: ${result.data.service || "File Service"}`, "cyan");
    if (result.data.configuration) {
      log(
        `📋 Max file size: ${(result.data.configuration.maxFileSize / 1024 / 1024).toFixed(1)}MB`,
        "cyan"
      );
      log(
        `📋 Document types: ${result.data.configuration.documentTypes}`,
        "cyan"
      );
    }
    return true;
  } else {
    log(`❌ File Service health check failed: ${result.error}`, "red");
    return false;
  }
}

// Basic tests without PayOS credentials
async function runBasicTests() {
  log("🚀 Starting Basic HMS Services Tests", "cyan");
  log("=".repeat(50), "cyan");

  const testResults = { total: 0, passed: 0, failed: 0 };

  const tests = [
    { name: "File Service Health", fn: testFileServiceHealth },
    { name: "Payment Service Health", fn: testPaymentServiceHealth },
    { name: "Webhook Endpoint", fn: testWebhookEndpoint },
  ];

  for (const test of tests) {
    testResults.total++;
    try {
      const success = await test.fn();
      if (success) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }
    } catch (error) {
      log(`❌ Test "${test.name}" error: ${error.message}`, "red");
      testResults.failed++;
    }
  }

  // Summary
  log("\n📊 BASIC TEST SUMMARY", "cyan");
  log("=".repeat(50), "cyan");
  log(`Total Tests: ${testResults.total}`, "white");
  log(`Passed: ${testResults.passed}`, "green");
  log(`Failed: ${testResults.failed}`, "red");
  log(
    `Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`,
    "yellow"
  );

  if (testResults.passed === testResults.total) {
    log("\n🎉 Payment service sẵn sàng!", "green");
    log("📝 Bước tiếp theo: Đăng ký PayOS và chạy full test", "cyan");
  }
}

// Run tests
if (require.main === module) {
  const testType = process.argv[2] || "basic";

  if (testType === "basic") {
    runBasicTests().catch(console.error);
  } else {
    runPayOSTests().catch(console.error);
  }
}

module.exports = {
  runPayOSTests,
  runBasicTests,
  testCreatePayOSPayment,
  testPaymentHistory,
};
