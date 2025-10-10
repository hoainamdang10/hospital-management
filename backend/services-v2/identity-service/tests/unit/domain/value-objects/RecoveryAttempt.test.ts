import { RecoveryAttempt } from '../../../../src/domain/value-objects/RecoveryAttempt';

describe('RecoveryAttempt Value Object', () => {
  describe('constructor', () => {
    it('should create a valid recovery attempt', () => {
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'email',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        attemptedAt: new Date(),
        successful: false
      });

      expect(attempt.getUserId()).toBe('user123');
      expect(attempt.getMethod()).toBe('email');
      expect(attempt.getIpAddress()).toBe('192.168.1.1');
      expect(attempt.isSuccessful()).toBe(false);
    });

    it('should create successful recovery attempt', () => {
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'sms',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/91.0',
        attemptedAt: new Date(),
        successful: true,
        token: 'reset-token-123'
      });

      expect(attempt.isSuccessful()).toBe(true);
      expect(attempt.getToken()).toBe('reset-token-123');
    });
  });

  describe('validation', () => {
    it('should throw error for empty userId', () => {
      expect(() => {
        new RecoveryAttempt({
          userId: '',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: false
        });
      }).toThrow('User ID is required');
    });

    it('should throw error for invalid recovery method', () => {
      expect(() => {
        new RecoveryAttempt({
          userId: 'user123',
          method: 'invalid' as any,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: false
        });
      }).toThrow('Invalid recovery method');
    });

    it('should throw error for invalid IP address', () => {
      expect(() => {
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: 'invalid-ip',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: false
        });
      }).toThrow('Invalid IP address format');
    });

    it('should accept IPv6 addresses', () => {
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'email',
        ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        userAgent: 'Mozilla/5.0',
        attemptedAt: new Date(),
        successful: false
      });

      expect(attempt.getIpAddress()).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });
  });

  describe('token management', () => {
    it('should generate token for successful attempt', () => {
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'email',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        attemptedAt: new Date(),
        successful: true
      });

      attempt.generateToken();
      const token = attempt.getToken();
      
      expect(token).toBeDefined();
      expect(token).toHaveLength(32); // Assuming 32 character token
    });

    it('should not generate token for failed attempt', () => {
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'email',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        attemptedAt: new Date(),
        successful: false
      });

      expect(() => attempt.generateToken())
        .toThrow('Cannot generate token for failed attempt');
    });

    it('should expire token after specified time', () => {
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'email',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        attemptedAt: new Date(Date.now() - 3600000), // 1 hour ago
        successful: true,
        token: 'reset-token-123',
        tokenExpiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      });

      expect(attempt.isTokenExpired()).toBe(true);
    });

    it('should validate non-expired token', () => {
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'email',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        attemptedAt: new Date(),
        successful: true,
        token: 'reset-token-123',
        tokenExpiresAt: new Date(Date.now() + 3600000) // Expires in 1 hour
      });

      expect(attempt.isTokenExpired()).toBe(false);
      expect(attempt.isTokenValid('reset-token-123')).toBe(true);
    });

    it('should invalidate wrong token', () => {
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'email',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        attemptedAt: new Date(),
        successful: true,
        token: 'reset-token-123',
        tokenExpiresAt: new Date(Date.now() + 3600000)
      });

      expect(attempt.isTokenValid('wrong-token')).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('should track attempt count within time window', () => {
      const attempts: RecoveryAttempt[] = [];
      const now = new Date();
      
      // Create 5 attempts in last hour
      for (let i = 0; i < 5; i++) {
        attempts.push(new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(now.getTime() - i * 600000), // Every 10 minutes
          successful: false
        }));
      }

      const attemptsInLastHour = RecoveryAttempt.countAttemptsInWindow(attempts, 60);
      expect(attemptsInLastHour).toBe(5);
    });

    it('should identify rate limit exceeded', () => {
      const attempts: RecoveryAttempt[] = [];
      const now = new Date();
      
      // Create 6 attempts in last 15 minutes (exceeds limit of 5)
      for (let i = 0; i < 6; i++) {
        attempts.push(new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(now.getTime() - i * 120000), // Every 2 minutes
          successful: false
        }));
      }

      const isRateLimited = RecoveryAttempt.isRateLimited(attempts, 5, 15);
      expect(isRateLimited).toBe(true);
    });

    it('should not rate limit when under threshold', () => {
      const attempts: RecoveryAttempt[] = [];
      const now = new Date();
      
      // Create 3 attempts in last 15 minutes (under limit of 5)
      for (let i = 0; i < 3; i++) {
        attempts.push(new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(now.getTime() - i * 300000), // Every 5 minutes
          successful: false
        }));
      }

      const isRateLimited = RecoveryAttempt.isRateLimited(attempts, 5, 15);
      expect(isRateLimited).toBe(false);
    });
  });

  describe('suspicious activity detection', () => {
    it('should detect multiple IPs for same user', () => {
      const attempts = [
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: false
        }),
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: false
        }),
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '172.16.0.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: false
        })
      ];

      const uniqueIPs = RecoveryAttempt.getUniqueIPCount(attempts);
      expect(uniqueIPs).toBe(3);
      
      const isSuspicious = RecoveryAttempt.isSuspiciousActivity(attempts);
      expect(isSuspicious).toBe(true); // Multiple IPs in short time
    });

    it('should detect rapid attempts', () => {
      const attempts: RecoveryAttempt[] = [];
      const now = Date.now();
      
      // Create 10 attempts in 1 minute (very rapid)
      for (let i = 0; i < 10; i++) {
        attempts.push(new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(now - i * 6000), // Every 6 seconds
          successful: false
        }));
      }

      const isRapid = RecoveryAttempt.isRapidAttempts(attempts, 1); // Check last 1 minute
      expect(isRapid).toBe(true);
    });

    it('should detect different user agents', () => {
      const attempts = [
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Windows',
          attemptedAt: new Date(),
          successful: false
        }),
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Chrome/91.0 Mac',
          attemptedAt: new Date(),
          successful: false
        }),
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Safari/14.0 iOS',
          attemptedAt: new Date(),
          successful: false
        })
      ];

      const uniqueAgents = RecoveryAttempt.getUniqueUserAgentCount(attempts);
      expect(uniqueAgents).toBe(3);
    });
  });

  describe('statistics', () => {
    it('should calculate success rate', () => {
      const attempts = [
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: true
        }),
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: true
        }),
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: false
        })
      ];

      const successRate = RecoveryAttempt.calculateSuccessRate(attempts);
      expect(successRate).toBeCloseTo(0.667, 2); // 66.7%
    });

    it('should get most used recovery method', () => {
      const attempts = [
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: true
        }),
        new RecoveryAttempt({
          userId: 'user123',
          method: 'email',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: false
        }),
        new RecoveryAttempt({
          userId: 'user123',
          method: 'sms',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          attemptedAt: new Date(),
          successful: true
        })
      ];

      const mostUsed = RecoveryAttempt.getMostUsedMethod(attempts);
      expect(mostUsed).toBe('email'); // 2 email vs 1 sms
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const attemptedAt = new Date();
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'email',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        attemptedAt,
        successful: true,
        token: 'reset-token-123'
      });

      const json = attempt.toJSON();
      expect(json).toEqual({
        userId: 'user123',
        method: 'email',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        attemptedAt,
        successful: true,
        token: 'reset-token-123',
        tokenExpiresAt: expect.any(Date),
        metadata: {}
      });
    });

    it('should not include token for failed attempts', () => {
      const attempt = new RecoveryAttempt({
        userId: 'user123',
        method: 'email',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        attemptedAt: new Date(),
        successful: false
      });

      const json = attempt.toJSON();
      expect(json.token).toBeUndefined();
      expect(json.tokenExpiresAt).toBeUndefined();
    });
  });
});
