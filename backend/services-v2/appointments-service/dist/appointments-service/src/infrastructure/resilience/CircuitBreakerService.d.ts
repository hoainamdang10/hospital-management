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
 * Circuit Breaker Service
 * Wraps HTTP calls with circuit breaker pattern
 */
export declare class CircuitBreakerService {
    private breakers;
    /**
     * Create or get circuit breaker for a service
     */
    getBreaker(serviceName: string, options?: CircuitBreakerOptions): CircuitBreaker;
    /**
     * Execute HTTP call with circuit breaker
     */
    execute<T>(serviceName: string, fn: () => Promise<T>, options?: CircuitBreakerOptions): Promise<T>;
    /**
     * Execute HTTP GET with circuit breaker
     */
    executeGet<T>(serviceName: string, client: AxiosInstance, url: string, options?: CircuitBreakerOptions): Promise<AxiosResponse<T>>;
    /**
     * Execute HTTP POST with circuit breaker
     */
    executePost<T>(serviceName: string, client: AxiosInstance, url: string, data: any, options?: CircuitBreakerOptions): Promise<AxiosResponse<T>>;
    /**
     * Execute HTTP PUT with circuit breaker
     */
    executePut<T>(serviceName: string, client: AxiosInstance, url: string, data: any, options?: CircuitBreakerOptions): Promise<AxiosResponse<T>>;
    /**
     * Execute HTTP DELETE with circuit breaker
     */
    executeDelete<T>(serviceName: string, client: AxiosInstance, url: string, options?: CircuitBreakerOptions): Promise<AxiosResponse<T>>;
    /**
     * Get circuit breaker status
     */
    getStatus(serviceName: string): {
        isOpen: boolean;
        isHalfOpen: boolean;
        isClosed: boolean;
        stats: any;
    } | null;
    /**
     * Reset circuit breaker
     */
    reset(serviceName: string): void;
    /**
     * Reset all circuit breakers
     */
    resetAll(): void;
    /**
     * Setup event listeners for monitoring
     */
    private setupEventListeners;
    /**
     * Get all circuit breaker statuses
     */
    getAllStatuses(): Map<string, any>;
    /**
     * Shutdown all circuit breakers
     */
    shutdown(): void;
}
export declare const circuitBreakerService: CircuitBreakerService;
//# sourceMappingURL=CircuitBreakerService.d.ts.map