/**
 * Unit Tests for UserAuthenticatedEvent
 * Tests authentication success event creation and assertions
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UserAuthenticatedEvent } from '@domain/events/UserAuthenticatedEvent';
import { UserId } from '@domain/value-objects/UserId';

describe('UserAuthenticatedEvent', () => {
  const testUserId = UserId.fromString('u-test-123');
  const testIpAddress = '192.168.1.100';
  const testUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const testTimestamp = new Date('2024-01-15T10:30:00Z');

  describe('constructor', () => {
    it('should create event with all required properties', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      expect(event.userIdVO).toBe(testUserId);
      expect(event.ipAddress).toBe(testIpAddress);
      expect(event.userAgent).toBe(testUserAgent);
      expect(event.timestamp).toBe(testTimestamp);
    });

    it('should set correct event type', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      expect(event.eventType).toBe('UserAuthenticated');
    });

    it('should set correct aggregate type', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      expect(event.aggregateType).toBe('User');
    });

    it('should set correct aggregate ID', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      expect(event.aggregateId).toBe(testUserId.value);
    });

    it('should set event version to 1', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      expect(event.eventVersion).toBe(1);
    });

    it('should have unique event ID', () => {
      const event1 = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );
      const event2 = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });

  describe('getEventData', () => {
    it('should return complete event data', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      const eventData = event.getEventData();

      expect(eventData).toEqual({
        userId: testUserId.value,
        ipAddress: testIpAddress,
        userAgent: testUserAgent,
        timestamp: testTimestamp
      });
    });

    it('should include user ID', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      const eventData = event.getEventData();

      expect(eventData.userId).toBe(testUserId.value);
    });

    it('should include IP address for security audit', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      const eventData = event.getEventData();

      expect(eventData.ipAddress).toBe(testIpAddress);
    });

    it('should include user agent for device tracking', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      const eventData = event.getEventData();

      expect(eventData.userAgent).toBe(testUserAgent);
    });

    it('should include authentication timestamp', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      const eventData = event.getEventData();

      expect(eventData.timestamp).toBe(testTimestamp);
    });
  });

  describe('containsPHI', () => {
    it('should return false as IP and user agent are not PHI', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      expect(event.containsPHI()).toBe(false);
    });
  });

  describe('getPatientId', () => {
    it('should return null as this is not a patient-specific event', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      expect(event.getPatientId()).toBeNull();
    });
  });

  describe('security audit scenarios', () => {
    it('should track IPv4 address', () => {
      const ipv4 = '203.0.113.42';
      const event = new UserAuthenticatedEvent(
        testUserId,
        ipv4,
        testUserAgent,
        testTimestamp
      );

      expect(event.ipAddress).toBe(ipv4);
    });

    it('should track IPv6 address', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const event = new UserAuthenticatedEvent(
        testUserId,
        ipv6,
        testUserAgent,
        testTimestamp
      );

      expect(event.ipAddress).toBe(ipv6);
    });

    it('should track localhost address', () => {
      const localhost = '127.0.0.1';
      const event = new UserAuthenticatedEvent(
        testUserId,
        localhost,
        testUserAgent,
        testTimestamp
      );

      expect(event.ipAddress).toBe(localhost);
    });

    it('should track mobile user agent', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        mobileUA,
        testTimestamp
      );

      expect(event.userAgent).toBe(mobileUA);
    });

    it('should track desktop user agent', () => {
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0';
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        desktopUA,
        testTimestamp
      );

      expect(event.userAgent).toBe(desktopUA);
    });

    it('should track tablet user agent', () => {
      const tabletUA = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        tabletUA,
        testTimestamp
      );

      expect(event.userAgent).toBe(tabletUA);
    });
  });

  describe('timestamp scenarios', () => {
    it('should preserve exact authentication time', () => {
      const exactTime = new Date('2024-01-15T14:30:45.123Z');
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        exactTime
      );

      expect(event.timestamp).toBe(exactTime);
      expect(event.timestamp.getTime()).toBe(exactTime.getTime());
    });

    it('should handle different timezones', () => {
      const utcTime = new Date('2024-01-15T00:00:00Z');
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        utcTime
      );

      expect(event.timestamp.toISOString()).toBe('2024-01-15T00:00:00.000Z');
    });

    it('should handle Vietnamese timezone (UTC+7)', () => {
      // Vietnamese time: 2024-01-15 07:00:00 GMT+7 = 2024-01-15 00:00:00 UTC
      const vnTime = new Date('2024-01-15T00:00:00Z');
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        vnTime
      );

      expect(event.timestamp).toBe(vnTime);
    });
  });

  describe('immutability', () => {
    it('should have immutable user ID', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      const originalUserId = event.userIdVO;
      expect(event.userIdVO).toBe(originalUserId);
    });

    it('should have immutable IP address', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      const originalIp = event.ipAddress;
      expect(event.ipAddress).toBe(originalIp);
    });

    it('should have immutable user agent', () => {
      const event = new UserAuthenticatedEvent(
        testUserId,
        testIpAddress,
        testUserAgent,
        testTimestamp
      );

      const originalUA = event.userAgent;
      expect(event.userAgent).toBe(originalUA);
    });
  });
});

