import { TenantId } from '../../../../src/domain/value-objects/TenantId';

describe('TenantId Value Object', () => {
  describe('create', () => {
    it('should create valid tenant ID', () => {
      const tenantId = TenantId.create('test-tenant');
      expect(tenantId).toBeDefined();
      expect(tenantId.getValue()).toBe('test-tenant');
    });

    it('should create tenant ID with alphanumeric characters', () => {
      const tenantId = TenantId.create('tenant123');
      expect(tenantId.getValue()).toBe('tenant123');
    });

    it('should create tenant ID with hyphens', () => {
      const tenantId = TenantId.create('test-tenant-123');
      expect(tenantId.getValue()).toBe('test-tenant-123');
    });

    it('should create tenant ID with underscores', () => {
      const tenantId = TenantId.create('test_tenant_123');
      expect(tenantId.getValue()).toBe('test_tenant_123');
    });

    it('should trim whitespace', () => {
      const tenantId = TenantId.create('  test-tenant  ');
      expect(tenantId.getValue()).toBe('test-tenant');
    });

    it('should throw error for empty string', () => {
      expect(() => TenantId.create('')).toThrow('Tenant ID cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => TenantId.create('   ')).toThrow('Tenant ID cannot be empty');
    });

    it('should throw error for ID exceeding 100 characters', () => {
      const longId = 'a'.repeat(101);
      expect(() => TenantId.create(longId)).toThrow('Tenant ID cannot exceed 100 characters');
    });

    it('should allow ID with exactly 100 characters', () => {
      const maxId = 'a'.repeat(100);
      const tenantId = TenantId.create(maxId);
      expect(tenantId.getValue()).toBe(maxId);
    });

    it('should throw error for invalid characters (spaces)', () => {
      expect(() => TenantId.create('test tenant')).toThrow('Tenant ID can only contain alphanumeric characters, hyphens, and underscores');
    });

    it('should throw error for invalid characters (special chars)', () => {
      expect(() => TenantId.create('test@tenant')).toThrow('Tenant ID can only contain alphanumeric characters, hyphens, and underscores');
    });

    it('should throw error for invalid characters (dots)', () => {
      expect(() => TenantId.create('test.tenant')).toThrow('Tenant ID can only contain alphanumeric characters, hyphens, and underscores');
    });
  });

  describe('getValue', () => {
    it('should return the tenant ID value', () => {
      const value = 'test-tenant';
      const tenantId = TenantId.create(value);
      expect(tenantId.getValue()).toBe(value);
    });
  });

  describe('equals', () => {
    it('should return true for equal tenant IDs', () => {
      const tenantId1 = TenantId.create('test-tenant');
      const tenantId2 = TenantId.create('test-tenant');
      expect(tenantId1.equals(tenantId2)).toBe(true);
    });

    it('should return false for different tenant IDs', () => {
      const tenantId1 = TenantId.create('test-tenant-1');
      const tenantId2 = TenantId.create('test-tenant-2');
      expect(tenantId1.equals(tenantId2)).toBe(false);
    });

    it('should handle whitespace differences', () => {
      const tenantId1 = TenantId.create('test-tenant');
      const tenantId2 = TenantId.create('  test-tenant  ');
      expect(tenantId1.equals(tenantId2)).toBe(true);
    });

    it('should be case-sensitive', () => {
      const tenantId1 = TenantId.create('test-tenant');
      const tenantId2 = TenantId.create('TEST-TENANT');
      expect(tenantId1.equals(tenantId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the tenant ID value as string', () => {
      const value = 'test-tenant';
      const tenantId = TenantId.create(value);
      expect(tenantId.toString()).toBe(value);
    });
  });

  describe('edge cases', () => {
    it('should handle single character ID', () => {
      const tenantId = TenantId.create('a');
      expect(tenantId.getValue()).toBe('a');
    });

    it('should handle numeric-only ID', () => {
      const tenantId = TenantId.create('123456');
      expect(tenantId.getValue()).toBe('123456');
    });

    it('should handle mixed case ID', () => {
      const tenantId = TenantId.create('TestTenant123');
      expect(tenantId.getValue()).toBe('TestTenant123');
    });

    it('should handle ID starting with number', () => {
      const tenantId = TenantId.create('123-tenant');
      expect(tenantId.getValue()).toBe('123-tenant');
    });

    it('should handle ID ending with hyphen', () => {
      const tenantId = TenantId.create('tenant-');
      expect(tenantId.getValue()).toBe('tenant-');
    });

    it('should handle ID ending with underscore', () => {
      const tenantId = TenantId.create('tenant_');
      expect(tenantId.getValue()).toBe('tenant_');
    });
  });
});

