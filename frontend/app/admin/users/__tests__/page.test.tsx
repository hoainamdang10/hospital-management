/**
 * Admin Users Page Tests
 * 
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUsersPage from '../page';
import * as identityService from '@/modules/identity/services/identityService';

// Mock the identity service
jest.mock('@/modules/identity/services/identityService');

const mockListUsers = identityService.listUsers as jest.MockedFunction<typeof identityService.listUsers>;
const mockDeleteUser = identityService.deleteUser as jest.MockedFunction<typeof identityService.deleteUser>;

describe('AdminUsersPage', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'accessToken') return 'mock-token';
      if (key === 'userRole') return 'ADMIN';
      return null;
    });

    // Mock successful list users response
    mockListUsers.mockResolvedValue({
      success: true,
      users: [
        {
          id: 'user-1',
          email: 'user1@example.com',
          fullName: 'User One',
          phoneNumber: '0123456789',
          role: 'PATIENT',
          isActive: true,
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          fullName: 'User Two',
          phoneNumber: '0987654321',
          role: 'DOCTOR',
          isActive: false,
          emailVerified: true,
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });
  });

  describe('Authentication and Authorization', () => {
    it('should redirect to login if no access token', () => {
      Storage.prototype.getItem = jest.fn(() => null);
      
      render(<AdminUsersPage />);
      
      // Should show loading state initially
      expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
    });

    it('should show error if user is not admin', async () => {
      Storage.prototype.getItem = jest.fn((key) => {
        if (key === 'accessToken') return 'mock-token';
        if (key === 'userRole') return 'PATIENT';
        return null;
      });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText(/không có quyền truy cập/i)).toBeInTheDocument();
      });
    });
  });

  describe('User List Display', () => {
    it('should render user list successfully', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        expect(screen.getByText('user2@example.com')).toBeInTheDocument();
      });
    });

    it('should display role badges correctly', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Bệnh nhân')).toBeInTheDocument();
        expect(screen.getByText('Bác sĩ')).toBeInTheDocument();
      });
    });

    it('should display active status correctly', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        const activeStatuses = screen.getAllByText('Hoạt động');
        const inactiveStatuses = screen.getAllByText('Không hoạt động');
        expect(activeStatuses.length).toBeGreaterThan(0);
        expect(inactiveStatuses.length).toBeGreaterThan(0);
      });
    });

    it('should show total user count', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText(/tổng số: 2 người dùng/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should call listUsers with search term', async () => {
      const user = userEvent.setup();
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/tìm theo tên, email/i);
      await user.type(searchInput, 'test search');

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            searchTerm: 'test search',
          }),
          'mock-token'
        );
      });
    });

    it('should filter by role', async () => {
      const user = userEvent.setup();
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const roleSelect = screen.getByLabelText(/vai trò/i);
      await user.selectOptions(roleSelect, 'DOCTOR');

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            roleType: 'DOCTOR',
          }),
          'mock-token'
        );
      });
    });

    it('should filter by status', async () => {
      const user = userEvent.setup();
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/trạng thái/i);
      await user.selectOptions(statusSelect, 'active');

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            isActive: true,
          }),
          'mock-token'
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination when multiple pages', async () => {
      mockListUsers.mockResolvedValue({
        success: true,
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
        },
      });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText(/hiển thị 1 đến 20 trong tổng số 50/i)).toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      mockListUsers.mockResolvedValue({
        success: true,
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
        },
      });

      const user = userEvent.setup();
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText(/tổng số 50/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByText('→');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          }),
          'mock-token'
        );
      });
    });
  });

  describe('Delete User', () => {
    it('should delete user when confirmed', async () => {
      global.confirm = jest.fn(() => true);
      mockDeleteUser.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Xóa');
      await user.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('User One')
      );

      await waitFor(() => {
        expect(mockDeleteUser).toHaveBeenCalledWith(
          'user-1',
          'mock-token',
          false,
          'Deleted by admin'
        );
      });
    });

    it('should not delete user when cancelled', async () => {
      global.confirm = jest.fn(() => false);

      const user = userEvent.setup();
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Xóa');
      await user.click(deleteButtons[0]);

      expect(mockDeleteUser).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when list users fails', async () => {
      mockListUsers.mockRejectedValue(new Error('Failed to load users'));

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
      });
    });

    it('should display error when delete fails', async () => {
      global.confirm = jest.fn(() => true);
      global.alert = jest.fn();
      mockDeleteUser.mockRejectedValue(new Error('Delete failed'));

      const user = userEvent.setup();
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Xóa');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('Delete failed')
        );
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no users', async () => {
      mockListUsers.mockResolvedValue({
        success: true,
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText(/không tìm thấy người dùng nào/i)).toBeInTheDocument();
      });
    });
  });
});

