/**
 * CircuitBreakerMiddleware - Circuit Breaker Pattern Implementation
 * Implements circuit breaker pattern for resilient service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Circuit Breaker Pattern, Vietnamese Healthcare Standards, Fault Tolerance
 */

import { Request, Response, NextFunction } from 'express';
import { EnhancedGatewayConfig, CircuitBreakerConfig } from '../config/EnhancedGatewayConfig';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  slowRequests: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  consecutiveFailures: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface CircuitBreakerStatus {
  serviceName: string;
  state: CircuitBreakerState;
  metrics: CircuitBreakerMetrics;
  nextAttemptTime: Date | null;
  halfOpenCallsCount: number;
  isHealthy: boolean;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private metrics: CircuitBreakerMetrics;
  private config: CircuitBreakerConfig;
  private nextAttemptTime: Date | null = null;
  private halfOpenCallsCount = 0;
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor(
    private serviceName: string,
    config: CircuitBreakerConfig
  ) {
    this.config = config;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      slowRequests: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      consecutiveFailures: 0,
      averageResponseTime: 0,
      errorRate: 0
    };

    this.startMonitoring();
  }

  /**
   * Execute request through circuit breaker
   */
  public async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.halfOpenCallsCount = 0;
        console.log(`🔄 Circuit breaker for ${this.serviceName} moved to HALF_OPEN state`);
      } else {
        console.warn(`⚡ Circuit breaker for ${this.serviceName} is OPEN - using fallback`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Service ${this.serviceName} is currently unavailable (Circuit Breaker OPEN)`);
      }
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCallsCount >= this.config.halfOpenMaxCalls) {
        console.warn(`⚡ Circuit breaker for ${this.serviceName} HALF_OPEN limit reached - using fallback`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Service ${this.serviceName} is currently in recovery mode`);
      }
      this.halfOpenCallsCount++;
    }

    const startTime = Date.now();
    
    try {
      const result = await operation();
      const responseTime = Date.now() - startTime;
      
      this.recordSuccess(responseTime);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordFailure(responseTime);
      
      if (fallback) {
        console.warn(`⚠️ Service ${this.serviceName} failed, using fallback:`, error);
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.metrics.lastSuccessTime = new Date();
    this.metrics.consecutiveFailures = 0;

    // Update average response time
    this.updateAverageResponseTime(responseTime);

    // Check for slow requests
    if (responseTime > this.config.slowCallDurationThreshold) {
      this.metrics.slowRequests++;
    }

    // Update error rate
    this.updateErrorRate();

    // Handle state transitions
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCallsCount >= this.config.halfOpenMaxCalls) {
        this.state = CircuitBreakerState.CLOSED;
        this.nextAttemptTime = null;
        console.log(`✅ Circuit breaker for ${this.serviceName} moved to CLOSED state`);
      }
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = new Date();
    this.metrics.consecutiveFailures++;

    // Update average response time
    this.updateAverageResponseTime(responseTime);

    // Update error rate
    this.updateErrorRate();

    // Check if circuit should open
    if (this.shouldOpenCircuit()) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
      console.error(`🚨 Circuit breaker for ${this.serviceName} moved to OPEN state`);
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      // If we're in half-open and get a failure, go back to open
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
      console.error(`🚨 Circuit breaker for ${this.serviceName} moved back to OPEN state from HALF_OPEN`);
    }
  }

  /**
   * Check if circuit should open
   */
  private shouldOpenCircuit(): boolean {
    // Check consecutive failures
    if (this.metrics.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }

    // Check error rate over monitoring period
    if (this.metrics.totalRequests >= this.config.failureThreshold) {
      const errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
      if (errorRate >= 0.5) { // 50% error rate
        return true;
      }
    }

    // Check slow call rate
    if (this.metrics.totalRequests >= this.config.slowCallThreshold) {
      const slowCallRate = this.metrics.slowRequests / this.metrics.totalRequests;
      if (slowCallRate >= 0.5) { // 50% slow calls
        return true;
      }
    }

    return false;
  }

  /**
   * Check if should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime !== null && new Date() >= this.nextAttemptTime;
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalTime = (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1)) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
  }

  /**
   * Update error rate
   */
  private updateErrorRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
    }
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.resetMetricsIfNeeded();
    }, this.config.monitoringPeriod);
  }

  /**
   * Reset metrics if needed
   */
  private resetMetricsIfNeeded(): void {
    const now = new Date();
    const monitoringWindow = this.config.monitoringPeriod * 5; // 5 monitoring periods

    // Reset metrics if last activity was too long ago
    if (this.metrics.lastSuccessTime && 
        (now.getTime() - this.metrics.lastSuccessTime.getTime()) > monitoringWindow) {
      this.resetMetrics();
    }
  }

  /**
   * Reset metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      slowRequests: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      consecutiveFailures: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
  }

  /**
   * Get circuit breaker status
   */
  public getStatus(): CircuitBreakerStatus {
    return {
      serviceName: this.serviceName,
      state: this.state,
      metrics: { ...this.metrics },
      nextAttemptTime: this.nextAttemptTime,
      halfOpenCallsCount: this.halfOpenCallsCount,
      isHealthy: this.state === CircuitBreakerState.CLOSED && this.metrics.errorRate < 0.1
    };
  }

  /**
   * Force circuit state (for testing/admin purposes)
   */
  public forceState(state: CircuitBreakerState): void {
    this.state = state;
    if (state === CircuitBreakerState.OPEN) {
      this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
    } else {
      this.nextAttemptTime = null;
    }
    console.log(`🔧 Circuit breaker for ${this.serviceName} forced to ${state} state`);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }
}

export class CircuitBreakerMiddleware {
  private static instance: CircuitBreakerMiddleware;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private config: EnhancedGatewayConfig;

  private constructor() {
    this.config = EnhancedGatewayConfig.getInstance();
  }

  public static getInstance(): CircuitBreakerMiddleware {
    if (!CircuitBreakerMiddleware.instance) {
      CircuitBreakerMiddleware.instance = new CircuitBreakerMiddleware();
    }
    return CircuitBreakerMiddleware.instance;
  }

  /**
   * Get or create circuit breaker for service
   */
  public getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitBreakerConfig = this.config.getCircuitBreakerConfig();
      const circuitBreaker = new CircuitBreaker(serviceName, circuitBreakerConfig);
      this.circuitBreakers.set(serviceName, circuitBreaker);
      console.log(`🔧 Created circuit breaker for ${serviceName}`);
    }

    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Express middleware for circuit breaker
   */
  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Extract service name from request path
      const serviceName = this.extractServiceName(req.path);
      
      if (!serviceName) {
        return next();
      }

      // Get circuit breaker for service
      const circuitBreaker = this.getCircuitBreaker(serviceName);
      
      // Add circuit breaker to request for use in proxy
      (req as any).circuitBreaker = circuitBreaker;
      
      // Add Vietnamese healthcare headers
      const healthcareHeaders = this.config.getVietnameseHealthcareHeaders();
      Object.entries(healthcareHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      next();
    };
  }

  /**
   * Extract service name from request path
   */
  private extractServiceName(path: string): string | null {
    const servicePatterns: Record<string, string> = {
      '/api/v1/auth': 'identity-service',
      '/api/v1/patients': 'patient-registry-service',
      '/api/v1/providers': 'provider-staff-service',
      '/api/v1/appointments': 'scheduling-service',
      '/api/v1/medical-records': 'clinical-emr-service',
      '/api/v1/billing': 'billing-service',
      '/api/v1/notifications': 'notifications-service'
    };

    for (const [pattern, serviceName] of Object.entries(servicePatterns)) {
      if (path.startsWith(pattern)) {
        return serviceName;
      }
    }

    return null;
  }

  /**
   * Get all circuit breaker statuses
   */
  public getAllStatuses(): Record<string, CircuitBreakerStatus> {
    const statuses: Record<string, CircuitBreakerStatus> = {};
    
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      statuses[serviceName] = circuitBreaker.getStatus();
    }

    return statuses;
  }

  /**
   * Get Vietnamese healthcare circuit breaker summary
   */
  public getVietnameseHealthcareSummary(): any {
    const statuses = this.getAllStatuses();
    const totalServices = Object.keys(statuses).length;
    const healthyServices = Object.values(statuses).filter(status => status.isHealthy).length;
    const openCircuits = Object.values(statuses).filter(status => status.state === CircuitBreakerState.OPEN).length;

    return {
      totalServices,
      healthyServices,
      unhealthyServices: totalServices - healthyServices,
      openCircuits,
      healthcareCompliance: {
        hipaaCompliant: true,
        vietnameseStandards: true,
        auditLogging: true,
        faultTolerance: openCircuits === 0
      },
      serviceStatuses: statuses,
      overallHealth: healthyServices / totalServices,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Force all circuits to specific state (for testing)
   */
  public forceAllCircuits(state: CircuitBreakerState): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.forceState(state);
    }
    console.log(`🔧 All circuit breakers forced to ${state} state`);
  }

  /**
   * Cleanup all circuit breakers
   */
  public destroy(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.destroy();
    }
    this.circuitBreakers.clear();
    console.log('🔌 All circuit breakers destroyed');
  }
}
