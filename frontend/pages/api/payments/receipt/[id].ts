import { NextApiRequest, NextApiResponse } from 'next';

interface PaymentReceiptResponse {
  success: boolean;
  data?: {
    id: string;
    orderCode: string;
    amount: number;
    status: string;
    transactionId?: string;
    paidAt?: string;
    appointmentId: string;
    description: string;
    paymentMethod: 'payos' | 'cash';
    createdAt: string;
    patientInfo?: {
      doctorName: string;
      department: string;
      appointmentDate: string;
      timeSlot: string;
    };
    receiptUrl?: string;
  };
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PaymentReceiptResponse | Buffer>) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Chỉ hỗ trợ phương thức GET.'
    });
  }

  try {
    // Get payment ID from route parameters
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing payment ID',
        message: 'Vui lòng cung cấp ID thanh toán.'
      });
    }

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment ID format',
        message: 'ID thanh toán không hợp lệ.'
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

    // Check if PDF download is requested
    const { format } = req.query;
    const isPdfRequest = format === 'pdf';

    // Get API Gateway URL from environment
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100';
    
    // Determine the endpoint based on format
    const endpoint = isPdfRequest 
      ? `/api/payments/receipt/${id}/pdf`
      : `/api/payments/receipt/${id}`;

    // Forward request to API Gateway -> Payment Service
    const response = await fetch(`${apiGatewayUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const responseData = await response.json();
      console.error('Payment receipt error:', responseData);
      return res.status(response.status).json({
        success: false,
        error: responseData.error || 'Failed to fetch payment receipt',
        message: responseData.message || 'Không thể tải hóa đơn thanh toán. Vui lòng thử lại.'
      });
    }

    // Handle PDF response
    if (isPdfRequest) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/pdf')) {
        // Stream PDF response
        const buffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt-${id}.pdf"`);
        res.setHeader('Content-Length', buffer.byteLength.toString());
        
        return res.send(Buffer.from(buffer));
      } else {
        // PDF generation not implemented yet
        return res.status(501).json({
          success: false,
          error: 'PDF generation not implemented',
          message: 'Tính năng tạo PDF chưa được triển khai.'
        });
      }
    }

    // Handle JSON response
    const responseData = await response.json();

    // Return successful response
    return res.status(200).json({
      success: true,
      data: responseData.data,
      message: responseData.message || 'Tải hóa đơn thanh toán thành công.'
    });

  } catch (error) {
    console.error('Payment receipt API error:', error);
    
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
      message: 'Có lỗi xảy ra khi tải hóa đơn thanh toán. Vui lòng thử lại.'
    });
  }
}
