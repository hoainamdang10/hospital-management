const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_here_minimum_32_characters_for_production_use';

const payload = {
  sub: 'test-user-123',
  email: 'test@hospital.com',
  role: 'admin',
  service: 'appointments',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
};

const token = jwt.sign(payload, JWT_SECRET);

console.log('\n=== JWT Token Generated ===\n');
console.log('Token:', token);
console.log('\nPayload:', JSON.stringify(payload, null, 2));
console.log('\nExpires:', new Date(payload.exp * 1000).toISOString());
console.log('\n=== Copy this token to test-api.http ===\n');
console.log(`@token = ${token}`);
console.log('\n');

