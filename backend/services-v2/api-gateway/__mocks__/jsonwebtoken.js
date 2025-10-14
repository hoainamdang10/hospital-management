/**
 * Mock implementation of jsonwebtoken module for Jest tests
 */

class JsonWebTokenError extends Error {
  constructor(message) {
    super();
    this.message = message || '';
    this.name = 'JsonWebTokenError';
  }
}

class TokenExpiredError extends Error {
  constructor(message, expiredAt) {
    super(message);
    this.name = 'TokenExpiredError';
    this.expiredAt = expiredAt;
  }
}

const verify = jest.fn();
const sign = jest.fn();
const decode = jest.fn();

module.exports = {
  verify,
  sign,
  decode,
  JsonWebTokenError,
  TokenExpiredError,
  __esModule: true,
  default: {
    verify,
    sign,
    decode,
    JsonWebTokenError,
    TokenExpiredError
  }
};

