const WebSocket = require('ws');
const { createClient } = require('graphql-ws');

// GraphQL subscription queries
const DOCTOR_APPOINTMENT_UPDATED = `
  subscription DoctorAppointmentUpdated($doctorId: String!) {
    doctorAppointmentUpdated(doctorId: $doctorId) {
      id
      appointmentId
      scheduledDate
      scheduledTime
      status
      patient {
        id
        patientId
        fullName
        phoneNumber
      }
    }
  }
`;

const APPOINTMENT_STATUS_CHANGED = `
  subscription AppointmentStatusChanged($appointmentId: String) {
    appointmentStatusChanged(appointmentId: $appointmentId) {
      id
      appointmentId
      status
      updatedAt
    }
  }
`;

const DOCTOR_STATUS_CHANGED = `
  subscription DoctorStatusChanged($doctorId: String) {
    doctorStatusChanged(doctorId: $doctorId) {
      id
      doctorId
      fullName
      status
      isAvailable
      currentStatus
    }
  }
`;

// Test configuration
const GRAPHQL_WS_URL = process.env.GRAPHQL_WS_URL || 'ws://localhost:3200/graphql';
const TEST_DOCTOR_ID = 'CARD-DOC-202412-001';
const TEST_APPOINTMENT_ID = 'APT-202412-001';

console.log('🧪 Starting GraphQL Subscription Tests...');
console.log(`📡 Connecting to: ${GRAPHQL_WS_URL}`);

// Test 1: Doctor Appointment Updates
function testDoctorAppointmentUpdates() {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Test 1: Doctor Appointment Updates');
    
    const client = createClient({
      url: GRAPHQL_WS_URL,
      webSocketImpl: WebSocket,
      connectionParams: {
        authorization: 'Bearer test-token', // Replace with actual token
      },
    });

    let messageCount = 0;
    const maxMessages = 3;
    const timeout = 30000; // 30 seconds

    const unsubscribe = client.subscribe(
      {
        query: DOCTOR_APPOINTMENT_UPDATED,
        variables: { doctorId: TEST_DOCTOR_ID },
      },
      {
        next: (data) => {
          messageCount++;
          console.log(`✅ Received appointment update ${messageCount}:`, JSON.stringify(data, null, 2));
          
          if (messageCount >= maxMessages) {
            unsubscribe();
            client.dispose();
            resolve(`Test 1 completed: Received ${messageCount} messages`);
          }
        },
        error: (error) => {
          console.error('❌ Subscription error:', error);
          client.dispose();
          reject(error);
        },
        complete: () => {
          console.log('🏁 Subscription completed');
          client.dispose();
          resolve(`Test 1 completed: Received ${messageCount} messages`);
        },
      }
    );

    // Set timeout
    setTimeout(() => {
      unsubscribe();
      client.dispose();
      resolve(`Test 1 timeout: Received ${messageCount} messages in ${timeout}ms`);
    }, timeout);
  });
}

// Test 2: Appointment Status Changes
function testAppointmentStatusChanges() {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Test 2: Appointment Status Changes');
    
    const client = createClient({
      url: GRAPHQL_WS_URL,
      webSocketImpl: WebSocket,
      connectionParams: {
        authorization: 'Bearer test-token',
      },
    });

    let messageCount = 0;
    const maxMessages = 2;
    const timeout = 20000; // 20 seconds

    const unsubscribe = client.subscribe(
      {
        query: APPOINTMENT_STATUS_CHANGED,
        variables: { appointmentId: TEST_APPOINTMENT_ID },
      },
      {
        next: (data) => {
          messageCount++;
          console.log(`✅ Received status change ${messageCount}:`, JSON.stringify(data, null, 2));
          
          if (messageCount >= maxMessages) {
            unsubscribe();
            client.dispose();
            resolve(`Test 2 completed: Received ${messageCount} messages`);
          }
        },
        error: (error) => {
          console.error('❌ Subscription error:', error);
          client.dispose();
          reject(error);
        },
        complete: () => {
          console.log('🏁 Subscription completed');
          client.dispose();
          resolve(`Test 2 completed: Received ${messageCount} messages`);
        },
      }
    );

    // Set timeout
    setTimeout(() => {
      unsubscribe();
      client.dispose();
      resolve(`Test 2 timeout: Received ${messageCount} messages in ${timeout}ms`);
    }, timeout);
  });
}

// Test 3: Doctor Status Changes
function testDoctorStatusChanges() {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Test 3: Doctor Status Changes');
    
    const client = createClient({
      url: GRAPHQL_WS_URL,
      webSocketImpl: WebSocket,
      connectionParams: {
        authorization: 'Bearer test-token',
      },
    });

    let messageCount = 0;
    const maxMessages = 2;
    const timeout = 20000; // 20 seconds

    const unsubscribe = client.subscribe(
      {
        query: DOCTOR_STATUS_CHANGED,
        variables: { doctorId: TEST_DOCTOR_ID },
      },
      {
        next: (data) => {
          messageCount++;
          console.log(`✅ Received doctor status change ${messageCount}:`, JSON.stringify(data, null, 2));
          
          if (messageCount >= maxMessages) {
            unsubscribe();
            client.dispose();
            resolve(`Test 3 completed: Received ${messageCount} messages`);
          }
        },
        error: (error) => {
          console.error('❌ Subscription error:', error);
          client.dispose();
          reject(error);
        },
        complete: () => {
          console.log('🏁 Subscription completed');
          client.dispose();
          resolve(`Test 3 completed: Received ${messageCount} messages`);
        },
      }
    );

    // Set timeout
    setTimeout(() => {
      unsubscribe();
      client.dispose();
      resolve(`Test 3 timeout: Received ${messageCount} messages in ${timeout}ms`);
    }, timeout);
  });
}

// Test 4: Multiple Concurrent Subscriptions
function testConcurrentSubscriptions() {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Test 4: Multiple Concurrent Subscriptions');
    
    const clients = [];
    const results = [];
    const numClients = 5;
    const timeout = 15000; // 15 seconds

    for (let i = 0; i < numClients; i++) {
      const client = createClient({
        url: GRAPHQL_WS_URL,
        webSocketImpl: WebSocket,
        connectionParams: {
          authorization: 'Bearer test-token',
        },
      });

      clients.push(client);

      let messageCount = 0;
      const unsubscribe = client.subscribe(
        {
          query: DOCTOR_APPOINTMENT_UPDATED,
          variables: { doctorId: TEST_DOCTOR_ID },
        },
        {
          next: (data) => {
            messageCount++;
            console.log(`✅ Client ${i + 1} received message ${messageCount}`);
          },
          error: (error) => {
            console.error(`❌ Client ${i + 1} error:`, error);
            results.push({ client: i + 1, status: 'error', messages: messageCount });
          },
          complete: () => {
            console.log(`🏁 Client ${i + 1} completed`);
            results.push({ client: i + 1, status: 'completed', messages: messageCount });
          },
        }
      );

      // Store unsubscribe function
      client.unsubscribe = unsubscribe;
    }

    // Cleanup after timeout
    setTimeout(() => {
      clients.forEach((client, index) => {
        if (client.unsubscribe) {
          client.unsubscribe();
        }
        client.dispose();
      });

      console.log('\n📊 Concurrent Test Results:');
      results.forEach(result => {
        console.log(`   Client ${result.client}: ${result.status} - ${result.messages} messages`);
      });

      resolve(`Test 4 completed: ${numClients} concurrent clients tested`);
    }, timeout);
  });
}

// Performance metrics
function measurePerformance() {
  console.log('\n📊 Performance Metrics:');
  console.log(`   Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  console.log(`   Uptime: ${Math.round(process.uptime())} seconds`);
}

// Run all tests
async function runAllTests() {
  try {
    console.log('🚀 Starting comprehensive subscription tests...\n');
    
    const startTime = Date.now();
    
    // Run tests sequentially
    const test1Result = await testDoctorAppointmentUpdates();
    console.log(`📝 ${test1Result}`);
    
    const test2Result = await testAppointmentStatusChanges();
    console.log(`📝 ${test2Result}`);
    
    const test3Result = await testDoctorStatusChanges();
    console.log(`📝 ${test3Result}`);
    
    const test4Result = await testConcurrentSubscriptions();
    console.log(`📝 ${test4Result}`);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log('\n🎉 All tests completed!');
    console.log(`⏱️  Total execution time: ${totalTime}ms`);
    
    measurePerformance();
    
    console.log('\n💡 To trigger events for testing, use the webhook endpoints:');
    console.log('   POST http://localhost:3200/subscriptions/webhook/appointment/updated');
    console.log('   POST http://localhost:3200/subscriptions/webhook/appointment/status-changed');
    console.log('   POST http://localhost:3200/subscriptions/webhook/doctor/status-changed');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Test suite interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Test suite terminated');
  process.exit(0);
});

// Start tests
runAllTests();
