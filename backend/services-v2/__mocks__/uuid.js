/**
 * Mock implementation of uuid module for Jest tests
 * This avoids ESM export issues with the real uuid module
 */

const validateFn = jest.fn((uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
});

const v4Fn = jest.fn(() => '123e4567-e89b-12d3-a456-426614174000');

module.exports = {
  v4: v4Fn,
  validate: validateFn,
  // Support both default and named exports
  __esModule: true,
  default: {
    v4: v4Fn,
    validate: validateFn
  }
};

