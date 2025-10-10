/**
 * ListActiveSessionsUseCase Unit Tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ListActiveSessionsUseCase } from '../../../src/application/use-cases/ListActiveSessionsUseCase';
import { ISessionRepository } from '../../../src/domain/repositories/ISessionRepository';
import { UserSession } from '../../../src/domain/entities/UserSession';
import { ILogger } from '@shared/application/services/logger.interface';

// Mock repository
class MockSessionRepository implements ISessionRepository {
  private sessions: UserSession[] = [];

  async findById(sessionId: string): Promise<UserSession | null> {
    return this.sessions.find(s => s.id === sessionId) || null;
  }

  async findByToken(sessionToken: string): Promise<UserSession | null> {
    return this.sessions.find(s => s.sessionToken === sessionToken) || null;
  }

  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    return this.sessions.filter(s => 
      s.userId === userId && 
      s.isActive && 
      !s.isExpired()
    );
  }

  async findAllSessionsByUserId(userId: string): Promise<UserSession[]> {
    return this.sessions.filter(s => s.userId === userId);
  }

  async create(session: UserSession): Promise<UserSession> {
    this.sessions.push(session);
    return session;
  }

  async update(session: UserSession): Promise<UserSession> {
    const index = this.sessions.findIndex(s => s.id === session.id);
    if (index !== -1) {
      this.sessions[index] = session;
    }
    return session;
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const count = this.sessions.filter(s => s.userId === userId).length;
    this.sessions = this.sessions.filter(s => s.userId !== userId);
    return count;
  }

  async deactivate(sessionId: string): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      session.deactivate();
    }
  }

  async deactivateAllExcept(userId: string, currentSessionId: string): Promise<number> {
    let count = 0;
    this.sessions.forEach(s => {
      if (s.userId === userId && s.id !== currentSessionId && s.isActive) {
        s.deactivate();
        count++;
      }
    });
    return count;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const count = this.sessions.filter(s => s.isExpired()).length;
    this.sessions = this.sessions.filter(s => !s.isExpired());
    return count;
  }

  // Helper methods for testing
  addSession(session: UserSession): void {
    this.sessions.push(session);
  }

  clear(): void {
    this.sessions = [];
  }
}

// Mock logger
const mockLogger: ILogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
};

describe('ListActiveSessionsUseCase', () => {
  let useCase: ListActiveSessionsUseCase;
  let mockRepository: MockSessionRepository;
  const testUserId = 'user-123';

  beforeEach(() => {
    mockRepository = new MockSessionRepository();
    jest.clearAllMocks();
    useCase = new ListActiveSessionsUseCase(mockRepository, mockLogger);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe('execute', () => {
    it('should list all active sessions for a user', async () => {
      // Arrange
      const session1 = UserSession.create(
        testUserId,
        'token-1',
        { platform: 'Windows', browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        new Date(Date.now() + 3600000) // Expires in 1 hour
      );

      const session2 = UserSession.create(
        testUserId,
        'token-2',
        { platform: 'iOS', browser: 'Safari' },
        '192.168.1.2',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0) Safari/604.1',
        new Date(Date.now() + 3600000)
      );

      mockRepository.addSession(session1);
      mockRepository.addSession(session2);

      // Act
      const result = await useCase.execute({
        userId: testUserId,
        currentSessionId: session1.id
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessions).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.sessions[0].isCurrent).toBe(true);
      expect(result.sessions[1].isCurrent).toBe(false);
    });

    it('should return empty array when user has no active sessions', async () => {
      // Act
      const result = await useCase.execute({
        userId: testUserId
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessions).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should parse device info from user agent', async () => {
      // Arrange
      const session = UserSession.create(
        testUserId,
        'token-1',
        {}, // No device info stored
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        new Date(Date.now() + 3600000)
      );

      mockRepository.addSession(session);

      // Act
      const result = await useCase.execute({
        userId: testUserId
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].deviceInfo.os).toBe('Windows');
      expect(result.sessions[0].deviceInfo.browser).toBe('Chrome');
      expect(result.sessions[0].deviceInfo.deviceType).toBe('Desktop');
    });

    it('should handle mobile user agents', async () => {
      // Arrange
      const session = UserSession.create(
        testUserId,
        'token-1',
        {},
        '192.168.1.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        new Date(Date.now() + 3600000)
      );

      mockRepository.addSession(session);

      // Act
      const result = await useCase.execute({
        userId: testUserId
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessions[0].deviceInfo.os).toBe('iOS');
      expect(result.sessions[0].deviceInfo.deviceType).toBe('Mobile');
    });

    it('should throw error when userId is missing', async () => {
      // Act & Assert
      await expect(useCase.execute({ userId: '' }))
        .rejects
        .toThrow('User ID is required');
    });

    it('should include session metadata', async () => {
      // Arrange
      const session = UserSession.create(
        testUserId,
        'token-1',
        { platform: 'Windows', browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        new Date(Date.now() + 3600000)
      );

      mockRepository.addSession(session);

      // Act
      const result = await useCase.execute({
        userId: testUserId
      });

      // Assert
      expect(result.sessions[0]).toHaveProperty('sessionId');
      expect(result.sessions[0]).toHaveProperty('deviceInfo');
      expect(result.sessions[0]).toHaveProperty('ipAddress');
      expect(result.sessions[0]).toHaveProperty('location');
      expect(result.sessions[0]).toHaveProperty('lastActivity');
      expect(result.sessions[0]).toHaveProperty('createdAt');
      expect(result.sessions[0]).toHaveProperty('expiresAt');
      expect(result.sessions[0]).toHaveProperty('isCurrent');
    });

    it('should filter out expired sessions', async () => {
      // Arrange
      const activeSession = UserSession.create(
        testUserId,
        'token-1',
        { platform: 'Windows', browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        new Date(Date.now() + 3600000) // Expires in 1 hour
      );

      const expiredSession = UserSession.create(
        testUserId,
        'token-2',
        { platform: 'iOS', browser: 'Safari' },
        '192.168.1.2',
        'Mozilla/5.0 (iPhone) Safari/604.1',
        new Date(Date.now() - 3600000) // Expired 1 hour ago
      );

      mockRepository.addSession(activeSession);
      mockRepository.addSession(expiredSession);

      // Act
      const result = await useCase.execute({
        userId: testUserId
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionId).toBe(activeSession.id);
    });
  });
});

