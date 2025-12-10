/**
 * Event Bus Verification Script
 * Checks RabbitMQ connection, queues, exchanges, and event subscriptions
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @usage: ts-node scripts/verify-event-bus.ts
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_MANAGEMENT_URL = process.env.RABBITMQ_MANAGEMENT_URL || 'http://localhost:15673';
const RABBITMQ_USER = process.env.RABBITMQ_USER || 'admin';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'admin';

interface Queue {
  name: string;
  messages: number;
  consumers: number;
  state: string;
}

interface Exchange {
  name: string;
  type: string;
}

interface Binding {
  source: string;
  destination: string;
  routing_key: string;
}

async function verifyEventBus() {
  console.log('='.repeat(70));
  console.log(' EVENT BUS VERIFICATION');
  console.log('='.repeat(70));

  const auth = {
    username: RABBITMQ_USER,
    password: RABBITMQ_PASS
  };

  try {
    // Step 1: Check RabbitMQ connection
    console.log('\n Step 1: Checking RabbitMQ connection...');
    try {
      const { data: overview } = await axios.get(`${RABBITMQ_MANAGEMENT_URL}/api/overview`, { auth });
      console.log(`    RabbitMQ is running`);
      console.log(`   Version: ${overview.rabbitmq_version}`);
      console.log(`   Management Version: ${overview.management_version}`);
    } catch (error: any) {
      console.error(`    Cannot connect to RabbitMQ:`, error.message);
      console.error(`   Please ensure RabbitMQ is running on ${RABBITMQ_MANAGEMENT_URL}`);
      process.exit(1);
    }

    // Step 2: Check exchanges
    console.log('\n Step 2: Checking exchanges...');
    const { data: exchanges } = await axios.get<Exchange[]>(`${RABBITMQ_MANAGEMENT_URL}/api/exchanges`, { auth });
    
    const hospitalExchange = exchanges.find(e => e.name === 'hospital.events');
    if (hospitalExchange) {
      console.log(`    Exchange 'hospital.events' exists (type: ${hospitalExchange.type})`);
    } else {
      console.log(`   ️  Exchange 'hospital.events' NOT FOUND`);
    }

    // Step 3: Check queues
    console.log('\n Step 3: Checking queues...');
    const { data: queues } = await axios.get<Queue[]>(`${RABBITMQ_MANAGEMENT_URL}/api/queues`, { auth });
    
    const expectedQueues = [
      'appointments.appointments',
      'appointments.patient-events',
      'appointments.provider-events',
      'appointments.scheduler-events'
    ];

    expectedQueues.forEach(queueName => {
      const queue = queues.find(q => q.name === queueName);
      if (queue) {
        console.log(`    Queue '${queueName}' exists`);
        console.log(`      Messages: ${queue.messages}, Consumers: ${queue.consumers}, State: ${queue.state}`);
      } else {
        console.log(`    Queue '${queueName}' NOT FOUND`);
      }
    });

    // Step 4: Check bindings
    console.log('\n Step 4: Checking bindings...');
    const { data: bindings } = await axios.get<Binding[]>(`${RABBITMQ_MANAGEMENT_URL}/api/bindings`, { auth });
    
    const appointmentBindings = bindings.filter(b => 
      b.destination.startsWith('appointments.') && b.source === 'hospital.events'
    );

    if (appointmentBindings.length > 0) {
      console.log(`    Found ${appointmentBindings.length} bindings for appointments service:`);
      appointmentBindings.forEach(b => {
        console.log(`      ${b.source} → ${b.destination} (routing key: ${b.routing_key})`);
      });
    } else {
      console.log(`   ️  No bindings found for appointments service`);
    }

    // Step 5: Expected subscriptions
    console.log('\n Step 5: Expected event subscriptions...');
    const expectedSubscriptions = [
      'appointments.appointment.scheduled',
      'appointments.appointment.confirmed',
      'appointments.appointment.cancelled',
      'appointments.appointment.completed',
      'appointments.appointment.rescheduled',
      'appointments.appointment.noshow',
      'patient.patient.*',
      'provider.staff.*',
      'scheduler.reminder.*'
    ];

    expectedSubscriptions.forEach(pattern => {
      const binding = bindings.find(b => 
        b.routing_key === pattern && b.destination.startsWith('appointments.')
      );
      if (binding) {
        console.log(`    Subscription '${pattern}' → ${binding.destination}`);
      } else {
        console.log(`   ️  Subscription '${pattern}' NOT BOUND`);
      }
    });

    // Step 6: Check inbox events
    console.log('\n Step 6: Checking inbox events (requires database connection)...');
    console.log(`   ℹ️  To check inbox_events table, run:`);
    console.log(`      SELECT COUNT(*) FROM appointments_schema.inbox_events;`);
    console.log(`      SELECT event_type, COUNT(*) FROM appointments_schema.inbox_events GROUP BY event_type;`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log(' VERIFICATION COMPLETED');
    console.log('='.repeat(70));
    console.log('\n Next Steps:');
    console.log('   1. If queues are missing, start appointments service to create them');
    console.log('   2. If bindings are missing, check EventSubscriptions.ts configuration');
    console.log('   3. Check service logs for event subscription errors');
    console.log('   4. Verify other services are publishing events to RabbitMQ');
    console.log('='.repeat(70));

  } catch (error: any) {
    console.error('\n VERIFICATION FAILED:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run verification
verifyEventBus()
  .then(() => {
    console.log('\n Verification script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n Verification script failed:', error);
    process.exit(1);
  });
