const axios = require('axios');
const WebSocket = require('ws');
const { createClient } = require('graphql-ws');

// Test configuration
const GRAPHQL_URL = process.env.GRAPHQL_URL || 'http://localhost:3200/graphql';
const GRAPHQL_WS_URL = process.env.GRAPHQL_WS_URL || 'ws://localhost:3200/graphql';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 10;
const TEST_DURATION = parseInt(process.env.TEST_DURATION) || 60; // seconds
const RAMP_UP_TIME = parseInt(process.env.RAMP_UP_TIME) || 10; // seconds

// Test queries
const QUERIES = {
  GET_DOCTOR_DASHBOARD: `
    query GetDoctorDashboard($doctorId: String!) {
      doctorDashboard(doctorId: $doctorId) {
        doctor {
          id
          doctorId
          fullName
          specialization
          department {
            id
            name
          }
        }
        todayAppointments {
          id
          appointmentId
          scheduledTime
          status
          patient {
            id
            fullName
            phoneNumber
          }
        }
        appointmentStats {
          total
          today
          thisWeek
          completed
          cancelled
        }
      }
    }
  `,

  GET_DOCTORS_LIST: `
    query GetDoctors($limit: Int, $offset: Int) {
      doctors(limit: $limit, offset: $offset) {
        edges {
          node {
            id
            doctorId
            fullName
            specialization
            department {
              id
              name
            }
            isAvailable
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          totalCount
        }
      }
    }
  `,

  GET_APPOINTMENTS: `
    query GetAppointments($doctorId: String, $limit: Int) {
      appointments(doctorId: $doctorId, limit: $limit) {
        edges {
          node {
            id
            appointmentId
            scheduledDate
            scheduledTime
            status
            doctor {
              id
              fullName
            }
            patient {
              id
              fullName
            }
          }
        }
      }
    }
  `
};

const SUBSCRIPTIONS = {
  DOCTOR_APPOINTMENT_UPDATED: `
    subscription DoctorAppointmentUpdated($doctorId: String!) {
      doctorAppointmentUpdated(doctorId: $doctorId) {
        id
        appointmentId
        status
        patient {
          id
          fullName
        }
      }
    }
  `
};

// Test data
const TEST_DOCTOR_IDS = [
  'CARD-DOC-202412-001',
  'CARD-DOC-202412-002',
  'NEUR-DOC-202412-001',
  'ORTH-DOC-202412-001',
  'PEDI-DOC-202412-001'
];

// Performance metrics
let metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  errors: [],
  subscriptionConnections: 0,
  subscriptionMessages: 0,
  startTime: null,
  endTime: null
};

/**
 * Execute GraphQL query
 */
async function executeQuery(query, variables = {}) {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(GRAPHQL_URL, {
      query,
      variables
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Replace with actual token
      },
      timeout: 10000 // 10 second timeout
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    metrics.totalRequests++;
    metrics.totalResponseTime += responseTime;
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);

    if (response.data.errors) {
      metrics.failedRequests++;
      metrics.errors.push({
        query: query.substring(0, 50) + '...',
        variables,
        errors: response.data.errors,
        responseTime
      });
    } else {
      metrics.successfulRequests++;
    }

    return {
      success: !response.data.errors,
      data: response.data,
      responseTime
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.totalResponseTime += responseTime;
    
    metrics.errors.push({
      query: query.substring(0, 50) + '...',
      variables,
      error: error.message,
      responseTime
    });

    return {
      success: false,
      error: error.message,
      responseTime
    };
  }
}

/**
 * Create subscription connection
 */
function createSubscriptionConnection(doctorId) {
  return new Promise((resolve, reject) => {
    const client = createClient({
      url: GRAPHQL_WS_URL,
      webSocketImpl: WebSocket,
      connectionParams: {
        authorization: 'Bearer test-token',
      },
    });

    let messageCount = 0;
    const connectionStartTime = Date.now();

    const unsubscribe = client.subscribe(
      {
        query: SUBSCRIPTIONS.DOCTOR_APPOINTMENT_UPDATED,
        variables: { doctorId },
      },
      {
        next: (data) => {
          messageCount++;
          metrics.subscriptionMessages++;
          console.log(`📨 Subscription message received for ${doctorId}: ${messageCount}`);
        },
        error: (error) => {
          console.error(`❌ Subscription error for ${doctorId}:`, error);
          metrics.errors.push({
            type: 'subscription',
            doctorId,
            error: error.message
          });
          client.dispose();
          reject(error);
        },
        complete: () => {
          console.log(`🏁 Subscription completed for ${doctorId}`);
          client.dispose();
          resolve({ messageCount, duration: Date.now() - connectionStartTime });
        },
      }
    );

    metrics.subscriptionConnections++;

    // Keep connection alive for test duration
    setTimeout(() => {
      unsubscribe();
      client.dispose();
      resolve({ messageCount, duration: Date.now() - connectionStartTime });
    }, TEST_DURATION * 1000);
  });
}

/**
 * Simulate user load
 */
async function simulateUser(userId) {
  console.log(`👤 Starting user ${userId}`);
  
  const doctorId = TEST_DOCTOR_IDS[userId % TEST_DOCTOR_IDS.length];
  const userStartTime = Date.now();
  
  // Create subscription connection
  const subscriptionPromise = createSubscriptionConnection(doctorId);
  
  // Execute queries periodically
  const queryInterval = setInterval(async () => {
    // Random query selection
    const queryType = Math.random();
    
    if (queryType < 0.4) {
      // 40% - Doctor dashboard query
      await executeQuery(QUERIES.GET_DOCTOR_DASHBOARD, { doctorId });
    } else if (queryType < 0.7) {
      // 30% - Doctors list query
      await executeQuery(QUERIES.GET_DOCTORS_LIST, { 
        limit: 20, 
        offset: Math.floor(Math.random() * 100) 
      });
    } else {
      // 30% - Appointments query
      await executeQuery(QUERIES.GET_APPOINTMENTS, { 
        doctorId, 
        limit: 50 
      });
    }
    
    // Random delay between requests (1-5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 4000));
  }, 2000);

  // Stop after test duration
  setTimeout(() => {
    clearInterval(queryInterval);
    console.log(`👤 User ${userId} completed after ${Date.now() - userStartTime}ms`);
  }, TEST_DURATION * 1000);

  return subscriptionPromise;
}

/**
 * Run performance test
 */
async function runPerformanceTest() {
  console.log('🚀 Starting GraphQL Performance Test');
  console.log(`📊 Configuration:`);
  console.log(`   - Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`   - Test Duration: ${TEST_DURATION} seconds`);
  console.log(`   - Ramp-up Time: ${RAMP_UP_TIME} seconds`);
  console.log(`   - GraphQL URL: ${GRAPHQL_URL}`);
  console.log(`   - WebSocket URL: ${GRAPHQL_WS_URL}`);

  metrics.startTime = Date.now();

  // Start users with ramp-up
  const userPromises = [];
  const rampUpDelay = (RAMP_UP_TIME * 1000) / CONCURRENT_USERS;

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    setTimeout(() => {
      userPromises.push(simulateUser(i));
    }, i * rampUpDelay);
  }

  // Wait for test completion
  console.log(`⏳ Running test for ${TEST_DURATION} seconds...`);
  
  // Print progress every 10 seconds
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - metrics.startTime) / 1000;
    const avgResponseTime = metrics.totalRequests > 0 ? 
      (metrics.totalResponseTime / metrics.totalRequests).toFixed(2) : 0;
    
    console.log(`📈 Progress: ${elapsed.toFixed(0)}s | Requests: ${metrics.totalRequests} | Avg Response: ${avgResponseTime}ms | Success Rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`);
  }, 10000);

  // Wait for all users to complete
  setTimeout(async () => {
    clearInterval(progressInterval);
    metrics.endTime = Date.now();
    
    console.log('⏳ Waiting for all connections to close...');
    await Promise.allSettled(userPromises);
    
    // Generate report
    generateReport();
  }, (TEST_DURATION + 5) * 1000); // Extra 5 seconds for cleanup
}

/**
 * Generate performance report
 */
function generateReport() {
  const totalDuration = (metrics.endTime - metrics.startTime) / 1000;
  const avgResponseTime = metrics.totalRequests > 0 ? 
    metrics.totalResponseTime / metrics.totalRequests : 0;
  const requestsPerSecond = metrics.totalRequests / totalDuration;
  const successRate = metrics.totalRequests > 0 ? 
    (metrics.successfulRequests / metrics.totalRequests) * 100 : 0;

  console.log('\n📊 Performance Test Results');
  console.log('=' .repeat(50));
  console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)} seconds`);
  console.log(`📈 Total Requests: ${metrics.totalRequests}`);
  console.log(`✅ Successful Requests: ${metrics.successfulRequests}`);
  console.log(`❌ Failed Requests: ${metrics.failedRequests}`);
  console.log(`📊 Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`⚡ Requests/Second: ${requestsPerSecond.toFixed(2)}`);
  console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`⚡ Min Response Time: ${metrics.minResponseTime === Infinity ? 0 : metrics.minResponseTime}ms`);
  console.log(`🐌 Max Response Time: ${metrics.maxResponseTime}ms`);
  console.log(`🔗 Subscription Connections: ${metrics.subscriptionConnections}`);
  console.log(`📨 Subscription Messages: ${metrics.subscriptionMessages}`);

  if (metrics.errors.length > 0) {
    console.log(`\n❌ Errors (showing first 10):`);
    metrics.errors.slice(0, 10).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.error || error.errors?.[0]?.message || 'Unknown error'}`);
    });
  }

  // Performance assessment
  console.log('\n🎯 Performance Assessment:');
  if (successRate >= 99) {
    console.log('✅ Excellent: Success rate >= 99%');
  } else if (successRate >= 95) {
    console.log('🟡 Good: Success rate >= 95%');
  } else {
    console.log('🔴 Poor: Success rate < 95%');
  }

  if (avgResponseTime <= 100) {
    console.log('✅ Excellent: Average response time <= 100ms');
  } else if (avgResponseTime <= 500) {
    console.log('🟡 Good: Average response time <= 500ms');
  } else {
    console.log('🔴 Poor: Average response time > 500ms');
  }

  if (requestsPerSecond >= 100) {
    console.log('✅ Excellent: Throughput >= 100 req/s');
  } else if (requestsPerSecond >= 50) {
    console.log('🟡 Good: Throughput >= 50 req/s');
  } else {
    console.log('🔴 Poor: Throughput < 50 req/s');
  }

  console.log('\n🏁 Performance test completed!');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Performance test interrupted');
  if (metrics.startTime && !metrics.endTime) {
    metrics.endTime = Date.now();
    generateReport();
  }
  process.exit(0);
});

// Start the test
runPerformanceTest().catch(error => {
  console.error('❌ Performance test failed:', error);
  process.exit(1);
});
