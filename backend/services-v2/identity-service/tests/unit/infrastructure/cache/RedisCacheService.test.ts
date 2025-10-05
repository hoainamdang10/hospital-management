/**
 * Unit Tests for RedisCacheService
 * Tests caching functionality with Redis
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RedisCacheService } from '../../../../src/infrastructure/cache/RedisCacheService';
import { TestUtils } from '../../../setup';

// Mock redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    on: jest.fn()
  }))
}));

describe('RedisCacheService', () => {
  let cacheService: RedisCacheService;
  let mockLogger: any;
  let mockRedisClient: any;

  beforeEach(() => {
    // Ensure redis.createClient returns a valid mock after Jest resets mocks
    const redisModule: any = require('redis');
    const clientMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      on: jest.fn()
    };
    redisModule.createClient.mockReturnValue(clientMock);
  });

  beforeEach(() => {
    mockLogger = TestUtils.createMockLogger();
    cacheService = new RedisCacheService(
      'redis://localhost:6379',
      mockLogger,
      'test:'
    );

    // Get mock client
    mockRedisClient = (cacheService as any).client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to Redis successfully', async () => {
      await cacheService.connect();

      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Redis cache service connected');
    });

    it('should handle connection errors', async () => {
      mockRedisClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(cacheService.connect()).rejects.toThrow('Connection failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should not connect if already connected', async () => {
      (cacheService as any).isConnected = true;

      await cacheService.connect();

      expect(mockRedisClient.connect).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis successfully', async () => {
      (cacheService as any).isConnected = true;

      await cacheService.disconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Redis cache service disconnected');
    });

    it('should not disconnect if not connected', async () => {
      (cacheService as any).isConnected = false;

      await cacheService.disconnect();

      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    beforeEach(() => {
      (cacheService as any).isConnected = true;
    });

    it('should get value from cache', async () => {
      const testData = { name: 'Test User', email: 'test@example.com' };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(testData));

      const result = await cacheService.get('user:123');

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:user:123');
    });

    it('should return null if key not found', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cacheService.get('user:999');

      expect(result).toBeNull();
    });

    it('should return null if not connected', async () => {
      (cacheService as any).isConnected = false;

      const result = await cacheService.get('user:123');

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheService.get('user:123');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should track cache hits', async () => {
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' }));

      await cacheService.get('key');

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });

    it('should track cache misses', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      await cacheService.get('key');

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
    });
  });

  describe('set', () => {
    beforeEach(() => {
      (cacheService as any).isConnected = true;
    });

    it('should set value in cache with default TTL', async () => {
      const testData = { name: 'Test User' };

      const result = await cacheService.set('user:123', testData);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:user:123',
        300, // Default TTL
        JSON.stringify(testData)
      );
    });

    it('should set value with custom TTL', async () => {
      const testData = { name: 'Test User' };

      await cacheService.set('user:123', testData, { ttl: 600 });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:user:123',
        600,
        JSON.stringify(testData)
      );
    });

    it('should return false if not connected', async () => {
      (cacheService as any).isConnected = false;

      const result = await cacheService.set('user:123', { data: 'test' });

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.setEx.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheService.set('user:123', { data: 'test' });

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should track cache sets', async () => {
      await cacheService.set('key', { data: 'test' });

      const stats = cacheService.getStats();
      expect(stats.sets).toBe(1);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      (cacheService as any).isConnected = true;
    });

    it('should delete key from cache', async () => {
      mockRedisClient.del.mockResolvedValueOnce(1);

      const result = await cacheService.delete('user:123');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test:user:123');
    });

    it('should return false if key not found', async () => {
      mockRedisClient.del.mockResolvedValueOnce(0);

      const result = await cacheService.delete('user:999');

      expect(result).toBe(false);
    });

    it('should track cache deletes', async () => {
      mockRedisClient.del.mockResolvedValueOnce(1);

      await cacheService.delete('key');

      const stats = cacheService.getStats();
      expect(stats.deletes).toBe(1);
    });
  });

  describe('deletePattern', () => {
    beforeEach(() => {
      (cacheService as any).isConnected = true;
    });

    it('should delete keys matching pattern', async () => {
      mockRedisClient.keys.mockResolvedValueOnce(['test:user:1', 'test:user:2']);
      mockRedisClient.del.mockResolvedValueOnce(2);

      const result = await cacheService.deletePattern('user:*');

      expect(result).toBe(2);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:user:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['test:user:1', 'test:user:2']);
    });

    it('should return 0 if no keys match', async () => {
      mockRedisClient.keys.mockResolvedValueOnce([]);

      const result = await cacheService.deletePattern('user:*');

      expect(result).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const stats = cacheService.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('sets');
      expect(stats).toHaveProperty('deletes');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('hitRate');
    });

    it('should calculate hit rate correctly', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' }));
      mockRedisClient.get.mockResolvedValueOnce(null);

      await cacheService.get('key1'); // Hit
      await cacheService.get('key2'); // Miss

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics', async () => {
      (cacheService as any).isConnected = true;
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' }));

      await cacheService.get('key');
      cacheService.resetStats();

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
      expect(stats.deletes).toBe(0);
      expect(stats.errors).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('isReady', () => {
    it('should return true when connected', () => {
      (cacheService as any).isConnected = true;

      expect(cacheService.isReady()).toBe(true);
    });

    it('should return false when not connected', () => {
      (cacheService as any).isConnected = false;

      expect(cacheService.isReady()).toBe(false);
    });
  });
});

