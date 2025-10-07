/**
 * TerminateAllSessionsUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { TerminateAllSessionsUseCase } from '../../../src/application/use-cases/TerminateAllSessionsUseCase';
import { ISessionRepository } from '../../../src/domain/repositories/ISessionRepository';
import { UserSession } from '../../../src/domain/entities/UserSession';

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
    return this.sessions.filter(s => s.userId === userId && s.isActive);
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

describe('TerminateAllSessionsUseCase', () => {
  let useCase: TerminateAllSessionsUseCase;
  let mockRepository: MockSessionRepository;
  const testUserId = 'user-123';

  beforeEach(() => {
    mockRepository = new MockSessionRepository();
    useCase = new TerminateAllSessionsUseCase(mockRepository);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe('execute', () => {
    it('should terminate all sessions except current', async () => {
      // Arrange
      const currentSession = UserSession.create(
        testUserId,
        'token-current',
        { platform: 'Windows', browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        new Date(Date.now() + 3600000)
      );

      const session2 = UserSession.create(
        testUserId,
        'token-2',
        { platform: 'iOS', browser: 'Safari' },
        '192.168.1.2',
        'Mozilla/5.0 (iPhone) Safari/604.1',
        new Date(Date.now() + 3600000)
      );

      const session3 = UserSession.create(
        testUserId,
        'token-3',
        { platform: 'Android', browser: 'Chrome' },
        '192.168.1.3',
        'Mozilla/5.0 (Android) Chrome/91.0',
        new Date(Date.now() + 3600000)
      );

      mockRepository.addSession(currentSession);
      mockRepository.addSession(session2);
      mockRepository.addSession(session3);

      // Act
      const result = await useCase.execute({
        userId: testUserId,
        currentSessionId: currentSession.id
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.terminatedCount).toBe(2);
      expect(result.message).toBe('Successfully terminated 2 session(s)');

      // Verify current session is still active
      const current = await mockRepository.findById(currentSession.id);
      expect(current?.isActive).toBe(true);

      // Verify other sessions are deactivated
      const other1 = await mockRepository.findById(session2.id);
      const other2 = await mockRepository.findById(session3.id);
      expect(other1?.isActive).toBe(false);
      expect(other2?.isActive).toBe(false);
    });

    it('should terminate all sessions when no current session specified', async () => {
      // Arrange
      const session1 = UserSession.create(
        testUserId,
        'token-1',
        { platform: 'Windows', browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        new Date(Date.now() + 3600000)
      );

      const session2 = UserSession.create(
        testUserId,
        'token-2',
        { platform: 'iOS', browser: 'Safari' },
        '192.168.1.2',
        'Mozilla/5.0 (iPhone) Safari/604.1',
        new Date(Date.now() + 3600000)
      );

      mockRepository.addSession(session1);
      mockRepository.addSession(session2);

      // Act
      const result = await useCase.execute({
        userId: testUserId
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.terminatedCount).toBe(2);
      expect(result.message).toBe('Successfully terminated 2 session(s)');

      // Verify all sessions are deleted
      const allSessions = await mockRepository.findAllSessionsByUserId(testUserId);
      expect(allSessions).toHaveLength(0);
    });

    it('should return 0 when user has no sessions', async () => {
      // Act
      const result = await useCase.execute({
        userId: testUserId
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.terminatedCount).toBe(0);
      expect(result.message).toBe('Successfully terminated 0 session(s)');
    });

    it('should throw error when userId is missing', async () => {
      // Act & Assert
      await expect(useCase.execute({
        userId: ''
      })).rejects.toThrow('User ID is required');
    });

    it('should not affect other users sessions', async () => {
      // Arrange
      const user1Session = UserSession.create(
        testUserId,
        'token-1',
        { platform: 'Windows', browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        new Date(Date.now() + 3600000)
      );

      const user2Session = UserSession.create(
        'other-user-456',
        'token-2',
        { platform: 'iOS', browser: 'Safari' },
        '192.168.1.2',
        'Mozilla/5.0 (iPhone) Safari/604.1',
        new Date(Date.now() + 3600000)
      );

      mockRepository.addSession(user1Session);
      mockRepository.addSession(user2Session);

      // Act
      await useCase.execute({
        userId: testUserId
      });

      // Assert
      const user1Sessions = await mockRepository.findAllSessionsByUserId(testUserId);
      const user2Sessions = await mockRepository.findAllSessionsByUserId('other-user-456');

      expect(user1Sessions).toHaveLength(0);
      expect(user2Sessions).toHaveLength(1);
      expect(user2Sessions[0].isActive).toBe(true);
    });

    it('should only terminate active sessions when using deactivateAllExcept', async () => {
      // Arrange
      const currentSession = UserSession.create(
        testUserId,
        'token-current',
        { platform: 'Windows', browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        new Date(Date.now() + 3600000)
      );

      const activeSession = UserSession.create(
        testUserId,
        'token-active',
        { platform: 'iOS', browser: 'Safari' },
        '192.168.1.2',
        'Mozilla/5.0 (iPhone) Safari/604.1',
        new Date(Date.now() + 3600000)
      );

      const inactiveSession = UserSession.create(
        testUserId,
        'token-inactive',
        { platform: 'Android', browser: 'Chrome' },
        '192.168.1.3',
        'Mozilla/5.0 (Android) Chrome/91.0',
        new Date(Date.now() + 3600000)
      );
      inactiveSession.deactivate(); // Already inactive

      mockRepository.addSession(currentSession);
      mockRepository.addSession(activeSession);
      mockRepository.addSession(inactiveSession);

      // Act
      const result = await useCase.execute({
        userId: testUserId,
        currentSessionId: currentSession.id
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.terminatedCount).toBe(1); // Only the active session
    });
  });
});

