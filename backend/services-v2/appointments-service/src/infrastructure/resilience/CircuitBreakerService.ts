/**
 * Circuit Breaker Service - Infrastructure Layer
 * Implements circuit breaker pattern for external service calls
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Resilience Patterns
 */

import CircuitBreaker from 'opossum';
import { AxiosInstance, AxiosResponse } from 'axios';

/**
 * Circuit Breaker Options
 */
export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  rollingCountTimeout?: number;
  rollingCountBuckets?: number;
  name?: string;
}

/**
 * Default Circuit Breaker Options
 */
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
  name: 'default-circuit-breaker'
};

/**
 * Circuit Breaker Service
 * Wraps HTTP calls with circuit breaker pattern
 */
export class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Create or get circuit breaker for a service
   */
  public getBreaker(
    serviceName: string,
    options: CircuitBreakerOptions = {}
  ): CircuitBreaker {
    if (this.breakers.has(serviceName)) {
      return this.breakers.get(serviceName)!;
    }

    const breakerOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      name: serviceName
    };

    const breaker = new CircuitBreaker(
      async (fn: () => Promise<any>) => fn(),
      breakerOptions
    );

    this.setupEventListeners(breaker, serviceName);
    this.breakers.set(serviceName, breaker);

    return breaker;
  }

  /**
   * Execute HTTP call with circuit breaker
   */
  public async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    options?: CircuitBreakerOptions
  ): Promise<T> {
    const breaker = this.getBreaker(serviceName, options);
    return breaker.fire(fn) as Promise<T>;
  }

  /**
   * Execute HTTP GET with circuit breaker
   */
  public async executeGet<T>(
    serviceName: string,
    client: AxiosInstance,
    url: string,
    options?: CircuitBreakerOptions
  ): Promise<AxiosResponse<T>> {
    return this.execute(
      serviceName,
      () => client.get<T>(url),
      options
    );
  }

  /**
   * Execute HTTP POST with circuit breaker
   */
  public async executePost<T>(
    serviceName: string,
    client: AxiosInstance,
    url: string,
    data: any,
    options?: CircuitBreakerOptions
  ): Promise<AxiosResponse<T>> {
    return this.execute(
      serviceName,
      () => client.post<T>(url, data),
      options
    );
  }

  /**
   * Execute HTTP PUT with circuit breaker
   */
  public async executePut<T>(
    serviceName: string,
    client: AxiosInstance,
    url: string,
    data: any,
    options?: CircuitBreakerOptions
  ): Promise<AxiosResponse<T>> {
    return this.execute(
      serviceName,
      () => client.put<T>(url, data),
      options
    );
  }

  /**
   * Execute HTTP DELETE with circuit breaker
   */
  public async executeDelete<T>(
    serviceName: string,
    client: AxiosInstance,
    url: string,
    options?: CircuitBreakerOptions
  ): Promise<AxiosResponse<T>> {
    return this.execute(
      serviceName,
      () => client.delete<T>(url),
      options
    );
  }

  /**
   * Get circuit breaker status
   */
  public getStatus(serviceName: string): {
    isOpen: boolean;
    isHalfOpen: boolean;
    isClosed: boolean;
    stats: any;
  } | null {
    const breaker = this.breakers.get(serviceName);
    if (!breaker) {
      return null;
    }

    return {
      isOpen: breaker.opened,
      isHalfOpen: breaker.halfOpen,
      isClosed: breaker.closed,
      stats: breaker.stats
    };
  }

  /**
   * Reset circuit breaker
   */
  public reset(serviceName: string): void {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.close();
    }
  }

  /**
   * Reset all circuit breakers
   */
  public resetAll(): void {
    this.breakers.forEach(breaker => breaker.close());
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(breaker: CircuitBreaker, serviceName: string): void {
    breaker.on('open', () => {
      console.warn(`[CircuitBreaker] ${serviceName} - Circuit OPENED`);
    });

    breaker.on('halfOpen', () => {
      console.log(`[CircuitBreaker] ${serviceName} - Circuit HALF-OPEN`);
    });

    breaker.on('close', () => {
      console.log(`[CircuitBreaker] ${serviceName} - Circuit CLOSED`);
    });

    breaker.on('success', (result: any) => {
      console.debug(`[CircuitBreaker] ${serviceName} - Success`);
    });

    breaker.on('failure', (error: Error) => {
      console.error(`[CircuitBreaker] ${serviceName} - Failure:`, error.message);
    });

    breaker.on('timeout', () => {
      console.error(`[CircuitBreaker] ${serviceName} - Timeout`);
    });

    breaker.on('reject', () => {
      console.error(`[CircuitBreaker] ${serviceName} - Rejected (circuit open)`);
    });

    breaker.on('fallback', (result: any) => {
      console.log(`[CircuitBreaker] ${serviceName} - Fallback executed`);
    });
  }

  /**
   * Get all circuit breaker statuses
   */
  public getAllStatuses(): Map<string, any> {
    const statuses = new Map();
    this.breakers.forEach((breaker, serviceName) => {
      statuses.set(serviceName, {
        isOpen: breaker.opened,
        isHalfOpen: breaker.halfOpen,
        isClosed: breaker.closed,
        stats: breaker.stats
      });
    });
    return statuses;
  }

  /**
   * Shutdown all circuit breakers
   */
  public shutdown(): void {
    this.breakers.forEach(breaker => breaker.shutdown());
    this.breakers.clear();
  }
}

export const circuitBreakerService = new CircuitBreakerService();

