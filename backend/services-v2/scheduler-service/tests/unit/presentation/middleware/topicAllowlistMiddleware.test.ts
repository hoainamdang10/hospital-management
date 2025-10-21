import { Request, Response, NextFunction } from 'express';
import { topicAllowlistMiddleware, resetAllowlistCache } from '../../../../src/presentation/middleware/topicAllowlistMiddleware';
import fs from 'fs';
import path from 'path';

jest.mock('fs');
jest.mock('path');

describe('topicAllowlistMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockAllowlist = {
    version: '1.0.0',
    allowlist: {
      'scheduling-service': {
        description: 'Appointment scheduling service',
        topics: [
          'appointments.created',
          'appointments.cancelled'
        ],
        wildcards: [
          'appointments.*.reminder.*',
          'appointments.*.notification.*'
        ]
      },
      'billing-service': {
        description: 'Billing service',
        topics: [
          'invoices.created',
          'payments.processed'
        ],
        wildcards: [
          'billing.*'
        ]
      }
    }
  };

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();

    mockRequest = {
      body: {}
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    (path.join as jest.Mock).mockReturnValue('/mock/path/topic-allowlist.json');
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockAllowlist));

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Clear allowlist cache before each test
    resetAllowlistCache();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('allowed topics', () => {
    it('should allow exact match topic', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.created'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow wildcard match topic', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.123.reminder.email'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow wildcard with multiple segments', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.abc-def-ghi.notification.sms'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow billing service wildcard', () => {
      mockRequest.body = {
        ownerService: 'billing-service',
        topicOrCommand: 'billing.anything.here'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow multiple exact matches', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.cancelled'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('disallowed topics', () => {
    it('should reject topic not in allowlist', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'unauthorized.topic'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: "Topic 'unauthorized.topic' is not allowed for service 'scheduling-service'. Check topic allowlist configuration."
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject service not in allowlist', () => {
      mockRequest.body = {
        ownerService: 'unknown-service',
        topicOrCommand: 'any.topic'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: "Topic 'any.topic' is not allowed for service 'unknown-service'. Check topic allowlist configuration."
      });
    });

    it('should reject partial wildcard match', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.123.invalid.email'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should reject topic with wrong prefix', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'wrong.123.reminder.email'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('skip validation', () => {
    it('should skip validation if ownerService is missing', () => {
      mockRequest.body = {
        topicOrCommand: 'any.topic'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should skip validation if topicOrCommand is missing', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should skip validation if both are missing', () => {
      mockRequest.body = {};

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return 500 if allowlist file cannot be read', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.created'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Topic validation error'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if allowlist JSON is invalid', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.created'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Topic validation error'
      });
    });
  });

  describe('wildcard pattern matching', () => {
    it('should match single wildcard', () => {
      mockRequest.body = {
        ownerService: 'billing-service',
        topicOrCommand: 'billing.test'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should match multiple wildcards', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.abc.reminder.xyz'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should not match if pattern structure is different', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.reminder.email'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should handle dots in wildcard segments', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.id-with-dots.reminder.email'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('caching', () => {
    it('should load allowlist only once', () => {
      mockRequest.body = {
        ownerService: 'scheduling-service',
        topicOrCommand: 'appointments.created'
      };

      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      topicAllowlistMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });
  });
});

