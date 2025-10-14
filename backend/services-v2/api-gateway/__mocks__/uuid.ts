/**
 * Mock implementation of uuid module for Jest tests
 * This avoids ESM export issues with the real uuid module
 */

export const v4 = jest.fn(() => '123e4567-e89b-12d3-a456-426614174000');

export const validate = jest.fn((uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
});

export default {
  v4,
  validate
};

