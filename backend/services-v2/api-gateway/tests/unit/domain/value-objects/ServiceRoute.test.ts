import { ServiceRoute } from '@domain/value-objects/ServiceRoute';

describe('ServiceRoute Value Object', () => {
  const validProps = {
    serviceName: 'patient-registry-service',
    baseUrl: 'http://patient-registry-service:3003',
    pathPrefix: '/api/v1/patients',
    requiresAuth: true,
    requiredPermissions: ['patient:read'],
    requiredRoles: ['doctor', 'nurse']
  };

  describe('create', () => {
    it('should create a valid ServiceRoute', () => {
      const route = ServiceRoute.create(validProps);
      expect(route.serviceName).toBe(validProps.serviceName);
      expect(route.baseUrl).toBe(validProps.baseUrl);
      expect(route.pathPrefix).toBe(validProps.pathPrefix);
      expect(route.requiresAuth).toBe(true);
    });

    it('should throw error for empty serviceName', () => {
      expect(() => ServiceRoute.create({ ...validProps, serviceName: '' }))
        .toThrow('Service name cannot be empty');
    });

    it('should throw error for empty baseUrl', () => {
      expect(() => ServiceRoute.create({ ...validProps, baseUrl: '' }))
        .toThrow('Base URL cannot be empty');
    });

    it('should throw error for invalid baseUrl', () => {
      expect(() => ServiceRoute.create({ ...validProps, baseUrl: 'invalid-url' }))
        .toThrow('Invalid base URL format');
    });

    it('should throw error for empty pathPrefix', () => {
      expect(() => ServiceRoute.create({ ...validProps, pathPrefix: '' }))
        .toThrow('Path prefix cannot be empty');
    });

    it('should throw error for pathPrefix not starting with /', () => {
      expect(() => ServiceRoute.create({ ...validProps, pathPrefix: 'api/v1/patients' }))
        .toThrow('Path prefix must start with /');
    });

    it('should create route without permissions and roles', () => {
      const route = ServiceRoute.create({
        serviceName: 'identity-service',
        baseUrl: 'http://identity-service:3001',
        pathPrefix: '/api/v1/auth',
        requiresAuth: false
      });
      expect(route.requiresAuth).toBe(false);
    });
  });

  describe('matchesPath', () => {
    it('should match path with exact prefix', () => {
      const route = ServiceRoute.create(validProps);
      expect(route.matchesPath('/api/v1/patients')).toBe(true);
    });

    it('should match path with prefix and additional segments', () => {
      const route = ServiceRoute.create(validProps);
      expect(route.matchesPath('/api/v1/patients/123')).toBe(true);
      expect(route.matchesPath('/api/v1/patients/123/appointments')).toBe(true);
    });

    it('should not match path with different prefix', () => {
      const route = ServiceRoute.create(validProps);
      expect(route.matchesPath('/api/v1/providers')).toBe(false);
    });

    it('should not match path with partial prefix', () => {
      const route = ServiceRoute.create(validProps);
      expect(route.matchesPath('/api/v1/patient')).toBe(false);
    });
  });

  describe('getTargetUrl', () => {
    it('should return target URL for exact prefix', () => {
      const route = ServiceRoute.create(validProps);
      const targetUrl = route.getTargetUrl('/api/v1/patients');
      expect(targetUrl).toBe('http://patient-registry-service:3003');
    });

    it('should return target URL with additional path segments', () => {
      const route = ServiceRoute.create(validProps);
      const targetUrl = route.getTargetUrl('/api/v1/patients/123');
      expect(targetUrl).toBe('http://patient-registry-service:3003/123');
    });

    it('should return target URL with query parameters', () => {
      const route = ServiceRoute.create(validProps);
      const targetUrl = route.getTargetUrl('/api/v1/patients?page=1&limit=10');
      expect(targetUrl).toBe('http://patient-registry-service:3003?page=1&limit=10');
    });

    it('should handle nested paths correctly', () => {
      const route = ServiceRoute.create(validProps);
      const targetUrl = route.getTargetUrl('/api/v1/patients/123/appointments/456');
      expect(targetUrl).toBe('http://patient-registry-service:3003/123/appointments/456');
    });
  });
});

