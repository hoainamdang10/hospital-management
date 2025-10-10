import { SupabaseSessionRepository } from '@infrastructure/repositories/SupabaseSessionRepository';

// Mock Supabase Client
const mockSupabaseClient = {
  from: jest.fn(),
};

// Helper to create chainable query mock
const createQueryMock = (data: any, error: any = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error }),
  insert: jest.fn().mockResolvedValue({ data, error }),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) => resolve({ data, error })),
});

describe('SupabaseSessionRepository', () => {
  let repository: SupabaseSessionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SupabaseSessionRepository(mockSupabaseClient as any);
  });

  describe('findById', () => {
    it('should return session when found', async () => {
      // Arrange
      const sessionId = 'session-123';
      const mockData = {
        id: sessionId,
        user_id: 'user-123',
        session_token: 'token-abc',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        is_active: true,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        last_accessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const queryMock = createQueryMock(mockData);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.findById(sessionId);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sessionId);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('auth_schema.user_sessions');
      expect(queryMock.eq).toHaveBeenCalledWith('id', sessionId);
    });

    it('should return null when session not found', async () => {
      // Arrange
      const sessionId = 'non-existent';
      const queryMock = createQueryMock(null, { message: 'Not found' });
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.findById(sessionId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByToken', () => {
    it('should return session when token found', async () => {
      // Arrange
      const sessionToken = 'token-abc';
      const mockData = {
        id: 'session-123',
        user_id: 'user-123',
        session_token: sessionToken,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        is_active: true,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        last_accessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const queryMock = createQueryMock(mockData);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.findByToken(sessionToken);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.sessionToken).toBe(sessionToken);
      expect(queryMock.eq).toHaveBeenCalledWith('session_token', sessionToken);
    });

    it('should return null when token not found', async () => {
      // Arrange
      const sessionToken = 'invalid-token';
      const queryMock = createQueryMock(null, { message: 'Not found' });
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.findByToken(sessionToken);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findActiveSessionsByUserId', () => {
    it('should return active sessions for user', async () => {
      // Arrange
      const userId = 'user-123';
      const mockData = [
        {
          id: 'session-1',
          user_id: userId,
          session_token: 'token-1',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          is_active: true,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          last_accessed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 'session-2',
          user_id: userId,
          session_token: 'token-2',
          ip_address: '192.168.1.2',
          user_agent: 'Chrome/90.0',
          is_active: true,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          last_accessed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];

      const queryMock = createQueryMock(mockData);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.findActiveSessionsByUserId(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId);
      expect(result[1].userId).toBe(userId);
      expect(queryMock.eq).toHaveBeenCalledWith('user_id', userId);
      expect(queryMock.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return empty array when no active sessions', async () => {
      // Arrange
      const userId = 'user-456';
      const queryMock = createQueryMock([]);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.findActiveSessionsByUserId(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const userId = 'user-789';
      const queryMock = createQueryMock(null, { message: 'Database error' });
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.findActiveSessionsByUserId(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('deleteAllByUserId', () => {
    it('should delete all sessions for user', async () => {
      // Arrange
      const userId = 'user-123';
      const deleteMock = createQueryMock({ count: 3 });
      mockSupabaseClient.from.mockReturnValue(deleteMock);

      // Act
      await repository.deleteAllByUserId(userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('auth_schema.user_sessions');
      expect(deleteMock.delete).toHaveBeenCalled();
      expect(deleteMock.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const userId = 'user-456';
      const errorMock = createQueryMock(null, { message: 'Delete failed' });
      mockSupabaseClient.from.mockReturnValue(errorMock);

      // Act & Assert
      await expect(repository.deleteAllByUserId(userId)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete session by id', async () => {
      // Arrange
      const sessionId = 'session-123';
      const deleteMock = createQueryMock({ count: 1 });
      mockSupabaseClient.from.mockReturnValue(deleteMock);

      // Act
      await repository.delete(sessionId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('auth_schema.user_sessions');
      expect(deleteMock.delete).toHaveBeenCalled();
      expect(deleteMock.eq).toHaveBeenCalledWith('id', sessionId);
    });
  });

  // Note: updateLastAccessed method has been removed from the repository
  // Tests removed as the method no longer exists

  describe('deactivate', () => {
    it('should deactivate session', async () => {
      // Arrange
      const sessionId = 'session-123';
      const updateMock = createQueryMock({ id: sessionId });
      mockSupabaseClient.from.mockReturnValue(updateMock);

      // Act
      await repository.deactivate(sessionId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('auth_schema.user_sessions');
      expect(updateMock.update).toHaveBeenCalledWith({ is_active: false });
      expect(updateMock.eq).toHaveBeenCalledWith('id', sessionId);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      // Arrange
      const deletedSessions = Array(5).fill({ id: 'session-id' });
      const deleteMock = createQueryMock(deletedSessions);
      mockSupabaseClient.from.mockReturnValue(deleteMock);

      // Act
      const result = await repository.cleanupExpiredSessions();

      // Assert
      expect(result).toBe(5);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('auth_schema.user_sessions');
      expect(deleteMock.delete).toHaveBeenCalled();
    });

    it('should return 0 when no expired sessions', async () => {
      // Arrange
      const deleteMock = createQueryMock({ count: 0 });
      mockSupabaseClient.from.mockReturnValue(deleteMock);

      // Act
      const result = await repository.cleanupExpiredSessions();

      // Assert
      expect(result).toBe(0);
    });
  });
});

