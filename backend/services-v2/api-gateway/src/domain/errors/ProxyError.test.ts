import { ProxyError, ProxyErrorType } from './ProxyError';

describe('ProxyError', () => {
  const context = {
    serviceName: 'test-service',
    path: '/api/test',
    method: 'GET',
    requestId: 'req-123'
  };

  describe('constructor', () => {
    it('should create error with correct properties', () => {
      const error = new ProxyError(
        ProxyErrorType.TIMEOUT,
        'Request timeout',
        context,
        504,
        true
      );

      expect(error.type).toBe(ProxyErrorType.TIMEOUT);
      expect(error.message).toBe('Request timeout');
      expect(error.statusCode).toBe(504);
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual(context);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should have default statusCode and retryable', () => {
      const error = new ProxyError(
        ProxyErrorType.UNKNOWN,
        'Unknown error',
        context
      );

      expect(error.statusCode).toBe(502);
      expect(error.retryable).toBe(false);
    });
  });

  describe('fromError', () => {
    it('should classify timeout errors', () => {
      const originalError = new Error('Request timed out');
      const proxyError = ProxyError.fromError(originalError, context);

      expect(proxyError.type).toBe(ProxyErrorType.TIMEOUT);
      expect(proxyError.statusCode).toBe(504);
      expect(proxyError.retryable).toBe(true);
    });

    it('should classify connection refused errors', () => {
      const originalError = new Error('ECONNREFUSED');
      const proxyError = ProxyError.fromError(originalError, context);

      expect(proxyError.type).toBe(ProxyErrorType.CONNECTION_REFUSED);
      expect(proxyError.statusCode).toBe(503);
      expect(proxyError.retryable).toBe(true);
    });

    it('should classify circuit breaker errors', () => {
      const originalError = new Error('Circuit breaker is OPEN');
      const proxyError = ProxyError.fromError(originalError, context);

      expect(proxyError.type).toBe(ProxyErrorType.CIRCUIT_BREAKER_OPEN);
      expect(proxyError.statusCode).toBe(503);
      expect(proxyError.retryable).toBe(false);
    });

    it('should classify network errors', () => {
      const originalError = new Error('getaddrinfo ENOTFOUND');
      const proxyError = ProxyError.fromError(originalError, context);

      expect(proxyError.type).toBe(ProxyErrorType.NETWORK_ERROR);
      expect(proxyError.statusCode).toBe(503);
      expect(proxyError.retryable).toBe(true);
    });

    it('should classify unknown errors', () => {
      const originalError = new Error('Something went wrong');
      const proxyError = ProxyError.fromError(originalError, context);

      expect(proxyError.type).toBe(ProxyErrorType.UNKNOWN);
      expect(proxyError.statusCode).toBe(502);
      expect(proxyError.retryable).toBe(false);
    });

    it('should preserve original error in context', () => {
      const originalError = new Error('Test error');
      const proxyError = ProxyError.fromError(originalError, context);

      expect(proxyError.context.originalError).toBe(originalError);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const error = new ProxyError(
        ProxyErrorType.TIMEOUT,
        'Request timeout',
        context,
        504,
        true
      );

      const json = error.toJSON();

      expect(json.success).toBe(false);
      expect(json.error).toBe('Request timeout');
      expect(json.errorType).toBe(ProxyErrorType.TIMEOUT);
      expect(json.statusCode).toBe(504);
      expect(json.retryable).toBe(true);
      expect(json.requestId).toBe('req-123');
      expect(json.timestamp).toBeDefined();
    });

    it('should include retry info when available', () => {
      const contextWithRetry = {
        ...context,
        attemptNumber: 2,
        maxRetries: 3
      };

      const error = new ProxyError(
        ProxyErrorType.TIMEOUT,
        'Request timeout',
        contextWithRetry,
        504,
        true
      );

      const json = error.toJSON();

      expect(json.retryInfo).toEqual({
        attemptNumber: 2,
        maxRetries: 3
      });
    });

    it('should not include retry info when not available', () => {
      const error = new ProxyError(
        ProxyErrorType.TIMEOUT,
        'Request timeout',
        context,
        504,
        true
      );

      const json = error.toJSON();

      expect(json.retryInfo).toBeUndefined();
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly message for timeout', () => {
      const error = new ProxyError(
        ProxyErrorType.TIMEOUT,
        'Request timeout',
        context,
        504,
        true
      );

      expect(error.getUserMessage()).toBe(
        'The service is taking longer than expected to respond. Please try again.'
      );
    });

    it('should return user-friendly message for connection refused', () => {
      const error = new ProxyError(
        ProxyErrorType.CONNECTION_REFUSED,
        'Connection refused',
        context,
        503,
        true
      );

      expect(error.getUserMessage()).toBe(
        'The service is temporarily unavailable. Please try again later.'
      );
    });

    it('should return user-friendly message for circuit breaker', () => {
      const error = new ProxyError(
        ProxyErrorType.CIRCUIT_BREAKER_OPEN,
        'Circuit breaker open',
        context,
        503,
        false
      );

      expect(error.getUserMessage()).toBe(
        'The service is experiencing issues and has been temporarily disabled. Please try again in a few moments.'
      );
    });

    it('should return user-friendly message for network error', () => {
      const error = new ProxyError(
        ProxyErrorType.NETWORK_ERROR,
        'Network error',
        context,
        503,
        true
      );

      expect(error.getUserMessage()).toBe(
        'Network connectivity issue. Please check your connection and try again.'
      );
    });

    it('should return generic message for unknown errors', () => {
      const error = new ProxyError(
        ProxyErrorType.UNKNOWN,
        'Unknown error',
        context,
        502,
        false
      );

      expect(error.getUserMessage()).toBe(
        'An unexpected error occurred. Please try again or contact support if the problem persists.'
      );
    });
  });
});

