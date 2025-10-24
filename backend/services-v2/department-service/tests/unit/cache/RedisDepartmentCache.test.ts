/**
 * Redis Department Cache - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RedisDepartmentCache } from '../../../src/infrastructure/cache/RedisDepartmentCache';
import { Department, DepartmentProps } from '../../../src/domain/entities/Department';

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    on: jest.fn(),
    isOpen: false
  }))
}));

describe('RedisDepartmentCache - Unit Tests', () => {
  let cache: any;
  let mockClient: any;
  let testDepartment: Department;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get mock client
    const redis = require('redis');
    mockClient = redis.createClient();
    mockClient.isOpen = false;

    // Create cache instance
    cache = new RedisDepartmentCache('redis://localhost:6380');

    // Replace the client with our mock
    (cache as any).client = mockClient;

    // Create test department
    const props: DepartmentProps = {
      departmentCode: 'CARD',
      departmentNameEn: 'Cardiology',
      departmentNameVi: 'Tim mạch',
      description: 'Cardiology department',
      phone: '0123456789',
      email: 'cardiology@hospital.com',
      location: 'Building A',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      createdBy: 'admin',
      updatedBy: 'admin'
    };

    testDepartment = Department.create(props, 'test-id-123');
  });

  describe('connect', () => {
    it('should connect to Redis', async () => {
      mockClient.isOpen = false;

      await cache.connect();

      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should not reconnect if already connected', async () => {
      mockClient.isOpen = true;

      await cache.connect();

      expect(mockClient.connect).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis', async () => {
      mockClient.isOpen = true;

      await cache.disconnect();

      expect(mockClient.quit).toHaveBeenCalled();
    });

    it('should not disconnect if not connected', async () => {
      mockClient.isOpen = false;

      await cache.disconnect();

      expect(mockClient.quit).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return department from cache', async () => {
      const cachedData = JSON.stringify(testDepartment.toJSON());
      mockClient.get.mockResolvedValue(cachedData);

      const result = await cache.get('test-id-123');

      expect(mockClient.get).toHaveBeenCalledWith('department:test-id-123');
      expect(result).toBeInstanceOf(Department);
      expect(result?.id).toBe('test-id-123');
      expect(result?.code).toBe('CARD');
    });

    it('should return null if not in cache', async () => {
      mockClient.get.mockResolvedValue(null);

      const result = await cache.get('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await cache.get('test-id-123');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set department in cache with TTL', async () => {
      await cache.set('test-id-123', testDepartment);

      expect(mockClient.setEx).toHaveBeenCalledWith(
        'department:test-id-123',
        86400, // 24 hours
        expect.any(String)
      );
    });

    it('should serialize department correctly', async () => {
      await cache.set('test-id-123', testDepartment);

      const serializedData = mockClient.setEx.mock.calls[0][2];
      const parsed = JSON.parse(serializedData);

      expect(parsed.id).toBe('test-id-123');
      expect(parsed.code).toBe('CARD');
      expect(parsed.nameEn).toBe('Cardiology');
    });

    it('should handle errors gracefully', async () => {
      mockClient.setEx.mockRejectedValue(new Error('Redis error'));

      await expect(cache.set('test-id-123', testDepartment)).resolves.not.toThrow();
    });
  });

  describe('getAll', () => {
    it('should return all departments from cache', async () => {
      const departments = [testDepartment];
      const cachedData = JSON.stringify(departments.map(d => d.toJSON()));
      mockClient.get.mockResolvedValue(cachedData);

      const result = await cache.getAll();

      expect(mockClient.get).toHaveBeenCalledWith('departments:all');
      expect(result).toHaveLength(1);
      expect(result?.[0]).toBeInstanceOf(Department);
      expect(result?.[0].code).toBe('CARD');
    });

    it('should return null if not in cache', async () => {
      mockClient.get.mockResolvedValue(null);

      const result = await cache.getAll();

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await cache.getAll();

      expect(result).toBeNull();
    });
  });

  describe('setAll', () => {
    it('should set all departments in cache with TTL', async () => {
      const departments = [testDepartment];

      await cache.setAll(departments);

      expect(mockClient.setEx).toHaveBeenCalledWith(
        'departments:all',
        86400,
        expect.any(String)
      );
    });

    it('should serialize all departments correctly', async () => {
      const departments = [testDepartment];

      await cache.setAll(departments);

      const serializedData = mockClient.setEx.mock.calls[0][2];
      const parsed = JSON.parse(serializedData);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].code).toBe('CARD');
    });

    it('should handle errors gracefully', async () => {
      mockClient.setEx.mockRejectedValue(new Error('Redis error'));

      await expect(cache.setAll([testDepartment])).resolves.not.toThrow();
    });
  });

  describe('invalidate', () => {
    it('should delete department from cache', async () => {
      await cache.invalidate('test-id-123');

      expect(mockClient.del).toHaveBeenCalledWith('department:test-id-123');
    });

    it('should also invalidate all departments cache', async () => {
      await cache.invalidate('test-id-123');

      expect(mockClient.del).toHaveBeenCalledWith('departments:all');
    });

    it('should handle errors gracefully', async () => {
      mockClient.del.mockRejectedValue(new Error('Redis error'));

      await expect(cache.invalidate('test-id-123')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all department caches', async () => {
      mockClient.keys.mockResolvedValue(['department:1', 'department:2']);

      await cache.clear();

      expect(mockClient.keys).toHaveBeenCalledWith('department:*');
      expect(mockClient.del).toHaveBeenCalledWith(['department:1', 'department:2']);
      expect(mockClient.del).toHaveBeenCalledWith('departments:all');
    });

    it('should handle empty cache', async () => {
      mockClient.keys.mockResolvedValue([]);

      await cache.clear();

      expect(mockClient.del).toHaveBeenCalledTimes(1); // Only for 'departments:all'
    });

    it('should handle errors gracefully', async () => {
      mockClient.keys.mockRejectedValue(new Error('Redis error'));

      await expect(cache.clear()).resolves.not.toThrow();
    });
  });

  describe('data integrity', () => {
    it('should preserve Vietnamese characters', async () => {
      const cachedData = JSON.stringify(testDepartment.toJSON());
      mockClient.get.mockResolvedValue(cachedData);

      const result = await cache.get('test-id-123');

      expect(result?.nameVi).toBe('Tim mạch');
    });

    it('should preserve optional fields', async () => {
      const cachedData = JSON.stringify(testDepartment.toJSON());
      mockClient.get.mockResolvedValue(cachedData);

      const result = await cache.get('test-id-123');

      expect(result?.description).toBe('Cardiology department');
      expect(result?.phone).toBe('0123456789');
      expect(result?.email).toBe('cardiology@hospital.com');
      expect(result?.location).toBe('Building A');
    });

    it('should preserve dates correctly', async () => {
      const cachedData = JSON.stringify(testDepartment.toJSON());
      mockClient.get.mockResolvedValue(cachedData);

      const result = await cache.get('test-id-123');

      expect(result?.createdAt).toEqual(new Date('2025-01-01'));
      expect(result?.updatedAt).toEqual(new Date('2025-01-01'));
    });
  });
});
