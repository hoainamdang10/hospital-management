/**
 * Generate JWT Token for Scheduler Service Authentication
 * Run: node generate-scheduler-token.js
 */

const jwt = require('jsonwebtoken');

// Same secret as Scheduler Service
const JWT_SECRET = 'your_super_secure_jwt_secret_here_minimum_32_characters_for_production_use';

const payload = {
  sub: 'appointments-service',
  email: 'appointments@hospital.com',
  role: 'service',
  service: 'appointments',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 days
};

const token = jwt.sign(payload, JWT_SECRET);

console.log('\n========================================');
console.log('JWT TOKEN FOR SCHEDULER SERVICE');
console.log('========================================\n');
console.log('Token:', token);
console.log('\nExpires:', new Date(payload.exp * 1000).toISOString());
console.log('\n========================================');
console.log('COPY THIS TO .env FILE:');
console.log('========================================\n');
console.log(`SCHEDULER_API_KEY=${token}`);
console.log('\n');
