/**
 * Centralized Timeout Configuration
 * Single source of truth for all timeout values across services
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export interface TimeoutConfiguration {
  // Health check timeouts
  healthCheck: number;
  
  // Service-to-service communication
  serviceCall: {
    fast: number;      // For quick operations (permission check)
    normal: number;    // For normal operations (CRUD)
    slow: number;      // For slow operations (reports, analytics)
  };
  
  // Proxy timeouts
  proxy: {
    request: number;   // Client -> Gateway timeout
    upstream: number;  // Gateway -> Service timeout
  };
  
  // Circuit breaker
  circuitBreaker: {
    reset: number;     // Time before attempting recovery
    halfOpen: number;  // Max time in half-open state
  };
  
  // Database operations
  database: {
    query: number;
    transaction: number;
  };
}

/**
 * Default timeout values (in milliseconds)
 * Based on performance testing and best practices
 */
export const DEFAULT_TIMEOUTS: TimeoutConfiguration = {
  healthCheck: 3000,  // 3 seconds - quick health checks
  
  serviceCall: {
    fast: 5000,       // 5 seconds - permission checks, simple queries
    normal: 10000,    // 10 seconds - CRUD operations
    slow: 30000,      // 30 seconds - complex queries, reports
  },
  
  proxy: {
    request: 15000,   // 15 seconds - client timeout
    upstream: 12000,  // 12 seconds - upstream timeout (shorter than request)
  },
  
  circuitBreaker: {
    reset: 30000,     // 30 seconds - recovery attempt interval
    halfOpen: 10000,  // 10 seconds - max time in half-open
  },
  
  database: {
    query: 10000,     // 10 seconds - single query
    transaction: 30000, // 30 seconds - transaction
  },
};

/**
 * Load timeout configuration from environment variables
 * Falls back to defaults if not specified
 */
export function loadTimeoutConfig(): TimeoutConfiguration {
  return {
    healthCheck: parseInt(process.env.TIMEOUT_HEALTH_CHECK || String(DEFAULT_TIMEOUTS.healthCheck)),
    
    serviceCall: {
      fast: parseInt(process.env.TIMEOUT_SERVICE_FAST || String(DEFAULT_TIMEOUTS.serviceCall.fast)),
      normal: parseInt(process.env.TIMEOUT_SERVICE_NORMAL || String(DEFAULT_TIMEOUTS.serviceCall.normal)),
      slow: parseInt(process.env.TIMEOUT_SERVICE_SLOW || String(DEFAULT_TIMEOUTS.serviceCall.slow)),
    },
    
    proxy: {
      request: parseInt(process.env.TIMEOUT_PROXY_REQUEST || String(DEFAULT_TIMEOUTS.proxy.request)),
      upstream: parseInt(process.env.TIMEOUT_PROXY_UPSTREAM || String(DEFAULT_TIMEOUTS.proxy.upstream)),
    },
    
    circuitBreaker: {
      reset: parseInt(process.env.TIMEOUT_CIRCUIT_BREAKER_RESET || String(DEFAULT_TIMEOUTS.circuitBreaker.reset)),
      halfOpen: parseInt(process.env.TIMEOUT_CIRCUIT_BREAKER_HALF_OPEN || String(DEFAULT_TIMEOUTS.circuitBreaker.halfOpen)),
    },
    
    database: {
      query: parseInt(process.env.TIMEOUT_DATABASE_QUERY || String(DEFAULT_TIMEOUTS.database.query)),
      transaction: parseInt(process.env.TIMEOUT_DATABASE_TRANSACTION || String(DEFAULT_TIMEOUTS.database.transaction)),
    },
  };
}

/**
 * Validate timeout configuration
 * Ensures values are reasonable and consistent
 */
export function validateTimeoutConfig(config: TimeoutConfiguration): void {
  // Upstream timeout must be shorter than request timeout
  if (config.proxy.upstream >= config.proxy.request) {
    throw new Error('Proxy upstream timeout must be shorter than request timeout');
  }
  
  // Health check should be quick
  if (config.healthCheck > 5000) {
    console.warn('Health check timeout > 5s may cause issues with load balancers');
  }
  
  // Service call timeouts should be ordered
  if (config.serviceCall.fast >= config.serviceCall.normal) {
    throw new Error('Fast service call timeout must be shorter than normal');
  }
  
  if (config.serviceCall.normal >= config.serviceCall.slow) {
    throw new Error('Normal service call timeout must be shorter than slow');
  }
  
  // All timeouts must be positive
  const allTimeouts = [
    config.healthCheck,
    config.serviceCall.fast,
    config.serviceCall.normal,
    config.serviceCall.slow,
    config.proxy.request,
    config.proxy.upstream,
    config.circuitBreaker.reset,
    config.circuitBreaker.halfOpen,
    config.database.query,
    config.database.transaction,
  ];
  
  for (const timeout of allTimeouts) {
    if (timeout <= 0) {
      throw new Error('All timeout values must be positive');
    }
  }
}
