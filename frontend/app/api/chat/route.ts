import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Types cho function calling
interface FunctionCall {
    name: string;
    args: Record<string, any>;
}

/**
 * System prompt định nghĩa vai trò và hành vi của AI chatbot
 */
const SYSTEM_PROMPT = `Bạn là AI Assistant của hệ thống quản lý bệnh viện, chuyên hỗ trợ bệnh nhân đặt lịch khám.

**Vai trò của bạn:**
- Giúp bệnh nhân tìm bác sĩ phù hợp theo chuyên khoa và thời gian
- Hướng dẫn quy trình đặt lịch một cách thân thiện, dễ hiểu
- Giải đáp thắc mắc về lịch hẹn, thủ tục khám
- Xác nhận thông tin trước khi đặt lịch

**Nguyên tắc giao tiếp:**
1. **Thân thiện & Chuyên nghiệp**: Sử dụng ngôn ngữ lịch sự, dễ hiểu
2. **Chủ động hỏi thông tin cần thiết**: Nếu thiếu thông tin (ngày, chuyên khoa, triệu chứng), hãy hỏi lại
3. **Xác nhận trước khi đặt**: Luôn tóm tắt thông tin (bác sĩ, ngày giờ, lý do khám) trước khi gọi createAppointment
4. **Gợi ý thông minh**: 
   - Nếu không có slot trong ngày yêu cầu, đề xuất ngày gần nhất
   - Nếu bệnh nhân mô tả triệu chứng, gợi ý chuyên khoa phù hợp
5. **Xử lý lỗi nhẹ nhàng**: Nếu không tìm thấy bác sĩ/slot, giải thích rõ ràng và đưa ra phương án khác

**Quy trình đặt lịch:**
1. Thu thập: Chuyên khoa/triệu chứng → Ngày/giờ mong muốn
2. Tìm kiếm: searchAvailableDoctors
3. Hiển thị: Danh sách bác sĩ + getAvailableSlots
4. Xác nhận: Tóm tắt đầy đủ thông tin
5. Đặt lịch: createAppointment
6. Thông báo: Kết quả + hướng dẫn tiếp theo

**Lưu ý:**
- Luôn sử dụng định dạng ngày YYYY-MM-DD khi gọi functions
- Chỉ đặt lịch khi đã có đầy đủ: patientId, doctorId, slotId, reason
- Không tự ý thay đổi thông tin bệnh nhân đã cung cấp
- Khi bệnh nhân hỏi về triệu chứng bệnh, hãy gợi ý họ đặt lịch khám với chuyên khoa phù hợp thay vì tự chuẩn đoán`;

/**
 * Function declarations cho Gemini
 */
const functionDeclarations = [
    {
        name: 'searchAvailableDoctors',
        description: 'Tìm kiếm bác sĩ có sẵn theo chuyên khoa và thời gian mong muốn',
        parameters: {
            type: 'object',
            properties: {
                department: {
                    type: 'string',
                    description: 'Tên chuyên khoa (VD: Cardiology, Dermatology, Internal Medicine)',
                },
                date: {
                    type: 'string',
                    description: 'Ngày hẹn mong muốn (định dạng YYYY-MM-DD)',
                },
                timePreference: {
                    type: 'string',
                    enum: ['morning', 'afternoon', 'evening', 'any'],
                    description: 'Khung giờ ưa thích',
                },
            },
            required: ['date'],
        },
    },
    {
        name: 'getAvailableSlots',
        description: 'Lấy danh sách khung giờ trống của một bác sĩ cụ thể',
        parameters: {
            type: 'object',
            properties: {
                doctorId: {
                    type: 'string',
                    description: 'ID của bác sĩ',
                },
                date: {
                    type: 'string',
                    description: 'Ngày cần kiểm tra (định dạng YYYY-MM-DD)',
                },
            },
            required: ['doctorId', 'date'],
        },
    },
    {
        name: 'createAppointment',
        description: 'Tạo lịch hẹn mới cho bệnh nhân',
        parameters: {
            type: 'object',
            properties: {
                doctorId: {
                    type: 'string',
                    description: 'ID của bác sĩ',
                },
                slotId: {
                    type: 'string',
                    description: 'ID của khung giờ đã chọn',
                },
                reason: {
                    type: 'string',
                    description: 'Lý do khám bệnh',
                },
                notes: {
                    type: 'string',
                    description: 'Ghi chú bổ sung',
                },
            },
            required: ['doctorId', 'slotId', 'reason'],
        },
    },
    {
        name: 'getMyAppointments',
        description: 'Xem danh sách lịch hẹn của bệnh nhân hiện tại',
        parameters: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['upcoming', 'past', 'cancelled', 'all'],
                    description: 'Trạng thái lịch hẹn cần xem',
                },
            },
            required: [],
        },
    },
    {
        name: 'getDepartments',
        description: 'Lấy danh sách tất cả các chuyên khoa trong bệnh viện',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
];

/**
 * Xử lý function calls từ AI
 */
async function handleFunctionCall(
    functionCall: FunctionCall,
    userId: string | null
): Promise<any> {
    const { name, args } = functionCall;
    console.log(`[AI Chatbot] Function call: ${name}`, args);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    try {
        switch (name) {
            case 'searchAvailableDoctors': {
                const { department } = args;

                let searchTerm = null;
                if (department) {
                    const deptResponse = await fetch(`${baseUrl}/api/v1/departments`);
                    const deptData = await deptResponse.json();
                    const departments = Array.isArray(deptData) ? deptData : (deptData.data || []);

                    const dept = departments.find((d: any) =>
                        (d.nameEn && d.nameEn.toLowerCase().includes(department.toLowerCase())) ||
                        (d.nameVi && d.nameVi.toLowerCase().includes(department.toLowerCase()))
                    );

                    // Use department English name for better search results
                    searchTerm = dept?.nameEn || department;
                }

                const staffUrl = new URL(`${baseUrl}/api/v1/staff/search`);
                if (searchTerm) {
                    staffUrl.searchParams.set('searchTerm', searchTerm);
                }
                staffUrl.searchParams.set('staffType', 'doctor');
                staffUrl.searchParams.set('status', 'active');
                staffUrl.searchParams.set('limit', '5');

                const staffResponse = await fetch(staffUrl.toString());
                const staffData = await staffResponse.json();

                // FIX: Handle { data: [...] } response
                const doctors = Array.isArray(staffData) ? staffData : (staffData.data || []);

                return {
                    success: true,
                    doctors: doctors.map((doc: any) => ({
                        id: doc.id || doc.staffId,
                        name: `${doc.firstName || doc.first_name || ''} ${doc.lastName || doc.last_name || ''}`.trim(),
                        department: doc.department?.name || doc.departmentName || 'N/A',
                        specialization: doc.professionalDetails?.specialization || doc.professionalInfo?.specialization || 'General',
                        experience: doc.professionalDetails?.yearsOfExperience || doc.professionalInfo?.yearsOfExperience || 0,
                    })),
                    message: `Tìm thấy ${doctors.length} bác sĩ phù hợp`,
                };
            }

            case 'getAvailableSlots': {
                const { doctorId, date } = args;

                // Note: This endpoint might require auth. 
                // If it fails, the chatbot will report the error.
                const response = await fetch(
                    `${baseUrl}/api/v2/appointments/providers/${doctorId}/available-slots?date=${date}`
                );
                const slots = await response.json();

                return {
                    success: true,
                    slots: Array.isArray(slots) ? slots.map((slot: any) => ({
                        id: slot.id,
                        startTime: slot.startTime || slot.start_time,
                        endTime: slot.endTime || slot.end_time,
                        available: slot.available !== false,
                    })) : [],
                    date,
                    doctorId,
                };
            }

            case 'createAppointment': {
                if (!userId) {
                    return {
                        success: false,
                        message: 'Bạn cần đăng nhập để đặt lịch hẹn',
                    };
                }

                const { doctorId, slotId, reason, notes } = args;

                const response = await fetch(`${baseUrl}/api/v2/appointments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        patientId: userId,
                        providerId: doctorId,
                        slotId,
                        reason,
                        notes,
                        type: 'CONSULTATION',
                    }),
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ message: 'Không thể đặt lịch hẹn' }));
                    return {
                        success: false,
                        message: error.message || 'Không thể đặt lịch hẹn',
                    };
                }

                const appointment = await response.json();
                return {
                    success: true,
                    appointment,
                    message: 'Đặt lịch thành công!',
                };
            }

            case 'getMyAppointments': {
                if (!userId) {
                    return {
                        success: false,
                        message: 'Bạn cần đăng nhập để xem lịch hẹn',
                    };
                }

                const { status } = args;
                const url = new URL(`${baseUrl}/api/v2/patients/${userId}/appointments`);
                if (status && status !== 'all') {
                    url.searchParams.set('status', status.toUpperCase());
                }

                const response = await fetch(url.toString());
                const data = await response.json();
                // FIX: Handle { data: [...] } response
                const appointments = Array.isArray(data) ? data : (data.data || []);

                return {
                    success: true,
                    appointments: appointments,
                    count: appointments.length,
                };
            }

            case 'getDepartments': {
                const response = await fetch(`${baseUrl}/api/v1/departments`);
                const data = await response.json();
                // FIX: Handle { data: [...] } response
                const departments = Array.isArray(data) ? data : (data.data || []);

                return {
                    success: true,
                    departments: departments.map((dept: any) => ({
                        id: dept.id,
                        name: dept.nameEn,
                        nameVi: dept.nameVi,
                        description: dept.description,
                    })),
                };
            }

            default:
                return {
                    success: false,
                    message: `Unknown function: ${name}`,
                };
        }
    } catch (error: any) {
        console.error(`[AI Chatbot] Error executing function ${name}:`, error);
        return {
            success: false,
            message: `Lỗi khi thực hiện ${name}: ${error.message}`,
        };
    }
}

/**
 * POST /api/chat - Main chat endpoint
 */
export async function POST(req: NextRequest) {
    try {
        const { messages, userId } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Invalid request: messages array required' },
                { status: 400 }
            );
        }

        // Kiểm tra API key
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            );
        }

        // Initialize model với function calling
        // Gemini 2.5 Flash - Best for function calling & chatbots
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash', // Newest stable model with function calling
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            },
        });

        // Format messages cho Gemini
        const chatHistory = messages.slice(0, -1).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const userMessage = messages[messages.length - 1].content;

        // Start chat với history
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Được rồi, tôi đã hiểu vai trò của mình. Tôi sẵn sàng hỗ trợ bệnh nhân đặt lịch khám!' }],
                },
                ...chatHistory,
            ],
            tools: [{ functionDeclarations: functionDeclarations as any }],
        });

        // Send message
        let result = await chat.sendMessage(userMessage);
        let response = result.response;

        // Xử lý function calls (có thể có nhiều vòng)
        let functionResults: any[] = [];
        let maxIterations = 5;
        let iteration = 0;

        while (iteration < maxIterations) {
            const functionCall = response.functionCalls()?.[0];

            if (!functionCall) {
                // Không còn function call, trả về response
                break;
            }

            // Execute function
            const functionResult = await handleFunctionCall(
                {
                    name: functionCall.name,
                    args: functionCall.args,
                },
                userId
            );

            functionResults.push({
                name: functionCall.name,
                result: functionResult,
            });

            // Gửi function result về cho AI
            result = await chat.sendMessage([
                {
                    functionResponse: {
                        name: functionCall.name,
                        response: functionResult,
                    },
                },
            ]);

            response = result.response;
            iteration++;
        }

        // Extract text response
        const text = response.text();

        return NextResponse.json({
            message: text,
            functionCalls: functionResults,
        });

    } catch (error: any) {
        console.error('[AI Chatbot] Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message,
            },
            { status: 500 }
        );
    }
}
