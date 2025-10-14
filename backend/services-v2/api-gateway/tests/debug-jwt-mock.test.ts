/**
 * Debug test để hiểu cách Jest mock jsonwebtoken
 */

jest.mock('jsonwebtoken');

import jwt from 'jsonwebtoken';

describe('Debug JWT Mock', () => {
  it('should understand how JsonWebTokenError works', () => {
    console.log('=== jwt object ===');
    console.log('jwt:', jwt);
    console.log('jwt.JsonWebTokenError:', jwt.JsonWebTokenError);
    console.log('typeof jwt.JsonWebTokenError:', typeof jwt.JsonWebTokenError);
    console.log('');

    console.log('=== Create error with new jwt.JsonWebTokenError ===');
    const error1 = new jwt.JsonWebTokenError('test message 1');
    console.log('error1:', error1);
    console.log('error1.message:', error1.message);
    console.log('error1.name:', error1.name);
    console.log('error1 keys:', Object.keys(error1));
    console.log('error1.message descriptor:', Object.getOwnPropertyDescriptor(error1, 'message'));
    console.log('error1 instanceof jwt.JsonWebTokenError:', error1 instanceof jwt.JsonWebTokenError);
    console.log('error1 instanceof Error:', error1 instanceof Error);
    console.log('');

    console.log('=== Create error with Object.create ===');
    const error2 = Object.create(jwt.JsonWebTokenError.prototype);
    error2.message = 'test message 2';
    error2.name = 'JsonWebTokenError';
    console.log('error2:', error2);
    console.log('error2.message:', error2.message);
    console.log('error2.name:', error2.name);
    console.log('error2 keys:', Object.keys(error2));
    console.log('error2.message descriptor:', Object.getOwnPropertyDescriptor(error2, 'message'));
    console.log('error2 instanceof jwt.JsonWebTokenError:', error2 instanceof jwt.JsonWebTokenError);
    console.log('error2 instanceof Error:', error2 instanceof Error);
    console.log('');

    console.log('=== Import from mock directly ===');
    const { JsonWebTokenError } = require('jsonwebtoken');
    console.log('JsonWebTokenError:', JsonWebTokenError);
    console.log('JsonWebTokenError === jwt.JsonWebTokenError:', JsonWebTokenError === jwt.JsonWebTokenError);
    
    const error3 = new JsonWebTokenError('test message 3');
    console.log('error3:', error3);
    console.log('error3.message:', error3.message);
    console.log('error3.name:', error3.name);
    console.log('error3 keys:', Object.keys(error3));
    console.log('error3.message descriptor:', Object.getOwnPropertyDescriptor(error3, 'message'));
    console.log('');

    // This test always passes - it's just for debugging
    expect(true).toBe(true);
  });
});

