/**
 * Integration Tests for Health Check System
 * Tests the comprehensive health monitoring and circuit breaker functionality
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready Testing
 */

import request from 'supertest';
import { IdentityServiceHealthCheck, HealthStatus } from '../../infrastructure/monitoring/HealthChecks';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';

describe('Health Check Integration Tests', () => {
  let healthCheck: IdentityServiceHealthCheck;
  
  const mockSupabaseUrl = 'https://test.supabase.co';
  const mockSupabaseKey = 'test-key';
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  beforeEach(() => {
    healthCheck = new IdentityServiceHealthCheck(
      mockSupabaseUrl,
      mockSupabaseKey,
      mockLogger
    );
    
    // Reset circuit breakers
    CircuitBreakerFactory.getAllBreakers().clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Comprehensive Health Check', () => {
    it('should return healthy status when all components are operational', async () => {
      // Mock successful Supabase responses
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ count: 1 }],
              error: null
            })
          })
        })
      };

      // Replace the Supabase client in healthCheck
      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await healthCheck.checkHealth();

      expect(result.overall).toBe(HealthStatus.HEALTHY);
      expect(result.components.database.status).toBe(HealthStatus.HEALTHY);
      expect(result.components.authentication.status).toBe(HealthStatus.HEALTHY);
      expect(result.components.authorization.status).toBe(HealthStatus.HEALTHY);
      expect(result.components.sessions.status).toBe(HealthStatus.HEALTHY);
      expect(result.components.audit.status).toBe(HealthStatus.HEALTHY);
      expect(result.components.circuitBreakers.status).toBe(HealthStatus.HEALTHY);
    });

    it('should return degraded status when response times are slow', async () => {
      // Mock slow Supabase responses
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockImplementation(() => {
              return new Promise(resolve => {
                setTimeout(() => {
                  resolve({
                    data: [{ count: 1 }],
                    error: null
                  });
                }, 1500); // Slow response
              });
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await healthCheck.checkHealth();

      expect(result.overall).toBe(HealthStatus.DEGRADED);
      expect(result.components.database.responseTime).toBeGreaterThan(1000);
    });

    it('should return unhealthy status when database is unavailable', async () => {
      // Mock database error
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await healthCheck.checkHealth();

      expect(result.overall).toBe(HealthStatus.UNHEALTHY);
      expect(result.components.database.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.components.database.error).toContain('Database connection failed');
    });

    it('should include circuit breaker status in health check', async () => {
      // Create a circuit breaker and open it
      const breaker = CircuitBreakerFactory.getBreaker('test-service');
      
      // Simulate failures to open the circuit
      for (let i = 0; i < 6; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('Test failure')));
        } catch (error) {
          // Expected to fail
        }
      }

      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ count: 1 }],
              error: null
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await healthCheck.checkHealth();

      expect(result.components.circuitBreakers.status).toBe(HealthStatus.DEGRADED);
      expect(result.components.circuitBreakers.details.openBreakers).toBe(1);
    });

    it('should handle complete health check failure gracefully', async () => {
      // Mock complete failure
      const mockSupabaseClient = {
        from: jest.fn().mockImplementation(() => {
          throw new Error('Complete system failure');
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await healthCheck.checkHealth();

      expect(result.overall).toBe(HealthStatus.UNHEALTHY);
      expect(result.metadata.version).toBe('2.0.0');
      expect(result.metadata.environment).toBeDefined();
    });
  });

  describe('Individual Component Health Checks', () => {
    it('should validate database connectivity', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ count: 1 }],
              error: null
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await (healthCheck as any).checkDatabase();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.details.connectionPool).toBe('active');
      expect(result.details.schema).toBe('auth_schema');
      expect(result.responseTime).toBeLessThan(1000);
    });

    it('should validate authentication service', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 1, role_name: 'admin' }],
              error: null
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await (healthCheck as any).checkAuthentication();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.details.rolesAccessible).toBe(true);
      expect(result.details.authEndpoints).toBe('available');
    });

    it('should validate authorization service', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 1, permission_name: 'read_patient_data' }],
              error: null
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await (healthCheck as any).checkAuthorization();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.details.permissionsAccessible).toBe(true);
      expect(result.details.rbacSystem).toBe('operational');
    });

    it('should validate session management', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ count: 5 }],
              error: null
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await (healthCheck as any).checkSessions();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.details.sessionTableAccessible).toBe(true);
      expect(result.details.sessionManagement).toBe('operational');
    });

    it('should validate audit logging', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ count: 100 }],
              error: null
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await (healthCheck as any).checkAudit();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.details.auditLogsAccessible).toBe(true);
      expect(result.details.hipaaCompliance).toBe('active');
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should report circuit breaker status correctly', async () => {
      // Create multiple circuit breakers
      const breaker1 = CircuitBreakerFactory.getBreaker('service-1');
      const breaker2 = CircuitBreakerFactory.getBreaker('service-2');

      // Open one circuit breaker
      for (let i = 0; i < 6; i++) {
        try {
          await breaker1.execute(() => Promise.reject(new Error('Test failure')));
        } catch (error) {
          // Expected to fail
        }
      }

      const result = await (healthCheck as any).checkCircuitBreakers();

      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(result.details.totalBreakers).toBe(2);
      expect(result.details.openBreakers).toBe(1);
    });

    it('should report healthy when all circuit breakers are closed', async () => {
      const breaker = CircuitBreakerFactory.getBreaker('healthy-service');

      // Execute successful operations
      await breaker.execute(() => Promise.resolve('success'));

      const result = await (healthCheck as any).checkCircuitBreakers();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.details.openBreakers).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockImplementation(() => {
              return new Promise((_, reject) => {
                setTimeout(() => {
                  reject(new Error('Network timeout'));
                }, 100);
              });
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await healthCheck.checkHealth();

      expect(result.overall).toBe(HealthStatus.UNHEALTHY);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should provide meaningful error messages', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Table does not exist', code: 'PGRST106' }
            })
          })
        })
      };

      (healthCheck as any).supabaseClient = mockSupabaseClient;

      const result = await healthCheck.checkHealth();

      expect(result.components.database.error).toContain('Table does not exist');
    });
  });
});
