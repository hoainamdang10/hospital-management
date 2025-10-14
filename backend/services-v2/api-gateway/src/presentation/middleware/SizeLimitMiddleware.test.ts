import { Request, Response, NextFunction } from 'express';
import { SizeLimitMiddleware } from './SizeLimitMiddleware';
import { ILogger } from '@application/services/ILogger';

const mockLogger: ILogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

describe('SizeLimitMiddleware', () => {
  let middleware: SizeLimitMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    const endpointLimits = new Map<string, number>();
    endpointLimits.set('/api/v1/clinical/*/attachments', 50 * 1024 * 1024);
    endpointLimits.set('/api/v1/patients/*/documents', 50 * 1024 * 1024);

    middleware = new SizeLimitMiddleware(
      {
        defaultLimit: 1024 * 1024,
        endpointLimits,
        enableResponseSizeMonitoring: true,
        maxResponseSize: 10 * 1024 * 1024
      },
      mockLogger
    );

    mockRequest = {
      path: '/api/v1/test',
      method: 'POST',
      ip: '127.0.0.1',
      get: jest.fn()
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    nextFunction = jest.fn();
  });

  describe('requestSizeLimit', () => {
    it('should allow requests within default limit', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('500000');

      const limiter = middleware.requestSizeLimit();
      limiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject requests exceeding default limit', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('2000000');

      const limiter = middleware.requestSizeLimit();
      limiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(413);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Request payload too large',
          errorCode: 'PAYLOAD_TOO_LARGE'
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should use endpoint-specific limit for matching paths', () => {
      mockRequest.path = '/api/v1/clinical/123/attachments';
      (mockRequest.get as jest.Mock).mockReturnValue('40000000');

      const limiter = middleware.requestSizeLimit();
      limiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject requests exceeding endpoint-specific limit', () => {
      mockRequest.path = '/api/v1/clinical/123/attachments';
      (mockRequest.get as jest.Mock).mockReturnValue('60000000');

      const limiter = middleware.requestSizeLimit();
      limiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(413);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle missing content-length header', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      const limiter = middleware.requestSizeLimit();
      limiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should log warning when limit exceeded', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('2000000');

      const limiter = middleware.requestSizeLimit();
      limiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Request size limit exceeded',
        expect.objectContaining({
          path: '/api/v1/test',
          method: 'POST'
        })
      );
    });
  });

  describe('responseSizeMonitor', () => {
    it('should monitor response size', () => {
      const monitor = middleware.responseSizeMonitor();
      monitor(mockRequest as Request, mockResponse as Response, nextFunction);

      const largeBody = 'x'.repeat(2 * 1024 * 1024);
      (mockResponse.send as jest.Mock)(largeBody);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Response size',
        expect.objectContaining({
          path: '/api/v1/test'
        })
      );
    });

    it('should warn about large responses', () => {
      const monitor = middleware.responseSizeMonitor();
      monitor(mockRequest as Request, mockResponse as Response, nextFunction);

      const largeBody = 'x'.repeat(15 * 1024 * 1024);
      (mockResponse.send as jest.Mock)(largeBody);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Large response size detected',
        expect.objectContaining({
          path: '/api/v1/test',
          recommendation: 'Consider pagination or response optimization'
        })
      );
    });

    it('should not monitor when disabled', () => {
      const disabledMiddleware = new SizeLimitMiddleware(
        {
          defaultLimit: 1024 * 1024,
          enableResponseSizeMonitoring: false
        },
        mockLogger
      );

      const monitor = disabledMiddleware.responseSizeMonitor();
      monitor(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return formatted statistics', () => {
      const stats = middleware.getStats();

      expect(stats.defaultLimit).toBe('1 MB');
      expect(stats.maxResponseSize).toBe('10 MB');
      expect(stats.endpointLimits).toHaveLength(2);
      expect(stats.endpointLimits[0]).toEqual({
        pattern: '/api/v1/clinical/*/attachments',
        limit: '50 MB'
      });
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      const stats = middleware.getStats();

      expect(stats.defaultLimit).toContain('MB');
      expect(stats.maxResponseSize).toContain('MB');
    });
  });
});

