import { NextApiRequest, NextApiResponse } from 'next';

interface PayOSVerifyResponse {
  success: boolean;
  data?: {
    id: string;
    orderCode: string;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    transactionId?: string;
    paidAt?: string;
    failureReason?: string;
    appointmentId: string;
    description: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PayOSVerifyResponse>) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Chỉ hỗ trợ phương thức GET.'
    });
  }

  try {
    // Get orderCode from query parameters
    const { orderCode } = req.query;

    if (!orderCode || typeof orderCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing order code',
        message: 'Vui lòng cung cấp mã đơn hàng.'
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

    // Get API Gateway URL from environment
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100';
    
    // Forward request to API Gateway -> Payment Service
    const response = await fetch(`${apiGatewayUrl}/api/payments/payos/verify?orderCode=${encodeURIComponent(orderCode)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('PayOS verify payment error:', responseData);
      return res.status(response.status).json({
        success: false,
        error: responseData.error || 'Payment verification failed',
        message: responseData.message || 'Không thể xác minh trạng thái thanh toán. Vui lòng thử lại.'
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      data: responseData.data,
      message: responseData.message || 'Xác minh thanh toán thành công.'
    });

  } catch (error) {
    console.error('PayOS verify API error:', error);
    
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
      message: 'Có lỗi xảy ra khi xác minh thanh toán. Vui lòng thử lại.'
    });
  }
}
