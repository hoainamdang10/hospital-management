import { NextApiRequest, NextApiResponse } from 'next';

interface CashPaymentCreateRequest {
  appointmentId: string;
  amount: number;
  description?: string;
  paymentMethod: 'cash';
}

interface CashPaymentCreateResponse {
  success: boolean;
  data?: {
    id: string;
    orderCode: string;
    appointmentId: string;
    amount: number;
    description: string;
    paymentMethod: 'cash';
    status: 'pending';
    createdAt: string;
  };
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CashPaymentCreateResponse>) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Chỉ hỗ trợ phương thức POST.'
    });
  }

  try {
    // Validate request body
    const { appointmentId, amount, description, paymentMethod }: CashPaymentCreateRequest = req.body;

    if (!appointmentId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Vui lòng cung cấp mã cuộc hẹn và số tiền thanh toán.'
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Số tiền thanh toán không hợp lệ.'
      });
    }

    // Validate payment method
    if (paymentMethod !== 'cash') {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method',
        message: 'Phương thức thanh toán không hợp lệ.'
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
    const response = await fetch(`${apiGatewayUrl}/api/payments/cash/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        appointmentId,
        amount,
        description: description || `Thanh toán tiền mặt cho cuộc hẹn ${appointmentId}`,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Cash payment create error:', responseData);
      return res.status(response.status).json({
        success: false,
        error: responseData.error || 'Cash payment creation failed',
        message: responseData.message || 'Không thể tạo phiếu thanh toán tiền mặt. Vui lòng thử lại.'
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      data: responseData.data,
      message: responseData.message || 'Tạo phiếu thanh toán tiền mặt thành công.'
    });

  } catch (error) {
    console.error('Cash payment create API error:', error);
    
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
      message: 'Có lỗi xảy ra khi tạo thanh toán tiền mặt. Vui lòng thử lại.'
    });
  }
}
