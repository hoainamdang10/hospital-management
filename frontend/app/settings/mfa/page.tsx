'use client';

import { useState } from 'react';
import { Shield, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function MFASetupPage() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [qrCode] = useState('https://via.placeholder.com/200');
  const [secretKey] = useState('ABCD EFGH IJKL MNOP');
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xác thực 2 bước (2FA)</h1>
          <p className="mt-2 text-gray-600">Tăng cường bảo mật tài khoản</p>
        </div>

        {!isEnabled ? (
          <div className="space-y-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center space-x-3">
                <div className="rounded-full bg-primary-100 p-3">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Cài đặt xác thực 2 bước</h3>
                  <p className="text-sm text-gray-600">Quét mã QR bằng ứng dụng xác thực</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code" className="rounded-lg border" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hoặc nhập mã thủ công
                  </label>
                  <div className="mt-2 flex items-center space-x-2">
                    <code className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-mono text-sm">
                      {secretKey}
                    </code>
                    <Button variant="outline" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mã xác thực (6 chữ số)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-center font-mono text-lg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <Button className="w-full" onClick={() => setIsEnabled(true)}>
                  Kích hoạt 2FA
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-2 font-semibold text-blue-900">Ứng dụng đề xuất:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Google Authenticator</li>
                <li>• Microsoft Authenticator</li>
                <li>• Authy</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-green-100 p-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">2FA đã được kích hoạt</h3>
                  <p className="text-sm text-gray-600">Tài khoản của bạn đã được bảo vệ</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsEnabled(false)}>
                Tắt 2FA
              </Button>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                Mỗi khi đăng nhập, bạn sẽ cần nhập mã xác thực từ ứng dụng.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
