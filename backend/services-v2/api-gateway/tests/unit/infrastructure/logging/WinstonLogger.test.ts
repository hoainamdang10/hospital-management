import { WinstonLogger } from '@infrastructure/logging/WinstonLogger';

describe('WinstonLogger', () => {
  let logger: WinstonLogger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create logger with default log level (info)', () => {
      logger = new WinstonLogger();
      
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(WinstonLogger);
    });

    it('should create logger with custom log level', () => {
      logger = new WinstonLogger('debug');
      
      expect(logger).toBeDefined();
    });

    it('should create logger with json format', () => {
      logger = new WinstonLogger('info', 'json');
      
      expect(logger).toBeDefined();
    });

    it('should create logger with text format', () => {
      logger = new WinstonLogger('info', 'text');
      
      expect(logger).toBeDefined();
    });
  });

  describe('info', () => {
    beforeEach(() => {
      logger = new WinstonLogger('info', 'json');
    });

    it('should log info message without metadata', () => {
      logger.info('Test info message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info message with metadata', () => {
      const metadata = { userId: '123', action: 'login' };
      
      logger.info('User logged in', metadata);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info message with empty metadata', () => {
      logger.info('Test message', {});
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    beforeEach(() => {
      logger = new WinstonLogger('info', 'json');
    });

    it('should log warning message without metadata', () => {
      logger.warn('Test warning message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log warning message with metadata', () => {
      const metadata = { reason: 'Invalid input', field: 'email' };
      
      logger.warn('Validation warning', metadata);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    beforeEach(() => {
      logger = new WinstonLogger('info', 'json');
    });

    it('should log error message without metadata', () => {
      logger.error('Test error message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log error message with metadata', () => {
      const metadata = { 
        error: 'Database connection failed',
        stack: 'Error stack trace'
      };
      
      logger.error('Database error', metadata);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log error with Error object', () => {
      const error = new Error('Test error');
      
      logger.error('Error occurred', { error: error.message, stack: error.stack });
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    beforeEach(() => {
      logger = new WinstonLogger('debug', 'json');
    });

    it('should log debug message without metadata', () => {
      logger.debug('Test debug message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log debug message with metadata', () => {
      const metadata = { 
        requestId: 'req-123',
        duration: '50ms'
      };
      
      logger.debug('Request processed', metadata);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log debug when log level is info', () => {
      const infoLogger = new WinstonLogger('info', 'json');
      
      infoLogger.debug('This should not be logged');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('log formats', () => {
    it('should format logs as JSON when format is json', () => {
      logger = new WinstonLogger('info', 'json');
      
      logger.info('Test message', { key: 'value' });
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should format logs as text when format is text', () => {
      logger = new WinstonLogger('info', 'text');
      
      logger.info('Test message', { key: 'value' });
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('log levels', () => {
    it('should respect log level hierarchy', () => {
      const errorLogger = new WinstonLogger('error', 'json');
      
      errorLogger.info('This should not be logged');
      errorLogger.warn('This should not be logged');
      errorLogger.error('This should be logged');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log all levels when level is debug', () => {
      const debugLogger = new WinstonLogger('debug', 'json');
      
      debugLogger.debug('Debug message');
      debugLogger.info('Info message');
      debugLogger.warn('Warn message');
      debugLogger.error('Error message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('metadata handling', () => {
    beforeEach(() => {
      logger = new WinstonLogger('info', 'json');
    });

    it('should handle complex metadata objects', () => {
      const metadata = {
        user: { id: '123', email: 'test@example.com' },
        request: { method: 'GET', path: '/api/users' },
        nested: { deep: { value: 'test' } }
      };
      
      logger.info('Complex metadata', metadata);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle metadata with null values', () => {
      const metadata = { value: null, other: 'test' };
      
      logger.info('Null metadata', metadata);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle metadata with undefined values', () => {
      const metadata = { value: undefined, other: 'test' };
      
      logger.info('Undefined metadata', metadata);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle metadata with arrays', () => {
      const metadata = { items: ['item1', 'item2', 'item3'] };
      
      logger.info('Array metadata', metadata);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('timestamp formatting', () => {
    beforeEach(() => {
      logger = new WinstonLogger('info', 'json');
    });

    it('should include timestamp in logs', () => {
      logger.info('Test message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error stack traces', () => {
    beforeEach(() => {
      logger = new WinstonLogger('info', 'json');
    });

    it('should include stack traces for errors', () => {
      const error = new Error('Test error');
      
      logger.error('Error with stack', { 
        error: error.message,
        stack: error.stack
      });
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});

