/**
 * NotificationId Value Object Unit Tests
 * Tests for Vietnamese healthcare notification ID format and validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Domain-Driven Design
 */

import { NotificationId } from '../../../../src/domain/value-objects/NotificationId';

describe('NotificationId', () => {
  describe('Creation', () => {
    it('should create new notification ID with correct format', () => {
      const notificationId = NotificationId.create();
      
      expect(notificationId).toBeInstanceOf(NotificationId);
      expect(notificationId.getValue()).toMatch(/^NOT-\d{6}-\d{6}$/);
    });

    it('should create notification ID from valid string', () => {
      const idString = 'NOT-202401-000001';
      const notificationId = NotificationId.fromString(idString);
      
      expect(notificationId.getValue()).toBe(idString);
    });

    it('should throw error for invalid format', () => {
      const invalidIds = [
        'INVALID-202401-000001',
        'NOT-2024-000001',
        'NOT-202401-00001',
        'NOT-202401-0000001',
        'not-202401-000001',
        'NOT202401000001',
        ''
      ];

      invalidIds.forEach(invalidId => {
        expect(() => {
          NotificationId.fromString(invalidId);
        }).toThrow(`ID thông báo không hợp lệ: ${invalidId}`);
      });
    });

    it('should create batch of notification IDs', () => {
      const count = 5;
      const notificationIds = NotificationId.createBatch(count);
      
      expect(notificationIds).toHaveLength(count);
      
      // All IDs should be unique
      const uniqueIds = new Set(notificationIds.map(id => id.getValue()));
      expect(uniqueIds.size).toBe(count);
      
      // All IDs should have correct format
      notificationIds.forEach(id => {
        expect(id.getValue()).toMatch(/^NOT-\d{6}-\d{6}$/);
      });
    });

    it('should generate next sequence ID', () => {
      const baseId = 'NOT-202401-000001';
      const nextId = NotificationId.getNextSequence(baseId);
      
      expect(nextId).toBe('NOT-202401-000002');
    });

    it('should handle sequence overflow correctly', () => {
      const maxId = 'NOT-202401-999999';
      const nextId = NotificationId.getNextSequence(maxId);
      
      // Should wrap to next month or handle overflow
      expect(nextId).toMatch(/^NOT-\d{6}-\d{6}$/);
      expect(nextId).not.toBe(maxId);
    });
  });

  describe('Vietnamese Healthcare Context', () => {
    it('should extract year and month from ID', () => {
      const notificationId = NotificationId.fromString('NOT-202401-000001');
      
      expect(notificationId.getYear()).toBe(2024);
      expect(notificationId.getMonth()).toBe(1);
    });

    it('should get Vietnamese month name', () => {
      const testCases = [
        { id: 'NOT-202401-000001', expected: 'Tháng 1' },
        { id: 'NOT-202402-000001', expected: 'Tháng 2' },
        { id: 'NOT-202412-000001', expected: 'Tháng 12' }
      ];

      testCases.forEach(({ id, expected }) => {
        const notificationId = NotificationId.fromString(id);
        expect(notificationId.getVietnameseMonth()).toBe(expected);
      });
    });

    it('should format for Vietnamese display', () => {
      const notificationId = NotificationId.fromString('NOT-202401-000001');
      const display = notificationId.toVietnameseDisplay();
      
      expect(display).toBe('Thông báo số 000001 - Tháng 1/2024');
    });

    it('should calculate age in days', () => {
      // Mock current date to 2024-01-20
      const mockDate = new Date('2024-01-20T10:00:00.000Z');
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      
      const notificationId = NotificationId.fromString('NOT-202401-000001');
      const age = notificationId.getAgeInDays();
      
      // Age should be calculated from creation date (2024-01-15 based on setup)
      expect(age).toBe(5);
      
      jest.restoreAllMocks();
    });

    it('should check if notification is recent', () => {
      const recentId = NotificationId.create(); // Created now
      const oldId = NotificationId.fromString('NOT-202312-000001'); // December 2023
      
      expect(recentId.isRecent(7)).toBe(true); // Within 7 days
      expect(oldId.isRecent(7)).toBe(false); // Older than 7 days
    });

    it('should generate Vietnamese description', () => {
      const notificationId = NotificationId.fromString('NOT-202401-000001');
      const description = notificationId.getVietnameseDescription();
      
      expect(description).toContain('Thông báo');
      expect(description).toContain('Tháng 1');
      expect(description).toContain('2024');
    });
  });

  describe('Validation', () => {
    it('should validate notification ID format', () => {
      const validIds = [
        'NOT-202401-000001',
        'NOT-202412-999999',
        'NOT-202506-123456'
      ];

      validIds.forEach(id => {
        expect(() => {
          NotificationId.fromString(id);
        }).not.toThrow();
      });
    });

    it('should reject invalid year formats', () => {
      const invalidYearIds = [
        'NOT-24-000001', // 2-digit year
        'NOT-20241-000001', // 5-digit year
        'NOT-abcd01-000001' // Non-numeric year
      ];

      invalidYearIds.forEach(id => {
        expect(() => {
          NotificationId.fromString(id);
        }).toThrow();
      });
    });

    it('should reject invalid month formats', () => {
      const invalidMonthIds = [
        'NOT-202400-000001', // Month 00
        'NOT-202413-000001', // Month 13
        'NOT-2024ab-000001' // Non-numeric month
      ];

      invalidMonthIds.forEach(id => {
        expect(() => {
          NotificationId.fromString(id);
        }).toThrow();
      });
    });

    it('should reject invalid sequence formats', () => {
      const invalidSequenceIds = [
        'NOT-202401-00001', // 5 digits
        'NOT-202401-0000001', // 7 digits
        'NOT-202401-abcdef' // Non-numeric sequence
      ];

      invalidSequenceIds.forEach(id => {
        expect(() => {
          NotificationId.fromString(id);
        }).toThrow();
      });
    });

    it('should validate business rules for notification IDs', () => {
      const notificationId = NotificationId.fromString('NOT-202401-000001');
      
      // Should not allow future dates
      const futureId = 'NOT-202501-000001'; // January 2025
      expect(() => {
        NotificationId.fromString(futureId);
      }).toThrow('Không thể tạo ID thông báo cho tháng trong tương lai');
    });
  });

  describe('Equality and Comparison', () => {
    it('should implement value equality correctly', () => {
      const id1 = NotificationId.fromString('NOT-202401-000001');
      const id2 = NotificationId.fromString('NOT-202401-000001');
      const id3 = NotificationId.fromString('NOT-202401-000002');
      
      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });

    it('should compare notification IDs chronologically', () => {
      const earlierId = NotificationId.fromString('NOT-202401-000001');
      const laterId = NotificationId.fromString('NOT-202401-000002');
      const muchLaterId = NotificationId.fromString('NOT-202402-000001');
      
      expect(earlierId.isOlderThan(laterId)).toBe(true);
      expect(laterId.isOlderThan(earlierId)).toBe(false);
      expect(earlierId.isOlderThan(muchLaterId)).toBe(true);
    });

    it('should sort notification IDs correctly', () => {
      const ids = [
        NotificationId.fromString('NOT-202401-000003'),
        NotificationId.fromString('NOT-202401-000001'),
        NotificationId.fromString('NOT-202402-000001'),
        NotificationId.fromString('NOT-202401-000002')
      ];
      
      const sortedIds = ids.sort((a, b) => a.compareTo(b));
      
      expect(sortedIds[0].getValue()).toBe('NOT-202401-000001');
      expect(sortedIds[1].getValue()).toBe('NOT-202401-000002');
      expect(sortedIds[2].getValue()).toBe('NOT-202401-000003');
      expect(sortedIds[3].getValue()).toBe('NOT-202402-000001');
    });
  });

  describe('Serialization', () => {
    it('should serialize to string correctly', () => {
      const notificationId = NotificationId.fromString('NOT-202401-000001');
      
      expect(notificationId.toString()).toBe('NOT-202401-000001');
      expect(notificationId.getValue()).toBe('NOT-202401-000001');
    });

    it('should serialize to JSON correctly', () => {
      const notificationId = NotificationId.fromString('NOT-202401-000001');
      const json = JSON.stringify(notificationId);
      
      expect(json).toBe('"NOT-202401-000001"');
    });

    it('should deserialize from JSON correctly', () => {
      const originalId = NotificationId.fromString('NOT-202401-000001');
      const json = JSON.stringify(originalId);
      const deserializedId = NotificationId.fromString(JSON.parse(json));
      
      expect(deserializedId.equals(originalId)).toBe(true);
    });
  });

  describe('Healthcare Integration', () => {
    it('should integrate with patient ID format', () => {
      const notificationId = NotificationId.fromString('NOT-202401-000001');
      const patientId = 'PAT-202401-001';
      
      // Should be able to correlate notification with patient from same month
      expect(notificationId.getYear()).toBe(2024);
      expect(notificationId.getMonth()).toBe(1);
      expect(patientId.substring(4, 10)).toBe('202401');
    });

    it('should support healthcare audit requirements', () => {
      const notificationId = NotificationId.fromString('NOT-202401-000001');
      
      const auditInfo = {
        id: notificationId.getValue(),
        createdMonth: notificationId.getVietnameseMonth(),
        ageInDays: notificationId.getAgeInDays(),
        isRecent: notificationId.isRecent(30)
      };
      
      expect(auditInfo.id).toBe('NOT-202401-000001');
      expect(auditInfo.createdMonth).toBe('Tháng 1');
      expect(typeof auditInfo.ageInDays).toBe('number');
      expect(typeof auditInfo.isRecent).toBe('boolean');
    });

    it('should support Vietnamese healthcare reporting', () => {
      const notificationIds = [
        NotificationId.fromString('NOT-202401-000001'),
        NotificationId.fromString('NOT-202401-000002'),
        NotificationId.fromString('NOT-202402-000001')
      ];
      
      // Group by month for Vietnamese healthcare reports
      const groupedByMonth = notificationIds.reduce((acc, id) => {
        const month = id.getVietnameseMonth();
        if (!acc[month]) acc[month] = [];
        acc[month].push(id);
        return acc;
      }, {} as Record<string, NotificationId[]>);
      
      expect(groupedByMonth['Tháng 1']).toHaveLength(2);
      expect(groupedByMonth['Tháng 2']).toHaveLength(1);
    });
  });

  describe('Performance', () => {
    it('should create notification IDs efficiently', () => {
      const startTime = Date.now();
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        NotificationId.create();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should create 1000 IDs in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should validate notification IDs efficiently', () => {
      const validIds = Array.from({ length: 100 }, (_, i) => 
        `NOT-202401-${String(i + 1).padStart(6, '0')}`
      );
      
      const startTime = Date.now();
      
      validIds.forEach(id => {
        NotificationId.fromString(id);
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should validate 100 IDs in less than 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});
