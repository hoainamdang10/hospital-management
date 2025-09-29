import { NextRequest, NextResponse } from 'next/server';
import PaymentRecoveryJob from '@/lib/payment-recovery-job';

export async function POST(request: NextRequest) {
    try {
        // Kiểm tra authorization
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.SYNC_JOB_TOKEN || 'sync-job-secret-token';
        
        if (authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const hours = body.hours || 24; // Mặc định kiểm tra 24h qua

        const recoveryJob = new PaymentRecoveryJob();
        const result = await recoveryJob.recoverMissingTransactions(hours);

        return NextResponse.json({
            success: true,
            message: 'Payment recovery completed',
            data: result
        });

    } catch (error) {
        console.error('Error in recovery API:', error);
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
        const { searchParams } = new URL(request.url);
        const hours = parseInt(searchParams.get('hours') || '24');
        const action = searchParams.get('action') || 'check';

        const recoveryJob = new PaymentRecoveryJob();

        if (action === 'check') {
            // Chỉ kiểm tra, không khôi phục
            const analysis = await recoveryJob.findMissingTransactions(hours);
            
            return NextResponse.json({
                success: true,
                message: 'Analysis completed',
                data: analysis
            });
        } else if (action === 'recover') {
            // Kiểm tra và khôi phục
            const result = await recoveryJob.recoverMissingTransactions(hours);
            
            return NextResponse.json({
                success: true,
                message: 'Recovery completed',
                data: result
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Invalid action. Use "check" or "recover"'
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Error in recovery API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
