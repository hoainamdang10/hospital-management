/**
 * Circuit Breaker Service Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { CircuitBreakerService } from '../../../src/infrastructure/resilience/CircuitBreakerService';
import axios from 'axios';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(() => {
    service = new CircuitBreakerService();
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('execute', () => {
    it('should execute function successfully', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await service.execute('test-service', mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle function errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        service.execute('test-service', mockFn)
      ).rejects.toThrow('Test error');
    });

    it('should open circuit after threshold errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service down'));

      for (let i = 0; i < 10; i++) {
        try {
          await service.execute('test-service', mockFn, {
            errorThresholdPercentage: 50,
            rollingCountTimeout: 1000
          });
        } catch (error) {
          // Expected
        }
      }

      const status = service.getStatus('test-service');
      expect(status).not.toBeNull();
      expect(status?.isOpen || status?.isHalfOpen).toBe(true);
    });

    it('should timeout long-running functions', async () => {
      const mockFn = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );

      await expect(
        service.execute('test-service', mockFn, { timeout: 100 })
      ).rejects.toThrow();
    });
  });

  describe('executeGet', () => {
    it('should execute GET request with circuit breaker', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ data: { id: 1 } })
      } as any;

      const result = await service.executeGet(
        'test-service',
        mockClient,
        '/api/test'
      );

      expect(result.data).toEqual({ id: 1 });
      expect(mockClient.get).toHaveBeenCalledWith('/api/test');
    });
  });

  describe('getStatus', () => {
    it('should return null for non-existent breaker', () => {
      const status = service.getStatus('non-existent');
      expect(status).toBeNull();
    });

    it('should return status for existing breaker', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      await service.execute('test-service', mockFn);

      const status = service.getStatus('test-service');
      expect(status).not.toBeNull();
      expect(status?.isClosed).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));

      for (let i = 0; i < 10; i++) {
        try {
          await service.execute('test-service', mockFn, {
            errorThresholdPercentage: 50
          });
        } catch (error) {
          // Expected
        }
      }

      service.reset('test-service');

      const status = service.getStatus('test-service');
      expect(status?.isClosed).toBe(true);
    });
  });

  describe('getAllStatuses', () => {
    it('should return all circuit breaker statuses', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      await service.execute('service-1', mockFn);
      await service.execute('service-2', mockFn);

      const statuses = service.getAllStatuses();
      expect(statuses.size).toBe(2);
      expect(statuses.has('service-1')).toBe(true);
      expect(statuses.has('service-2')).toBe(true);
    });
  });
});

