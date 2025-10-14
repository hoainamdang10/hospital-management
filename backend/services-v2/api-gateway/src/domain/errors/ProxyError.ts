export enum ProxyErrorType {
  TIMEOUT = 'TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface ProxyErrorContext {
  serviceName: string;
  path: string;
  method: string;
  requestId?: string;
  userId?: string;
  attemptNumber?: number;
  maxRetries?: number;
  originalError?: Error;
}

export class ProxyError extends Error {
  public readonly type: ProxyErrorType;
  public readonly statusCode: number;
  public readonly context: ProxyErrorContext;
  public readonly retryable: boolean;
  public readonly timestamp: Date;

  constructor(
    type: ProxyErrorType,
    message: string,
    context: ProxyErrorContext,
    statusCode: number = 502,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'ProxyError';
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
    this.retryable = retryable;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }

  static fromError(error: Error, context: ProxyErrorContext): ProxyError {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return new ProxyError(
        ProxyErrorType.TIMEOUT,
        'Request timeout - service did not respond in time',
        { ...context, originalError: error },
        504,
        true
      );
    }

    if (errorMessage.includes('econnrefused') || errorMessage.includes('connection refused')) {
      return new ProxyError(
        ProxyErrorType.CONNECTION_REFUSED,
        'Connection refused - service is not reachable',
        { ...context, originalError: error },
        503,
        true
      );
    }

    if (errorMessage.includes('circuit breaker')) {
      return new ProxyError(
        ProxyErrorType.CIRCUIT_BREAKER_OPEN,
        'Circuit breaker is open - service is temporarily unavailable',
        { ...context, originalError: error },
        503,
        false
      );
    }

    if (errorMessage.includes('enotfound') || errorMessage.includes('getaddrinfo')) {
      return new ProxyError(
        ProxyErrorType.NETWORK_ERROR,
        'Network error - unable to resolve service address',
        { ...context, originalError: error },
        503,
        true
      );
    }

    return new ProxyError(
      ProxyErrorType.UNKNOWN,
      error.message || 'Unknown proxy error',
      { ...context, originalError: error },
      502,
      false
    );
  }

  toJSON(): {
    success: false;
    error: string;
    errorType: ProxyErrorType;
    statusCode: number;
    retryable: boolean;
    requestId?: string;
    timestamp: string;
    retryInfo?: {
      attemptNumber: number;
      maxRetries: number;
    };
  } {
    return {
      success: false,
      error: this.message,
      errorType: this.type,
      statusCode: this.statusCode,
      retryable: this.retryable,
      requestId: this.context.requestId,
      timestamp: this.timestamp.toISOString(),
      retryInfo: this.context.attemptNumber && this.context.maxRetries
        ? {
            attemptNumber: this.context.attemptNumber,
            maxRetries: this.context.maxRetries
          }
        : undefined
    };
  }

  getUserMessage(): string {
    switch (this.type) {
      case ProxyErrorType.TIMEOUT:
        return 'The service is taking longer than expected to respond. Please try again.';
      case ProxyErrorType.CONNECTION_REFUSED:
      case ProxyErrorType.SERVICE_UNAVAILABLE:
        return 'The service is temporarily unavailable. Please try again later.';
      case ProxyErrorType.CIRCUIT_BREAKER_OPEN:
        return 'The service is experiencing issues and has been temporarily disabled. Please try again in a few moments.';
      case ProxyErrorType.NETWORK_ERROR:
        return 'Network connectivity issue. Please check your connection and try again.';
      case ProxyErrorType.UPSTREAM_ERROR:
        return 'The service encountered an error processing your request.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }
}

