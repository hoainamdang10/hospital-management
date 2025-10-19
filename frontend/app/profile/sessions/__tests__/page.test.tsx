/**
 * Sessions Management Page Tests
 * 
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionsPage from '../page';
import * as identityService from '@/modules/identity/services/identityService';

jest.mock('@/modules/identity/services/identityService');

const mockListSessions = identityService.listSessions as jest.MockedFunction<typeof identityService.listSessions>;
const mockTerminateSession = identityService.terminateSession as jest.MockedFunction<typeof identityService.terminateSession>;
const mockTerminateAllSessions = identityService.terminateAllSessions as jest.MockedFunction<typeof identityService.terminateAllSessions>;

const mockSessions = [
  {
    id: 'session-1',
    userId: 'user-123',
    deviceInfo: {
      platform: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    expiresAt: '2024-12-31T23:59:59.000Z',
    isActive: true,
    isCurrent: true,
    createdAt: '2024-01-15T10:00:00.000Z',
    lastAccessedAt: '2024-01-15T12:00:00.000Z',
  },
  {
    id: 'session-2',
    userId: 'user-123',
    deviceInfo: {
      platform: 'mobile',
      browser: 'Safari',
      os: 'iOS',
    },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0...',
    expiresAt: '2024-12-31T23:59:59.000Z',
    isActive: true,
    isCurrent: false,
    createdAt: '2024-01-14T10:00:00.000Z',
    lastAccessedAt: '2024-01-14T15:00:00.000Z',
  },
];

describe('SessionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'accessToken') return 'mock-token';
      if (key === 'userId') return 'user-123';
      return null;
    });

    global.confirm = jest.fn(() => true);

    mockListSessions.mockResolvedValue({
      success: true,
      sessions: mockSessions,
      currentSessionId: 'session-1',
    });
  });

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', () => {
      Storage.prototype.getItem = jest.fn(() => null);
      
      render(<SessionsPage />);
      
      expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
    });

    it('should load sessions on mount', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        expect(mockListSessions).toHaveBeenCalledWith('user-123', 'mock-token');
      });
    });
  });

  describe('Session List Display', () => {
    it('should display all sessions', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/chrome • windows • desktop/i)).toBeInTheDocument();
        expect(screen.getByText(/safari • ios • mobile/i)).toBeInTheDocument();
      });
    });

    it('should show session count', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/phiên hoạt động \(2\)/i)).toBeInTheDocument();
      });
    });

    it('should mark current session', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/phiên hiện tại/i)).toBeInTheDocument();
      });
    });

    it('should display IP addresses', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/ip: 192\.168\.1\.1/i)).toBeInTheDocument();
        expect(screen.getByText(/ip: 192\.168\.1\.2/i)).toBeInTheDocument();
      });
    });

    it('should display device icons correctly', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        const content = screen.getByText(/chrome • windows • desktop/i).closest('div');
        expect(content?.textContent).toContain('💻');
      });

      await waitFor(() => {
        const content = screen.getByText(/safari • ios • mobile/i).closest('div');
        expect(content?.textContent).toContain('📱');
      });
    });
  });

  describe('Terminate Single Session', () => {
    it('should terminate session when confirmed', async () => {
      global.confirm = jest.fn(() => true);
      mockTerminateSession.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/safari • ios • mobile/i)).toBeInTheDocument();
      });

      const terminateButtons = screen.getAllByText('Đăng xuất');
      await user.click(terminateButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('đăng xuất phiên này')
      );

      await waitFor(() => {
        expect(mockTerminateSession).toHaveBeenCalledWith(
          'user-123',
          'session-2',
          'mock-token'
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/đã đăng xuất phiên thành công/i)).toBeInTheDocument();
      });
    });

    it('should not terminate session when cancelled', async () => {
      global.confirm = jest.fn(() => false);

      const user = userEvent.setup();
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/safari • ios • mobile/i)).toBeInTheDocument();
      });

      const terminateButtons = screen.getAllByText('Đăng xuất');
      await user.click(terminateButtons[0]);

      expect(mockTerminateSession).not.toHaveBeenCalled();
    });

    it('should not show terminate button for current session', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/phiên hiện tại/i)).toBeInTheDocument();
      });

      // Current session should not have a terminate button
      const currentSessionDiv = screen.getByText(/phiên hiện tại/i).closest('div');
      const terminateButton = currentSessionDiv?.querySelector('button');
      expect(terminateButton).toBeNull();
    });

    it('should reload sessions after termination', async () => {
      mockTerminateSession.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/safari • ios • mobile/i)).toBeInTheDocument();
      });

      const initialCallCount = mockListSessions.mock.calls.length;

      const terminateButtons = screen.getAllByText('Đăng xuất');
      await user.click(terminateButtons[0]);

      await waitFor(() => {
        expect(mockListSessions).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });

    it('should display error on termination failure', async () => {
      mockTerminateSession.mockRejectedValue(new Error('Termination failed'));

      const user = userEvent.setup();
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/safari • ios • mobile/i)).toBeInTheDocument();
      });

      const terminateButtons = screen.getAllByText('Đăng xuất');
      await user.click(terminateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/termination failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Terminate All Sessions', () => {
    it('should show terminate all button when multiple sessions exist', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/đăng xuất tất cả/i)).toBeInTheDocument();
      });
    });

    it('should not show terminate all button with only one session', async () => {
      mockListSessions.mockResolvedValue({
        success: true,
        sessions: [mockSessions[0]],
        currentSessionId: 'session-1',
      });

      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.queryByText(/đăng xuất tất cả/i)).not.toBeInTheDocument();
      });
    });

    it('should terminate all sessions when confirmed', async () => {
      global.confirm = jest.fn(() => true);
      mockTerminateAllSessions.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/đăng xuất tất cả/i)).toBeInTheDocument();
      });

      const terminateAllButton = screen.getByText(/đăng xuất tất cả/i);
      await user.click(terminateAllButton);

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('đăng xuất tất cả các phiên khác')
      );

      await waitFor(() => {
        expect(mockTerminateAllSessions).toHaveBeenCalledWith('user-123', 'mock-token');
      });

      await waitFor(() => {
        expect(screen.getByText(/đã đăng xuất tất cả các phiên khác/i)).toBeInTheDocument();
      });
    });

    it('should not terminate all sessions when cancelled', async () => {
      global.confirm = jest.fn(() => false);

      const user = userEvent.setup();
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/đăng xuất tất cả/i)).toBeInTheDocument();
      });

      const terminateAllButton = screen.getByText(/đăng xuất tất cả/i);
      await user.click(terminateAllButton);

      expect(mockTerminateAllSessions).not.toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no sessions', async () => {
      mockListSessions.mockResolvedValue({
        success: true,
        sessions: [],
        currentSessionId: '',
      });

      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/không có phiên đăng nhập nào/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should have links to other profile pages', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/chrome • windows • desktop/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /thông tin cá nhân/i })).toHaveAttribute('href', '/profile/settings');
      expect(screen.getByRole('link', { name: /bảo mật/i })).toHaveAttribute('href', '/profile/security');
    });
  });

  describe('Error Handling', () => {
    it('should display error when sessions load fails', async () => {
      mockListSessions.mockRejectedValue(new Error('Failed to load sessions'));

      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load sessions/i)).toBeInTheDocument();
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format last accessed time correctly', async () => {
      render(<SessionsPage />);

      await waitFor(() => {
        // Should show relative time like "X giờ trước" or "X ngày trước"
        expect(screen.getByText(/trước/i)).toBeInTheDocument();
      });
    });
  });
});

