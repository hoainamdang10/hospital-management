import { JWTToken } from '@domain/value-objects/JWTToken';

describe('JWTToken Value Object', () => {
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  describe('create', () => {
    it('should create a valid JWT token', () => {
      const token = JWTToken.create(validToken);
      expect(token.value).toBe(validToken);
    });

    it('should throw error for empty token', () => {
      expect(() => JWTToken.create('')).toThrow('JWT token cannot be empty');
    });

    it('should throw error for invalid format (not 3 parts)', () => {
      expect(() => JWTToken.create('invalid.token')).toThrow('Invalid JWT token format - must have 3 parts');
    });

    it('should throw error for token with empty parts', () => {
      expect(() => JWTToken.create('.valid.')).toThrow('Invalid JWT token - empty part detected');
    });

    it('should trim whitespace', () => {
      const token = JWTToken.create(`  ${validToken}  `);
      expect(token.value).toBe(validToken);
    });
  });

  describe('getters', () => {
    it('should get header part', () => {
      const token = JWTToken.create(validToken);
      expect(token.getHeader()).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should get payload part', () => {
      const token = JWTToken.create(validToken);
      expect(token.getPayload()).toBe('eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ');
    });

    it('should get signature part', () => {
      const token = JWTToken.create(validToken);
      expect(token.getSignature()).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    });
  });

  describe('toString', () => {
    it('should return token value as string', () => {
      const token = JWTToken.create(validToken);
      expect(token.toString()).toBe(validToken);
    });
  });
});

