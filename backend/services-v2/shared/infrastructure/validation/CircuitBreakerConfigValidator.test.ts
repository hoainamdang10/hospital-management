import { CircuitBreakerConfigValidator } from './CircuitBreakerConfigValidator';

describe('CircuitBreakerConfigValidator', () => {
  describe('validate', () => {
    it('should validate correct configuration', () => {
      const config = {
        failureThreshold: 5,
        resetTimeout: 30000,
        monitoringPeriod: 60000,
        halfOpenMaxCalls: 3
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject failureThreshold below minimum', () => {
      const config = {
        failureThreshold: 0,
        resetTimeout: 30000,
        monitoringPeriod: 60000
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('failureThreshold must be >= 1');
    });

    it('should reject failureThreshold above maximum', () => {
      const config = {
        failureThreshold: 101,
        resetTimeout: 30000,
        monitoringPeriod: 60000
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('failureThreshold must be <= 100');
    });

    it('should reject non-integer failureThreshold', () => {
      const config = {
        failureThreshold: 5.5,
        resetTimeout: 30000,
        monitoringPeriod: 60000
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('failureThreshold must be an integer');
    });

    it('should warn about failureThreshold = 1', () => {
      const config = {
        failureThreshold: 1,
        resetTimeout: 30000,
        monitoringPeriod: 60000
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('failureThreshold=1 may cause circuit to open too quickly');
    });

    it('should reject resetTimeout below minimum', () => {
      const config = {
        failureThreshold: 5,
        resetTimeout: 500,
        monitoringPeriod: 60000
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('resetTimeout must be >= 1000ms (1 second)');
    });

    it('should reject resetTimeout above maximum', () => {
      const config = {
        failureThreshold: 5,
        resetTimeout: 400000,
        monitoringPeriod: 60000
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('resetTimeout must be <= 300000ms (5 minutes)');
    });

    it('should warn about short resetTimeout', () => {
      const config = {
        failureThreshold: 5,
        resetTimeout: 3000,
        monitoringPeriod: 60000
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('resetTimeout<5s may cause frequent recovery attempts');
    });

    it('should reject monitoringPeriod below minimum', () => {
      const config = {
        failureThreshold: 5,
        resetTimeout: 30000,
        monitoringPeriod: 500
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('monitoringPeriod must be >= 1000ms (1 second)');
    });

    it('should reject halfOpenMaxCalls below minimum', () => {
      const config = {
        failureThreshold: 5,
        resetTimeout: 30000,
        monitoringPeriod: 60000,
        halfOpenMaxCalls: 0
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('halfOpenMaxCalls must be >= 1');
    });

    it('should warn about relationship issues', () => {
      const config = {
        failureThreshold: 5,
        resetTimeout: 10000,
        monitoringPeriod: 30000
      };

      const result = CircuitBreakerConfigValidator.validate(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('resetTimeout < monitoringPeriod may cause rapid state transitions');
    });
  });

  describe('sanitize', () => {
    it('should clamp failureThreshold to valid range', () => {
      const config = {
        failureThreshold: 150,
        resetTimeout: 30000,
        monitoringPeriod: 60000
      };

      const sanitized = CircuitBreakerConfigValidator.sanitize(config);

      expect(sanitized.failureThreshold).toBe(100);
    });

    it('should clamp resetTimeout to valid range', () => {
      const config = {
        failureThreshold: 5,
        resetTimeout: 500,
        monitoringPeriod: 60000
      };

      const sanitized = CircuitBreakerConfigValidator.sanitize(config);

      expect(sanitized.resetTimeout).toBe(1000);
    });

    it('should floor non-integer values', () => {
      const config = {
        failureThreshold: 5.7,
        resetTimeout: 30000.9,
        monitoringPeriod: 60000.3
      };

      const sanitized = CircuitBreakerConfigValidator.sanitize(config);

      expect(sanitized.failureThreshold).toBe(5);
      expect(sanitized.resetTimeout).toBe(30000);
      expect(sanitized.monitoringPeriod).toBe(60000);
    });
  });

  describe('getRecommendedConfig', () => {
    it('should return recommended configuration', () => {
      const recommended = CircuitBreakerConfigValidator.getRecommendedConfig();

      expect(recommended.failureThreshold).toBe(5);
      expect(recommended.resetTimeout).toBe(30000);
      expect(recommended.monitoringPeriod).toBe(60000);
      expect(recommended.halfOpenMaxCalls).toBe(3);
    });

    it('recommended config should pass validation', () => {
      const recommended = CircuitBreakerConfigValidator.getRecommendedConfig();
      const result = CircuitBreakerConfigValidator.validate(recommended);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

