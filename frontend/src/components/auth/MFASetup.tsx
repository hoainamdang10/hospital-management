"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { authService } from "./services";
import { Shield, CheckCircle, XCircle, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";

export function MFASetup() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"setup" | "verify" | "enabled">("setup");
  const [method, setMethod] = useState<"2fa_app" | "sms" | "email">("2fa_app");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = () => {
    const isEnabled = authService.isMfaEnabled();
    setMfaEnabled(isEnabled);
    if (isEnabled) {
      setStep("enabled");
    }
  };

  const handleEnableMFA = async () => {
    const user = authService.getCurrentUser();
    if (!user?.id) {
      setError("Không tìm thấy thông tin người dùng");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await authService.enableMfa(user.id, method);
      if (response.success && response.data) {
        setQrCode(response.data.qrCode || "");
        setSecret(response.data.secret || "");
        setBackupCodes(response.data.backupCodes || []);
        setStep("verify");
        toast.success("Quét mã QR để hoàn tất thiết lập MFA");
      } else {
        setError(response.error || "Không thể bật MFA");
      }
    } catch (err) {
      setError("Lỗi thiết lập MFA. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = authService.getCurrentUser();
    if (!user?.id || !code) {
      setError("Vui lòng nhập mã xác thực");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await authService.verifyMfa(
        user.id,
        code,
        "enable",
        method
      );
      if (response.success) {
        setMfaEnabled(true);
        setStep("enabled");
        toast.success("MFA đã được bật thành công!");
      } else {
        setError(response.error || "Mã xác thực không đúng");
      }
    } catch (err) {
      setError("Lỗi xác thực MFA. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = authService.getCurrentUser();
    if (!user?.id || !password) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await authService.disableMfa(user.id, password);
      if (response.success) {
        setMfaEnabled(false);
        setStep("setup");
        setPassword("");
        toast.success("MFA đã được tắt");
      } else {
        setError(response.error || "Mật khẩu không đúng");
      }
    } catch (err) {
      setError("Lỗi tắt MFA. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "enabled") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">MFA đã được bật</CardTitle>
          <CardDescription>
            Xác thực 2 bước đã được kích hoạt cho tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupCodes.length > 0 && (
            <Alert className="mb-4">
              <AlertDescription>
                <strong>Lưu mã dự phòng:</strong>
                <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, idx) => (
                    <div key={idx}>{code}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleDisableMFA} className="space-y-4">
            <div>
              <Label htmlFor="password-disable">Mật khẩu để tắt MFA</Label>
              <Input
                id="password-disable"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Nhập mật khẩu"
              />
            </div>
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tắt...
                </>
              ) : (
                "Tắt MFA"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Xác thực MFA</CardTitle>
          <CardDescription>
            Quét mã QR bằng ứng dụng xác thực và nhập mã 6 số
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {qrCode && (
            <div className="mb-4 flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
          )}

          {secret && (
            <Alert className="mb-4">
              <AlertDescription>
                <strong>Mã bí mật (nếu không quét được QR):</strong>
                <div className="mt-2 font-mono text-sm">{secret}</div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerifyAndEnable} className="space-y-4">
            <div>
              <Label htmlFor="code">Mã xác thực 6 số</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("setup")}
                disabled={loading}
              >
                Quay lại
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  "Xác thực"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Thiết lập MFA</CardTitle>
        <CardDescription>
          Bật xác thực 2 bước để bảo vệ tài khoản của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="method">Phương thức xác thực</Label>
            <select
              id="method"
              value={method}
              onChange={(e) =>
                setMethod(e.target.value as "2fa_app" | "sms" | "email")
              }
              className="w-full px-3 py-2 border rounded-md"
              disabled={loading}
            >
              <option value="2fa_app">Ứng dụng xác thực (Google Authenticator, Authy)</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </div>

          <Button
            className="w-full"
            onClick={handleEnableMFA}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang thiết lập...
              </>
            ) : (
              "Bật MFA"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

