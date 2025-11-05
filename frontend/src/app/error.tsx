'use client';

import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800">
            Đã xảy ra lỗi
          </h1>
          
          <p className="text-gray-600">
            Rất tiếc, đã có lỗi xảy ra khi tải trang. Vui lòng thử lại hoặc liên hệ hỗ trợ.
          </p>
          
          {error.digest && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Mã lỗi: {error.digest}
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={reset}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
          
          <Link href="/">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Home className="h-4 w-4" />
              Trang chủ
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>
            Cần hỗ trợ? Liên hệ:{' '}
            <a href="tel:1900-1234" className="text-blue-600 hover:underline">
              1900-1234
            </a>
          </p>
          <p>
            Email:{' '}
            <a href="mailto:support@medicare.vn" className="text-blue-600 hover:underline">
              support@medicare.vn
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}