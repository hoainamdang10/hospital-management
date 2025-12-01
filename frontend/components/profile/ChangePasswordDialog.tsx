'use client';

import { useState, type ReactNode } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button, type ButtonProps } from '@/components/ui/button';
import { toast } from 'sonner';
import { authService } from '@/lib/api/auth.service';

type ChangePasswordDialogProps = {
  /**
   * Supplied userId (from AuthContext) required by backend route /api/v1/users/:userId/change-password
   */
  userId?: string;
  /**
   * Optional custom trigger. When undefined, a default outline button is rendered.
   */
  trigger?: ReactNode;
  /**
   * Allow overriding variant/size for default trigger button.
   */
  triggerVariant?: ButtonProps['variant'];
  triggerSize?: ButtonProps['size'];
};

const initialFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  invalidateOtherSessions: true,
};

export function ChangePasswordDialog({
  userId,
  trigger,
  triggerVariant = 'outline',
  triggerSize = 'default',
}: ChangePasswordDialogProps) {
  const envMinLength =
    typeof process.env.NEXT_PUBLIC_PASSWORD_MIN_LENGTH === 'string'
      ? Number(process.env.NEXT_PUBLIC_PASSWORD_MIN_LENGTH)
      : undefined;
  const minPasswordLength = Number.isFinite(envMinLength) && envMinLength! >= 6 ? envMinLength! : 8;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    Boolean(userId) &&
    form.currentPassword.trim().length > 0 &&
    form.newPassword.trim().length >= minPasswordLength &&
    form.confirmPassword.trim().length >= minPasswordLength;

  const handleClose = () => {
    setOpen(false);
    setForm(initialFormState);
    setError(null);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      toast.error('Không xác định được tài khoản để đổi mật khẩu.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    if (form.newPassword === form.currentPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.changePassword(userId, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
        invalidateOtherSessions: form.invalidateOtherSessions,
      });

      toast.success(response.message || 'Đã đổi mật khẩu thành công.');
      handleClose();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      setError(message);
      toast.error('Đổi mật khẩu thất bại', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={triggerVariant} size={triggerSize} disabled={!userId}>
            <KeyRound className="mr-2 h-4 w-4" />
            Đổi mật khẩu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>
            Cập nhật mật khẩu đăng nhập để bảo vệ tài khoản của bạn. Phiên đăng nhập khác sẽ bị đăng
            xuất.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu hiện tại"
              value={form.currentPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={minPasswordLength}
              placeholder={`ít nhất ${minPasswordLength} ký tự, bao gồm chữ và số`}
              value={form.newPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500">
              Mật khẩu cần có tối thiểu {minPasswordLength} ký tự, gồm chữ hoa, chữ thường và số.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={minPasswordLength}
              placeholder="Nhập lại mật khẩu mới"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={form.invalidateOtherSessions}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, invalidateOtherSessions: e.target.checked }))
              }
            />
            <span>
              <span className="font-medium text-gray-900">Đăng xuất khỏi các thiết bị khác</span>
              <br />
              <span className="text-xs text-gray-600">
                Tăng bảo mật bằng cách buộc đăng nhập lại trên toàn bộ phiên.
              </span>
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Mật khẩu được mã hóa và tuân thủ chính sách bảo mật của hệ thống.
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Đang đổi...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
