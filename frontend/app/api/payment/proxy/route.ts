import { NextRequest, NextResponse } from 'next/server';

/**
 * Payment Proxy Route - Forwards requests to Payment Service via API Gateway
 * This implements the microservice architecture pattern:
 * Frontend → API Gateway → Payment Service → PayOS API
 */

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100';

interface PaymentProxyRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentProxyRequest = await request.json();
    const { endpoint, method, data } = body;

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required'
        }
      }, { status: 401 });
    }

    // Validate endpoint
    const allowedEndpoints = [
      '/api/payments/payos/create',
      '/api/payments/cash/create',
      '/api/payments/verify',
      '/api/payments/history',
      '/api/payments/receipt'
    ];

    if (!allowedEndpoints.some(allowed => endpoint.startsWith(allowed))) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ENDPOINT',
          message: 'Endpoint not allowed'
        }
      }, { status: 400 });
    }

    // Forward request to API Gateway → Payment Service
    const response = await fetch(`${API_GATEWAY_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    return NextResponse.json(responseData, { 
      status: response.status 
    });

  } catch (error: any) {
    console.error('Payment proxy error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'PROXY_ERROR',
        message: 'Failed to forward request to payment service'
      }
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Check if API Gateway is reachable
    const response = await fetch(`${API_GATEWAY_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });

    const isHealthy = response.ok;

    return NextResponse.json({
      success: true,
      service: 'Payment Proxy',
      status: isHealthy ? 'healthy' : 'unhealthy',
      apiGateway: {
        url: API_GATEWAY_URL,
        status: isHealthy ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      service: 'Payment Proxy',
      status: 'unhealthy',
      error: 'Cannot connect to API Gateway',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
