import { NextResponse } from 'next/server';
import { bookingSchema } from '@/lib/schemas/booking';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validatedData = bookingSchema.parse(body);

    // Mock booking ID
    const bookingId = `BOOK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Log to console (simulating enqueue to RabbitMQ)
    console.log('[BOOKING REQUEST]', {
      bookingId,
      timestamp: new Date().toISOString(),
      data: validatedData,
      status: 'PENDING_CONFIRMATION',
    });

    // Return success
    return NextResponse.json(
      {
        ok: true,
        bookingId,
        message: 'Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn trong ít phút.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Validation error
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          ok: false,
          message: 'Dữ liệu không hợp lệ',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    // Server error
    return NextResponse.json(
      {
        ok: false,
        message: 'Có lỗi xảy ra, vui lòng thử lại sau',
      },
      { status: 500 }
    );
  }
}
