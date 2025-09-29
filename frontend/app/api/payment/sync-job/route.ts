import { NextRequest, NextResponse } from 'next/server';
import PaymentSyncJob from '@/lib/payment-sync-job';

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra authorization (có thể thêm API key hoặc auth header)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SYNC_JOB_TOKEN || 'sync-job-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const syncJob = new PaymentSyncJob();
    const result = await syncJob.runSyncJob();

    return NextResponse.json({
      success: true,
      message: 'Payment sync job completed',
      data: result
    });
  } catch (error) {
    console.error('Error running payment sync job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Endpoint để kiểm tra trạng thái job
    return NextResponse.json({
      success: true,
      message: 'Payment sync job endpoint is ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 500 }
    );
  }
}
