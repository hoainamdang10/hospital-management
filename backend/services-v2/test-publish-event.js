// Test script to publish UserCreatedEvent to RabbitMQ
const amqp = require('amqplib');

async function publishUserCreatedEvent() {
  const connection = await amqp.connect('amqp://admin:admin@localhost:5672');
  const channel = await connection.createChannel();

  const exchange = 'identity.events';
  const routingKey = 'user.created.event';

  // Event payload - User with license Bs-1231
  const event = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType: 'UserCreatedEvent',
    aggregateId: '86bc4460-c8f9-4d47-93f4-34682e4fa227', // User ID
    aggregateType: 'User',
    version: 1,
    occurredAt: new Date().toISOString(),
    payload: {
      userId: '86bc4460-c8f9-4d47-93f4-34682e4fa227',
      email: 'doctor.hms.test@gmail.com',
      fullName: 'Dr. Test Doctor',
      role: 'DOCTOR',
      roleType: 'DOCTOR',
      citizenId: '079203012345',
      phoneNumber: '+84901234567',
      department: 'CARDIOLOGY',
      departmentCode: 'CARDIOLOGY',
      specialization: 'CARDIOLOGY',
      specializationCode: 'CARDIOLOGY',
      specializationName: 'Cardiology',
      licenseNumber: 'Bs-1231',
      education: 'MD - Cardiology',
      yearsOfExperience: 10,
      position: 'Senior Cardiologist',
      title: 'Dr.'
    },
    metadata: {
      causationId: 'test_script',
      correlationId: 'test_script',
      userId: 'test_admin'
    }
  };

  const messageBuffer = Buffer.from(JSON.stringify(event));

  await channel.assertExchange(exchange, 'topic', { durable: true });

  const published = channel.publish(
    exchange,
    routingKey,
    messageBuffer,
    {
      persistent: true,
      contentType: 'application/json',
      messageId: event.eventId,
      timestamp: Date.now()
    }
  );

  console.log('Published UserCreatedEvent:', {
    eventId: event.eventId,
    routingKey,
    exchange,
    userId: event.payload.userId,
    license: event.payload.licenseNumber,
    published
  });

  await channel.close();
  await connection.close();
}

publishUserCreatedEvent()
  .then(() => {
    console.log(' Event published successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error publishing event:', err);
    process.exit(1);
  });
