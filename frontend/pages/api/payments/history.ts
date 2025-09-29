import { NextApiRequest, NextApiResponse } from 'next';

interface PaymentHistoryItem {
  id: string;
  orderCode: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  transactionId?: string;
  paidAt?: string;
  failureReason?: string;
  appointmentId: string;
  description: string;
  paymentMethod: 'payos' | 'cash';
  createdAt: string;
  updatedAt: string;
  patientInfo?: {
    doctorName: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
  };
}

interface PaymentHistoryResponse {
  success: boolean;
  data?: {
    payments: PaymentHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PaymentHistoryResponse>) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Chỉ hỗ trợ phương thức GET.'
    });
  }

  try {
    // Get query parameters with defaults
    const { 
      page = '1', 
      limit = '10', 
      status = 'all', 
      method = 'all' 
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters',
        message: 'Tham số phân trang không hợp lệ.'
      });
    }

    // Get authorization header from request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Vui lòng đăng nhập để tiếp tục.'
      });
    }

    // Build query string
    const queryParams = new URLSearchParams({
      page: pageNum.toString(),
      limit: limitNum.toString(),
      status: status as string,
      method: method as string
    });

    // Get API Gateway URL from environment
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100';
    
    // Forward request to API Gateway -> Payment Service
    const response = await fetch(`${apiGatewayUrl}/api/payments/history?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Payment history error:', responseData);
      return res.status(response.status).json({
        success: false,
        error: responseData.error || 'Failed to fetch payment history',
        message: responseData.message || 'Không thể tải lịch sử thanh toán. Vui lòng thử lại.'
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      data: responseData.data,
      message: responseData.message || 'Tải lịch sử thanh toán thành công.'
    });

  } catch (error) {
    console.error('Payment history API error:', error);
    
    // Handle network errors
    if (error instanceof Error && error.message.includes('fetch')) {
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'Dịch vụ thanh toán tạm thời không khả dụng. Vui lòng thử lại sau.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải lịch sử thanh toán. Vui lòng thử lại.'
    });
  }
}
