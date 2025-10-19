/**
 * Security Settings Page Tests
 * 
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SecuritySettingsPage from '../page';
import * as identityService from '@/modules/identity/services/identityService';

jest.mock('@/modules/identity/services/identityService');

const mockChangePassword = identityService.changePassword as jest.MockedFunction<typeof identityService.changePassword>;
const mockEnableMFA = identityService.enableMFA as jest.MockedFunction<typeof identityService.enableMFA>;
const mockDisableMFA = identityService.disableMFA as jest.MockedFunction<typeof identityService.disableMFA>;

describe('SecuritySettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'accessToken') return 'mock-token';
      if (key === 'userId') return 'user-123';
      return null;
    });

    global.prompt = jest.fn();
  });

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', () => {
      Storage.prototype.getItem = jest.fn(() => null);
      
      render(<SecuritySettingsPage />);
      
      expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
    });

    it('should render page when authenticated', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/đổi mật khẩu/i)).toBeInTheDocument();
      });
    });
  });

  describe('Change Password Form', () => {
    it('should render password change form', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/mật khẩu hiện tại/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/mật khẩu mới/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/xác nhận mật khẩu mới/i)).toBeInTheDocument();
      });
    });

    it('should change password successfully', async () => {
      mockChangePassword.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/mật khẩu hiện tại/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'oldPassword123');
      await user.type(screen.getByLabelText(/mật khẩu mới/i), 'newPassword123');
      await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), 'newPassword123');

      const submitButton = screen.getByRole('button', { name: /đổi mật khẩu/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith(
          'user-123',
          {
            currentPassword: 'oldPassword123',
            newPassword: 'newPassword123',
            confirmPassword: 'newPassword123',
          },
          'mock-token'
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/đổi mật khẩu thành công/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/mật khẩu hiện tại/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'oldPassword123');
      await user.type(screen.getByLabelText(/mật khẩu mới/i), 'newPassword123');
      await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), 'differentPassword');

      const submitButton = screen.getByRole('button', { name: /đổi mật khẩu/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/mật khẩu mới và xác nhận mật khẩu không khớp/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/mật khẩu hiện tại/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'oldPassword123');
      await user.type(screen.getByLabelText(/mật khẩu mới/i), 'short');
      await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), 'short');

      const submitButton = screen.getByRole('button', { name: /đổi mật khẩu/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/mật khẩu mới phải có ít nhất 8 ký tự/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should clear form after successful password change', async () => {
      mockChangePassword.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/mật khẩu hiện tại/i)).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText(/mật khẩu hiện tại/i) as HTMLInputElement;
      const newPasswordInput = screen.getByLabelText(/mật khẩu mới/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/xác nhận mật khẩu mới/i) as HTMLInputElement;

      await user.type(currentPasswordInput, 'oldPassword123');
      await user.type(newPasswordInput, 'newPassword123');
      await user.type(confirmPasswordInput, 'newPassword123');

      const submitButton = screen.getByRole('button', { name: /đổi mật khẩu/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(currentPasswordInput.value).toBe('');
        expect(newPasswordInput.value).toBe('');
        expect(confirmPasswordInput.value).toBe('');
      });
    });

    it('should display error on password change failure', async () => {
      mockChangePassword.mockRejectedValue(new Error('Current password is incorrect'));

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/mật khẩu hiện tại/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'wrongPassword');
      await user.type(screen.getByLabelText(/mật khẩu mới/i), 'newPassword123');
      await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), 'newPassword123');

      const submitButton = screen.getByRole('button', { name: /đổi mật khẩu/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });
    });
  });

  describe('MFA Settings', () => {
    it('should render MFA section', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/xác thực hai yếu tố \(mfa\)/i)).toBeInTheDocument();
        expect(screen.getByText(/chưa kích hoạt/i)).toBeInTheDocument();
      });
    });

    it('should enable MFA successfully', async () => {
      mockEnableMFA.mockResolvedValue({
        qrCode: 'data:image/png;base64,mockQRCode',
        secret: 'MOCK-SECRET-KEY',
      });

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/chưa kích hoạt/i)).toBeInTheDocument();
      });

      const enableButton = screen.getByRole('button', { name: /kích hoạt mfa/i });
      await user.click(enableButton);

      await waitFor(() => {
        expect(mockEnableMFA).toHaveBeenCalledWith('user-123', 'mock-token');
      });

      await waitFor(() => {
        expect(screen.getByText(/mfa đã được kích hoạt/i)).toBeInTheDocument();
        expect(screen.getByAltText(/mfa qr code/i)).toBeInTheDocument();
        expect(screen.getByText('MOCK-SECRET-KEY')).toBeInTheDocument();
      });
    });

    it('should disable MFA with password confirmation', async () => {
      global.prompt = jest.fn(() => 'myPassword123');
      mockDisableMFA.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/chưa kích hoạt/i)).toBeInTheDocument();
      });

      // First enable MFA
      mockEnableMFA.mockResolvedValue({
        qrCode: 'data:image/png;base64,mockQRCode',
        secret: 'MOCK-SECRET-KEY',
      });

      const enableButton = screen.getByRole('button', { name: /kích hoạt mfa/i });
      await user.click(enableButton);

      await waitFor(() => {
        expect(screen.getByText(/đã kích hoạt/i)).toBeInTheDocument();
      });

      // Then disable MFA
      const disableButton = screen.getByRole('button', { name: /tắt mfa/i });
      await user.click(disableButton);

      expect(global.prompt).toHaveBeenCalledWith(expect.stringContaining('Nhập mật khẩu'));

      await waitFor(() => {
        expect(mockDisableMFA).toHaveBeenCalledWith('user-123', 'myPassword123', 'mock-token');
      });

      await waitFor(() => {
        expect(screen.getByText(/mfa đã được tắt/i)).toBeInTheDocument();
      });
    });

    it('should not disable MFA if password prompt is cancelled', async () => {
      global.prompt = jest.fn(() => null);

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/chưa kích hoạt/i)).toBeInTheDocument();
      });

      // Enable MFA first
      mockEnableMFA.mockResolvedValue({
        qrCode: 'data:image/png;base64,mockQRCode',
        secret: 'MOCK-SECRET-KEY',
      });

      const enableButton = screen.getByRole('button', { name: /kích hoạt mfa/i });
      await user.click(enableButton);

      await waitFor(() => {
        expect(screen.getByText(/đã kích hoạt/i)).toBeInTheDocument();
      });

      // Try to disable MFA
      const disableButton = screen.getByRole('button', { name: /tắt mfa/i });
      await user.click(disableButton);

      expect(mockDisableMFA).not.toHaveBeenCalled();
    });

    it('should display error on MFA enable failure', async () => {
      mockEnableMFA.mockRejectedValue(new Error('MFA enable failed'));

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/chưa kích hoạt/i)).toBeInTheDocument();
      });

      const enableButton = screen.getByRole('button', { name: /kích hoạt mfa/i });
      await user.click(enableButton);

      await waitFor(() => {
        expect(screen.getByText(/mfa enable failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should have links to other profile pages', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/đổi mật khẩu/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /thông tin cá nhân/i })).toHaveAttribute('href', '/profile/settings');
      expect(screen.getByRole('link', { name: /phiên đăng nhập/i })).toHaveAttribute('href', '/profile/sessions');
    });
  });

  describe('Form Validation', () => {
    it('should require all password fields', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/mật khẩu hiện tại/i)).toBeRequired();
        expect(screen.getByLabelText(/mật khẩu mới/i)).toBeRequired();
        expect(screen.getByLabelText(/xác nhận mật khẩu mới/i)).toBeRequired();
      });
    });

    it('should enforce minimum password length', async () => {
      render(<SecuritySettingsPage />);

      await waitFor(() => {
        const newPasswordInput = screen.getByLabelText(/mật khẩu mới/i);
        expect(newPasswordInput).toHaveAttribute('minLength', '8');
      });
    });
  });
});

