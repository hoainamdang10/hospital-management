import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';

describe('DedupKey Value Object', () => {
  describe('create', () => {
    it('should create valid deduplication key', () => {
      const dedupKey = DedupKey.create('test-dedup-key');
      expect(dedupKey).toBeDefined();
      expect(dedupKey.getValue()).toBe('test-dedup-key');
    });

    it('should trim whitespace', () => {
      const dedupKey = DedupKey.create('  test-dedup-key  ');
      expect(dedupKey.getValue()).toBe('test-dedup-key');
    });

    it('should throw error for empty string', () => {
      expect(() => DedupKey.create('')).toThrow('Deduplication key cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => DedupKey.create('   ')).toThrow('Deduplication key cannot be empty');
    });

    it('should throw error for key exceeding 255 characters', () => {
      const longKey = 'a'.repeat(256);
      expect(() => DedupKey.create(longKey)).toThrow('Deduplication key cannot exceed 255 characters');
    });

    it('should allow key with exactly 255 characters', () => {
      const maxKey = 'a'.repeat(255);
      const dedupKey = DedupKey.create(maxKey);
      expect(dedupKey.getValue()).toBe(maxKey);
    });

    it('should allow special characters', () => {
      const dedupKey = DedupKey.create('test@dedup#key$123');
      expect(dedupKey.getValue()).toBe('test@dedup#key$123');
    });

    it('should allow spaces', () => {
      const dedupKey = DedupKey.create('test dedup key');
      expect(dedupKey.getValue()).toBe('test dedup key');
    });

    it('should allow colons', () => {
      const dedupKey = DedupKey.create('tenant:schedule:123');
      expect(dedupKey.getValue()).toBe('tenant:schedule:123');
    });
  });

  describe('fromParts', () => {
    it('should create dedup key from parts', () => {
      const parts = ['tenant-1', 'schedule-123', 'run-456'];
      const dedupKey = DedupKey.fromParts(parts);
      
      expect(dedupKey.getValue()).toBe('tenant-1:schedule-123:run-456');
    });

    it('should create dedup key from single part', () => {
      const parts = ['single-part'];
      const dedupKey = DedupKey.fromParts(parts);
      
      expect(dedupKey.getValue()).toBe('single-part');
    });

    it('should create dedup key from two parts', () => {
      const parts = ['part1', 'part2'];
      const dedupKey = DedupKey.fromParts(parts);
      
      expect(dedupKey.getValue()).toBe('part1:part2');
    });

    it('should throw error for empty parts array', () => {
      expect(() => DedupKey.fromParts([])).toThrow('Cannot create deduplication key from empty parts');
    });

    it('should handle parts with special characters', () => {
      const parts = ['tenant@123', 'schedule#456'];
      const dedupKey = DedupKey.fromParts(parts);
      
      expect(dedupKey.getValue()).toBe('tenant@123:schedule#456');
    });

    it('should throw error if combined parts exceed 255 characters', () => {
      const longPart = 'a'.repeat(200);
      const parts = [longPart, longPart];
      
      expect(() => DedupKey.fromParts(parts)).toThrow('Deduplication key cannot exceed 255 characters');
    });
  });

  describe('getValue', () => {
    it('should return the dedup key value', () => {
      const value = 'test-dedup-key';
      const dedupKey = DedupKey.create(value);
      expect(dedupKey.getValue()).toBe(value);
    });
  });

  describe('equals', () => {
    it('should return true for equal dedup keys', () => {
      const dedupKey1 = DedupKey.create('test-dedup-key');
      const dedupKey2 = DedupKey.create('test-dedup-key');
      expect(dedupKey1.equals(dedupKey2)).toBe(true);
    });

    it('should return false for different dedup keys', () => {
      const dedupKey1 = DedupKey.create('test-dedup-key-1');
      const dedupKey2 = DedupKey.create('test-dedup-key-2');
      expect(dedupKey1.equals(dedupKey2)).toBe(false);
    });

    it('should handle whitespace differences', () => {
      const dedupKey1 = DedupKey.create('test-dedup-key');
      const dedupKey2 = DedupKey.create('  test-dedup-key  ');
      expect(dedupKey1.equals(dedupKey2)).toBe(true);
    });

    it('should be case-sensitive', () => {
      const dedupKey1 = DedupKey.create('test-dedup-key');
      const dedupKey2 = DedupKey.create('TEST-DEDUP-KEY');
      expect(dedupKey1.equals(dedupKey2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the dedup key value as string', () => {
      const value = 'test-dedup-key';
      const dedupKey = DedupKey.create(value);
      expect(dedupKey.toString()).toBe(value);
    });
  });

  describe('edge cases', () => {
    it('should handle single character key', () => {
      const dedupKey = DedupKey.create('a');
      expect(dedupKey.getValue()).toBe('a');
    });

    it('should handle numeric-only key', () => {
      const dedupKey = DedupKey.create('123456');
      expect(dedupKey.getValue()).toBe('123456');
    });

    it('should handle UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const dedupKey = DedupKey.create(uuid);
      expect(dedupKey.getValue()).toBe(uuid);
    });

    it('should handle composite key with multiple separators', () => {
      const dedupKey = DedupKey.create('tenant:schedule:run:2025-01-15');
      expect(dedupKey.getValue()).toBe('tenant:schedule:run:2025-01-15');
    });

    it('should handle key with newlines', () => {
      const dedupKey = DedupKey.create('test\ndedup\nkey');
      expect(dedupKey.getValue()).toBe('test\ndedup\nkey');
    });

    it('should handle key with tabs', () => {
      const dedupKey = DedupKey.create('test\tdedup\tkey');
      expect(dedupKey.getValue()).toBe('test\tdedup\tkey');
    });
  });

  describe('use cases', () => {
    it('should create dedup key for schedule', () => {
      const parts = ['tenant-123', 'schedule-456'];
      const dedupKey = DedupKey.fromParts(parts);
      
      expect(dedupKey.getValue()).toBe('tenant-123:schedule-456');
    });

    it('should create dedup key for schedule run', () => {
      const parts = ['tenant-123', 'schedule-456', 'run-789'];
      const dedupKey = DedupKey.fromParts(parts);
      
      expect(dedupKey.getValue()).toBe('tenant-123:schedule-456:run-789');
    });

    it('should create dedup key with timestamp', () => {
      const timestamp = new Date('2025-01-15T10:00:00Z').toISOString();
      const parts = ['tenant-123', 'schedule-456', timestamp];
      const dedupKey = DedupKey.fromParts(parts);
      
      expect(dedupKey.getValue()).toContain('tenant-123:schedule-456:');
      expect(dedupKey.getValue()).toContain('2025-01-15');
    });
  });
});

