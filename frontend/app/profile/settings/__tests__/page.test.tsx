/**
 * Profile Settings Page Tests
 * 
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileSettingsPage from '../page';
import * as identityService from '@/modules/identity/services/identityService';

jest.mock('@/modules/identity/services/identityService');

const mockGetUser = identityService.getUser as jest.MockedFunction<typeof identityService.getUser>;
const mockUpdateUser = identityService.updateUser as jest.MockedFunction<typeof identityService.updateUser>;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  phoneNumber: '0123456789',
  role: 'PATIENT',
  isActive: true,
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('ProfileSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'accessToken') return 'mock-token';
      if (key === 'userId') return 'user-123';
      return null;
    });

    Storage.prototype.setItem = jest.fn();

    mockGetUser.mockResolvedValue(mockUser);
  });

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', () => {
      Storage.prototype.getItem = jest.fn(() => null);
      
      render(<ProfileSettingsPage />);
      
      expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
    });

    it('should load user profile on mount', async () => {
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalledWith('user-123', 'mock-token');
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('0123456789')).toBeInTheDocument();
      });
    });
  });

  describe('User Information Display', () => {
    it('should display user email', async () => {
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('should display user role badge', async () => {
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Bệnh nhân')).toBeInTheDocument();
      });
    });

    it('should display active status', async () => {
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Hoạt động')).toBeInTheDocument();
      });
    });

    it('should display email verification status', async () => {
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Có')).toBeInTheDocument();
      });
    });
  });

  describe('Form Editing', () => {
    it('should allow editing full name', async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/họ và tên/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
    });

    it('should allow editing phone number', async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('0123456789')).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/số điện thoại/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '0987654321');

      expect(screen.getByDisplayValue('0987654321')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };
      mockUpdateUser.mockResolvedValue(updatedUser);

      const user = userEvent.setup();
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/họ và tên/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith(
          'user-123',
          {
            fullName: 'Updated Name',
            phoneNumber: '0123456789',
          },
          'mock-token'
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/cập nhật thông tin thành công/i)).toBeInTheDocument();
      });
    });

    it('should update localStorage after successful update', async () => {
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };
      mockUpdateUser.mockResolvedValue(updatedUser);

      const user = userEvent.setup();
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/họ và tên/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(Storage.prototype.setItem).toHaveBeenCalledWith('userName', 'Updated Name');
      });
    });

    it('should show loading state during submission', async () => {
      mockUpdateUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i });
      await user.click(submitButton);

      expect(screen.getByText(/đang lưu/i)).toBeInTheDocument();
    });

    it('should display error on update failure', async () => {
      mockUpdateUser.mockRejectedValue(new Error('Update failed'));

      const user = userEvent.setup();
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /lưu thay đổi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Reset', () => {
    it('should reset form to original values', async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/họ và tên/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');

      const cancelButton = screen.getByRole('button', { name: /hủy thay đổi/i });
      await user.click(cancelButton);

      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have link to dashboard', async () => {
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      const dashboardLink = screen.getByText(/quay lại dashboard/i);
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('should have links to other profile pages', async () => {
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /bảo mật/i })).toHaveAttribute('href', '/profile/security');
      expect(screen.getByRole('link', { name: /phiên đăng nhập/i })).toHaveAttribute('href', '/profile/sessions');
    });
  });

  describe('Error Handling', () => {
    it('should display error when user load fails', async () => {
      mockGetUser.mockRejectedValue(new Error('Failed to load user'));

      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load user/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should require full name', async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/họ và tên/i);
      expect(nameInput).toBeRequired();
    });

    it('should require phone number', async () => {
      render(<ProfileSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('0123456789')).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/số điện thoại/i);
      expect(phoneInput).toBeRequired();
    });
  });
});

