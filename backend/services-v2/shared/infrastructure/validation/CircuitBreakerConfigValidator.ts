export interface CircuitBreakerConfigValidation {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class CircuitBreakerConfigValidator {
  private static readonly MIN_FAILURE_THRESHOLD = 1;
  private static readonly MAX_FAILURE_THRESHOLD = 100;
  private static readonly MIN_RESET_TIMEOUT = 1000;
  private static readonly MAX_RESET_TIMEOUT = 300000;
  private static readonly MIN_MONITORING_PERIOD = 1000;
  private static readonly MAX_MONITORING_PERIOD = 600000;
  private static readonly MIN_HALF_OPEN_CALLS = 1;
  private static readonly MAX_HALF_OPEN_CALLS = 10;

  static validate(config: CircuitBreakerConfigValidation): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    this.validateFailureThreshold(config.failureThreshold, errors, warnings);
    this.validateResetTimeout(config.resetTimeout, errors, warnings);
    this.validateMonitoringPeriod(config.monitoringPeriod, errors, warnings);
    
    if (config.halfOpenMaxCalls !== undefined) {
      this.validateHalfOpenMaxCalls(config.halfOpenMaxCalls, errors, warnings);
    }

    this.validateRelationships(config, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateFailureThreshold(
    value: number,
    errors: string[],
    warnings: string[]
  ): void {
    if (!Number.isInteger(value)) {
      errors.push('failureThreshold must be an integer');
      return;
    }

    if (value < this.MIN_FAILURE_THRESHOLD) {
      errors.push(`failureThreshold must be >= ${this.MIN_FAILURE_THRESHOLD}`);
    }

    if (value > this.MAX_FAILURE_THRESHOLD) {
      errors.push(`failureThreshold must be <= ${this.MAX_FAILURE_THRESHOLD}`);
    }

    if (value === 1) {
      warnings.push('failureThreshold=1 may cause circuit to open too quickly');
    }

    if (value > 20) {
      warnings.push('failureThreshold>20 may delay circuit opening');
    }
  }

  private static validateResetTimeout(
    value: number,
    errors: string[],
    warnings: string[]
  ): void {
    if (!Number.isInteger(value)) {
      errors.push('resetTimeout must be an integer');
      return;
    }

    if (value < this.MIN_RESET_TIMEOUT) {
      errors.push(`resetTimeout must be >= ${this.MIN_RESET_TIMEOUT}ms (1 second)`);
    }

    if (value > this.MAX_RESET_TIMEOUT) {
      errors.push(`resetTimeout must be <= ${this.MAX_RESET_TIMEOUT}ms (5 minutes)`);
    }

    if (value < 5000) {
      warnings.push('resetTimeout<5s may cause frequent recovery attempts');
    }

    if (value > 120000) {
      warnings.push('resetTimeout>2min may delay service recovery');
    }
  }

  private static validateMonitoringPeriod(
    value: number,
    errors: string[],
    warnings: string[]
  ): void {
    if (!Number.isInteger(value)) {
      errors.push('monitoringPeriod must be an integer');
      return;
    }

    if (value < this.MIN_MONITORING_PERIOD) {
      errors.push(`monitoringPeriod must be >= ${this.MIN_MONITORING_PERIOD}ms (1 second)`);
    }

    if (value > this.MAX_MONITORING_PERIOD) {
      errors.push(`monitoringPeriod must be <= ${this.MAX_MONITORING_PERIOD}ms (10 minutes)`);
    }

    if (value < 10000) {
      warnings.push('monitoringPeriod<10s may cause false positives');
    }
  }

  private static validateHalfOpenMaxCalls(
    value: number,
    errors: string[],
    warnings: string[]
  ): void {
    if (!Number.isInteger(value)) {
      errors.push('halfOpenMaxCalls must be an integer');
      return;
    }

    if (value < this.MIN_HALF_OPEN_CALLS) {
      errors.push(`halfOpenMaxCalls must be >= ${this.MIN_HALF_OPEN_CALLS}`);
    }

    if (value > this.MAX_HALF_OPEN_CALLS) {
      errors.push(`halfOpenMaxCalls must be <= ${this.MAX_HALF_OPEN_CALLS}`);
    }

    if (value === 1) {
      warnings.push('halfOpenMaxCalls=1 may cause premature circuit re-opening');
    }
  }

  private static validateRelationships(
    config: CircuitBreakerConfigValidation,
    _errors: string[],
    warnings: string[]
  ): void {
    if (config.resetTimeout < config.monitoringPeriod) {
      warnings.push('resetTimeout < monitoringPeriod may cause rapid state transitions');
    }

    if (config.failureThreshold > 10 && config.monitoringPeriod < 30000) {
      warnings.push('High failureThreshold with short monitoringPeriod may delay circuit opening');
    }
  }

  static sanitize(config: CircuitBreakerConfigValidation): CircuitBreakerConfigValidation {
    return {
      failureThreshold: Math.max(
        this.MIN_FAILURE_THRESHOLD,
        Math.min(this.MAX_FAILURE_THRESHOLD, Math.floor(config.failureThreshold))
      ),
      resetTimeout: Math.max(
        this.MIN_RESET_TIMEOUT,
        Math.min(this.MAX_RESET_TIMEOUT, Math.floor(config.resetTimeout))
      ),
      monitoringPeriod: Math.max(
        this.MIN_MONITORING_PERIOD,
        Math.min(this.MAX_MONITORING_PERIOD, Math.floor(config.monitoringPeriod))
      ),
      halfOpenMaxCalls: config.halfOpenMaxCalls
        ? Math.max(
            this.MIN_HALF_OPEN_CALLS,
            Math.min(this.MAX_HALF_OPEN_CALLS, Math.floor(config.halfOpenMaxCalls))
          )
        : undefined
    };
  }

  static getRecommendedConfig(): CircuitBreakerConfigValidation {
    return {
      failureThreshold: 5,
      resetTimeout: 30000,
      monitoringPeriod: 60000,
      halfOpenMaxCalls: 3
    };
  }
}

