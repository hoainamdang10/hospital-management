/**
 * Redis Cache Service Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RedisCacheService } from '../../../src/infrastructure/cache/RedisCacheService';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    flushall: jest.fn(),
    info: jest.fn(),
    quit: jest.fn(),
    on: jest.fn()
  }));
});

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let mockRedisClient: any;

  beforeEach(() => {
    service = new RedisCacheService();
    mockRedisClient = (service as any).client;
  });

  afterEach(async () => {
    await service.disconnect();
  });

  describe('connect', () => {
    it('should connect to Redis successfully', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);

      await service.connect();

      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      await service.connect();

      expect(service.isReady()).toBe(false);
    });
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));
      (service as any).isConnected = true;

      const result = await service.get<typeof testData>('test-key');

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('scheduling:test-key');
    });

    it('should return null if key not found', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      (service as any).isConnected = true;

      const result = await service.get('non-existent');

      expect(result).toBeNull();
    });

    it('should return null if not connected', async () => {
      (service as any).isConnected = false;

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.setex.mockResolvedValue('OK');
      (service as any).isConnected = true;

      const result = await service.set('test-key', testData, { ttl: 600 });

      expect(result).toBe(true);
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'scheduling:test-key',
        600,
        JSON.stringify(testData)
      );
    });

    it('should use default TTL if not provided', async () => {
      mockRedisClient.setex.mockResolvedValue('OK');
      (service as any).isConnected = true;

      await service.set('test-key', { data: 'test' });

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'scheduling:test-key',
        300,
        expect.any(String)
      );
    });

    it('should return false if not connected', async () => {
      (service as any).isConnected = false;

      const result = await service.set('test-key', { data: 'test' });

      expect(result).toBe(false);
      expect(mockRedisClient.setex).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete key from cache', async () => {
      mockRedisClient.del.mockResolvedValue(1);
      (service as any).isConnected = true;

      const result = await service.delete('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('scheduling:test-key');
    });
  });

  describe('deletePattern', () => {
    it('should delete keys matching pattern', async () => {
      mockRedisClient.keys.mockResolvedValue([
        'scheduling:patient:1',
        'scheduling:patient:2'
      ]);
      mockRedisClient.del.mockResolvedValue(2);
      (service as any).isConnected = true;

      const result = await service.deletePattern('patient:*');

      expect(result).toBe(2);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('scheduling:patient:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        'scheduling:patient:1',
        'scheduling:patient:2'
      );
    });

    it('should return 0 if no keys found', async () => {
      mockRedisClient.keys.mockResolvedValue([]);
      (service as any).isConnected = true;

      const result = await service.deletePattern('non-existent:*');

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      (service as any).isConnected = true;

      const result = await service.exists('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('scheduling:test-key');
    });

    it('should return false if key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);
      (service as any).isConnected = true;

      const result = await service.exists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));
      (service as any).isConnected = true;

      const fetchFn = jest.fn();
      const result = await service.getOrSet('test-key', fetchFn);

      expect(result).toEqual(testData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not exists', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setex.mockResolvedValue('OK');
      (service as any).isConnected = true;

      const fetchFn = jest.fn().mockResolvedValue(testData);
      const result = await service.getOrSet('test-key', fetchFn);

      expect(result).toEqual(testData);
      expect(fetchFn).toHaveBeenCalled();
      expect(mockRedisClient.setex).toHaveBeenCalled();
    });
  });

  describe('flushAll', () => {
    it('should flush all cache', async () => {
      mockRedisClient.flushall.mockResolvedValue('OK');
      (service as any).isConnected = true;

      const result = await service.flushAll();

      expect(result).toBe(true);
      expect(mockRedisClient.flushall).toHaveBeenCalled();
    });
  });
});

