import { NextApiRequest, NextApiResponse } from 'next';

interface PayOSCreateRequest {
  appointmentId: string;
  amount: number;
  description: string;
  serviceName: string;
  patientInfo?: {
    doctorName: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
  };
}

interface PayOSCreateResponse {
  success: boolean;
  data?: {
    orderCode: string;
    checkoutUrl: string;
    qrCode: string;
    amount: number;
    paymentLinkId: string;
  };
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PayOSCreateResponse>) {
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
    const { appointmentId, amount, description, serviceName, patientInfo }: PayOSCreateRequest = req.body;

    if (!appointmentId || !amount || !description || !serviceName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Vui lòng cung cấp đầy đủ thông tin thanh toán.'
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
    const response = await fetch(`${apiGatewayUrl}/api/payments/payos/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        appointmentId,
        amount,
        description,
        serviceName,
        patientInfo
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('PayOS create payment error:', responseData);
      return res.status(response.status).json({
        success: false,
        error: responseData.error || 'Payment creation failed',
        message: responseData.message || 'Không thể tạo liên kết thanh toán. Vui lòng thử lại.'
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      data: responseData.data,
      message: responseData.message || 'Tạo liên kết thanh toán thành công.'
    });

  } catch (error) {
    console.error('PayOS create API error:', error);
    
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
      message: 'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.'
    });
  }
}
