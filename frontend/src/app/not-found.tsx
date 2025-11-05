import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-blue-600">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">
            Trang không tìm thấy
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Home className="h-4 w-4" />
              Trang chủ
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>Cần hỗ trợ? Liên hệ: <a href="tel:1900-1234" className="text-blue-600 hover:underline">1900-1234</a></p>
        </div>
      </div>
    </div>
  );
}