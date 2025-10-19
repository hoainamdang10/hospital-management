/**
 * TerminateSessionUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { TerminateSessionUseCase } from '../../../src/application/use-cases/TerminateSessionUseCase';
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

describe('TerminateSessionUseCase', () => {
  let useCase: TerminateSessionUseCase;
  let mockRepository: MockSessionRepository;
  let mockLogger: any;
  const testUserId = 'user-123';

  beforeEach(() => {
    mockRepository = new MockSessionRepository();
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    useCase = new TerminateSessionUseCase(mockRepository, mockLogger);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe('execute', () => {
    it('should terminate a session successfully', async () => {
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
        userId: testUserId,
        sessionId: session.id
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Session terminated successfully');
      
      // Verify session is deactivated
      const terminatedSession = await mockRepository.findById(session.id);
      expect(terminatedSession?.isActive).toBe(false);
    });

    it('should throw error when userId is missing', async () => {
      // Act & Assert
      await expect(useCase.execute({
        userId: '',
        sessionId: 'session-123'
      })).rejects.toThrow('User ID is required');
    });

    it('should throw error when sessionId is missing', async () => {
      // Act & Assert
      await expect(useCase.execute({
        userId: testUserId,
        sessionId: ''
      })).rejects.toThrow('Session ID is required');
    });

    it('should throw error when session not found', async () => {
      // Act & Assert
      await expect(useCase.execute({
        userId: testUserId,
        sessionId: 'non-existent-session'
      })).rejects.toThrow('Session not found');
    });

    it('should throw error when session belongs to different user', async () => {
      // Arrange
      const session = UserSession.create(
        'other-user-456',
        'token-1',
        { platform: 'Windows', browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        new Date(Date.now() + 3600000)
      );

      mockRepository.addSession(session);

      // Act & Assert
      await expect(useCase.execute({
        userId: testUserId,
        sessionId: session.id
      })).rejects.toThrow('Unauthorized: Session does not belong to this user');
    });

    it('should handle multiple sessions correctly', async () => {
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

      // Act - Terminate only session1
      await useCase.execute({
        userId: testUserId,
        sessionId: session1.id
      });

      // Assert
      const terminatedSession = await mockRepository.findById(session1.id);
      const activeSession = await mockRepository.findById(session2.id);

      expect(terminatedSession?.isActive).toBe(false);
      expect(activeSession?.isActive).toBe(true);
    });

    it('should allow terminating already inactive session', async () => {
      // Arrange
      const session = UserSession.create(
        testUserId,
        'token-1',
        { platform: 'Windows', browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        new Date(Date.now() + 3600000)
      );

      session.deactivate(); // Already inactive
      mockRepository.addSession(session);

      // Act
      const result = await useCase.execute({
        userId: testUserId,
        sessionId: session.id
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Session terminated successfully');
    });
  });
});

