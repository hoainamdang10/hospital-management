import { RetryPolicy, RetryStrategy } from '../../../../src/domain/value-objects/RetryPolicy';

describe('RetryPolicy Value Object', () => {
  describe('create', () => {
    it('should create valid retry policy with exponential strategy', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000
      });

      expect(policy).toBeDefined();
      expect(policy.getMaxAttempts()).toBe(5);
    });

    it('should create valid retry policy with linear strategy', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.LINEAR,
        maxAttempts: 3,
        baseMs: 2000
      });

      expect(policy).toBeDefined();
      expect(policy.getMaxAttempts()).toBe(3);
    });

    it('should create valid retry policy with fixed strategy', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.FIXED,
        maxAttempts: 10,
        baseMs: 500
      });

      expect(policy).toBeDefined();
      expect(policy.getMaxAttempts()).toBe(10);
    });

    it('should use default maxDelayMs if not provided', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000
      });

      // Default maxDelayMs is 300000 (5 minutes)
      const delay = policy.calculateDelay(10); // Large attempt number
      expect(delay).toBeLessThanOrEqual(300000);
    });

    it('should use custom maxDelayMs if provided', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000,
        maxDelayMs: 10000
      });

      const delay = policy.calculateDelay(10); // Large attempt number
      expect(delay).toBeLessThanOrEqual(10000);
    });

    it('should throw error if maxAttempts is less than 1', () => {
      expect(() => RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 0,
        baseMs: 1000
      })).toThrow('Max attempts must be at least 1');
    });

    it('should throw error if baseMs is negative', () => {
      expect(() => RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: -100
      })).toThrow('Base delay must be non-negative');
    });

    it('should allow baseMs to be zero', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 0
      });

      expect(policy).toBeDefined();
    });
  });

  describe('default', () => {
    it('should create default retry policy', () => {
      const policy = RetryPolicy.default();

      expect(policy).toBeDefined();
      expect(policy.getMaxAttempts()).toBe(5);
    });

    it('should use exponential strategy by default', () => {
      const policy = RetryPolicy.default();
      
      // Exponential: delay = baseMs * 2^attempt
      const delay0 = policy.calculateDelay(0);
      const delay1 = policy.calculateDelay(1);
      
      expect(delay1).toBe(delay0 * 2);
    });
  });

  describe('calculateDelay', () => {
    describe('exponential strategy', () => {
      it('should calculate exponential backoff delay', () => {
        const policy = RetryPolicy.create({
          strategy: RetryStrategy.EXPONENTIAL,
          maxAttempts: 5,
          baseMs: 1000
        });

        expect(policy.calculateDelay(0)).toBe(1000);   // 1000 * 2^0 = 1000
        expect(policy.calculateDelay(1)).toBe(2000);   // 1000 * 2^1 = 2000
        expect(policy.calculateDelay(2)).toBe(4000);   // 1000 * 2^2 = 4000
        expect(policy.calculateDelay(3)).toBe(8000);   // 1000 * 2^3 = 8000
        expect(policy.calculateDelay(4)).toBe(16000);  // 1000 * 2^4 = 16000
      });

      it('should cap delay at maxDelayMs', () => {
        const policy = RetryPolicy.create({
          strategy: RetryStrategy.EXPONENTIAL,
          maxAttempts: 10,
          baseMs: 1000,
          maxDelayMs: 10000
        });

        const delay = policy.calculateDelay(5); // 2^5 * 1000 = 32000, capped at 10000
        expect(delay).toBe(10000);
      });
    });

    describe('linear strategy', () => {
      it('should calculate linear backoff delay', () => {
        const policy = RetryPolicy.create({
          strategy: RetryStrategy.LINEAR,
          maxAttempts: 5,
          baseMs: 1000
        });

        expect(policy.calculateDelay(0)).toBe(1000);  // 1000 * (0 + 1) = 1000
        expect(policy.calculateDelay(1)).toBe(2000);  // 1000 * (1 + 1) = 2000
        expect(policy.calculateDelay(2)).toBe(3000);  // 1000 * (2 + 1) = 3000
        expect(policy.calculateDelay(3)).toBe(4000);  // 1000 * (3 + 1) = 4000
        expect(policy.calculateDelay(4)).toBe(5000);  // 1000 * (4 + 1) = 5000
      });

      it('should cap delay at maxDelayMs', () => {
        const policy = RetryPolicy.create({
          strategy: RetryStrategy.LINEAR,
          maxAttempts: 10,
          baseMs: 1000,
          maxDelayMs: 5000
        });

        const delay = policy.calculateDelay(6); // (6+1) * 1000 = 7000, capped at 5000
        expect(delay).toBe(5000);
      });
    });

    describe('fixed strategy', () => {
      it('should return fixed delay for all attempts', () => {
        const policy = RetryPolicy.create({
          strategy: RetryStrategy.FIXED,
          maxAttempts: 5,
          baseMs: 1000
        });

        expect(policy.calculateDelay(0)).toBe(1000);
        expect(policy.calculateDelay(1)).toBe(1000);
        expect(policy.calculateDelay(2)).toBe(1000);
        expect(policy.calculateDelay(3)).toBe(1000);
        expect(policy.calculateDelay(4)).toBe(1000);
      });

      it('should respect maxDelayMs even for fixed strategy', () => {
        const policy = RetryPolicy.create({
          strategy: RetryStrategy.FIXED,
          maxAttempts: 5,
          baseMs: 10000,
          maxDelayMs: 5000
        });

        expect(policy.calculateDelay(0)).toBe(5000);
      });
    });

    it('should return -1 if attempt exceeds maxAttempts', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 3,
        baseMs: 1000
      });

      expect(policy.calculateDelay(3)).toBe(-1);
      expect(policy.calculateDelay(4)).toBe(-1);
      expect(policy.calculateDelay(10)).toBe(-1);
    });
  });

  describe('shouldRetry', () => {
    it('should return true if attempt is less than maxAttempts', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000
      });

      expect(policy.shouldRetry(0)).toBe(true);
      expect(policy.shouldRetry(1)).toBe(true);
      expect(policy.shouldRetry(4)).toBe(true);
    });

    it('should return false if attempt equals or exceeds maxAttempts', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000
      });

      expect(policy.shouldRetry(5)).toBe(false);
      expect(policy.shouldRetry(6)).toBe(false);
      expect(policy.shouldRetry(10)).toBe(false);
    });
  });

  describe('toJson', () => {
    it('should serialize to JSON', () => {
      const policy = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000,
        maxDelayMs: 10000
      });

      const json = policy.toJson();

      expect(json).toEqual({
        strategy: 'exp',
        max_attempts: 5,
        base_ms: 1000,
        max_delay_ms: 10000
      });
    });
  });

  describe('fromJson', () => {
    it('should deserialize from JSON', () => {
      const json = {
        strategy: 'exp',
        max_attempts: 5,
        base_ms: 1000,
        max_delay_ms: 10000
      };

      const policy = RetryPolicy.fromJson(json);

      expect(policy).toBeDefined();
      expect(policy.getMaxAttempts()).toBe(5);
      expect(policy.toJson()).toEqual(json);
    });
  });

  describe('equals', () => {
    it('should return true for equal policies', () => {
      const policy1 = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000,
        maxDelayMs: 10000
      });

      const policy2 = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000,
        maxDelayMs: 10000
      });

      expect(policy1.equals(policy2)).toBe(true);
    });

    it('should return false for different strategies', () => {
      const policy1 = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000
      });

      const policy2 = RetryPolicy.create({
        strategy: RetryStrategy.LINEAR,
        maxAttempts: 5,
        baseMs: 1000
      });

      expect(policy1.equals(policy2)).toBe(false);
    });

    it('should return false for different maxAttempts', () => {
      const policy1 = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseMs: 1000
      });

      const policy2 = RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 3,
        baseMs: 1000
      });

      expect(policy1.equals(policy2)).toBe(false);
    });
  });
});

