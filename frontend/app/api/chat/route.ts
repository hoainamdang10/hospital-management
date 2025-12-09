import { NextRequest, NextResponse } from 'next/server';
import { buildDynamicSystemPrompt } from '@/components/ChatBot/contextPromptBuilder';
import type { ChatContext } from '@/components/ChatBot/types';

interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

type AuthorizedFetch = (url: string, init?: RequestInit) => Promise<Response>;

type GroqResponse = {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
};

const SYSTEM_PROMPT = `Bạn là AI Assistant của hệ thống quản lý bệnh viện, chuyên hỗ trợ bệnh nhân.

**Vai trò của bạn:**
- Giúp bệnh nhân TÌM KIẾM bác sĩ phù hợp theo chuyên khoa
- HƯỚNG DẪN quy trình đặt lịch một cách thân thiện, dễ hiểu
- Giải đáp thắc mắc về lịch hẹn, thủ tục khám, thanh toán
- Cung cấp thông tin về bệnh viện: số lượng bác sĩ, danh sách khoa, thông tin liên hệ

**QUAN TRỌNG - GIỚI HẠN QUYỀN:**
- Bạn CHỈ có quyền TRA CỨU thông tin (READ-only)
- Bạn KHÔNG thể tạo, sửa, hủy lịch hẹn thay người dùng
- Bạn KHÔNG thể thực hiện thanh toán thay người dùng
- Khi người dùng muốn đặt lịch/hủy lịch/thanh toán, hãy HƯỚNG DẪN họ thao tác trên giao diện

**Nguyên tắc giao tiếp:**
1. **Thân thiện & Chuyên nghiệp**: Sử dụng ngôn ngữ lịch sự, dễ hiểu
2. **Chủ động hỏi thông tin cần thiết**: Nếu thiếu thông tin, hãy hỏi lại
3. **Gợi ý thông minh**:
   - Nếu bệnh nhân mô tả triệu chứng, gợi ý chuyên khoa phù hợp
   - Nếu không có slot trong ngày yêu cầu, đề xuất ngày gần nhất
4. **Xử lý lỗi nhẹ nhàng**: Giải thích rõ ràng và đưa ra phương án khác

**Các việc bạn CÓ THỂ làm:**
- "Bệnh viện có bao nhiêu khoa?" → Dùng getDepartments
- "Khoa tim mạch có bao nhiêu bác sĩ?" → Dùng getDepartmentStaffCount
- "Thông tin về khoa nội?" → Dùng getDepartmentDetails
- "Tìm bác sĩ da liễu" → Dùng searchAvailableDoctors
- "Bác sĩ X có lịch trống ngày mai không?" → Dùng getAvailableSlots
- "Xem lịch hẹn của tôi" → Dùng getMyAppointments

**Cách hướng dẫn đặt lịch:**
1. Tìm bác sĩ: searchAvailableDoctors
2. Xem slot trống: getAvailableSlots
3. Hướng dẫn: "Bạn có thể đặt lịch bằng cách vào trang Đặt lịch hoặc nhấn nút 'Đặt lịch mới' trên giao diện"

**Lưu ý:**
- Luôn sử dụng định dạng ngày YYYY-MM-DD khi gọi functions
- Khi bệnh nhân hỏi về triệu chứng bệnh, hãy gợi ý họ đặt lịch khám thay vì tự chuẩn đoán
- Khi được hỏi về số lượng khoa/bác sĩ, hãy sử dụng getDepartmentStaffCount hoặc getDepartmentDetails`;

const functionDeclarations = [
  {
    name: 'searchAvailableDoctors',
    description: 'Tìm kiếm bác sĩ theo chuyên khoa. Không cần ngày để tìm danh sách bác sĩ.',
    parameters: {
      type: 'object',
      properties: {
        department: {
          type: 'string',
          description: 'Tên chuyên khoa (VD: Cardiology, Dermatology, Internal Medicine)',
        },
      },
      required: [],
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
  {
    name: 'getDepartmentStaffCount',
    description: 'Đếm số lượng bác sĩ/nhân viên y tế trong một khoa cụ thể theo tên hoặc mã khoa',
    parameters: {
      type: 'object',
      properties: {
        departmentName: {
          type: 'string',
          description: 'Tên khoa (VD: Tim mạch, Cardiology, Nội khoa)',
        },
      },
      required: ['departmentName'],
    },
  },
  {
    name: 'getDepartmentDetails',
    description: 'Lấy thông tin chi tiết của một khoa (mô tả, trưởng khoa, danh sách bác sĩ)',
    parameters: {
      type: 'object',
      properties: {
        departmentName: {
          type: 'string',
          description: 'Tên khoa (VD: Tim mạch, Cardiology, Nội khoa)',
        },
      },
      required: ['departmentName'],
    },
  },
  {
    name: 'getPatientProfile',
    description: 'Xem thông tin hồ sơ bệnh nhân hiện đang đăng nhập',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID (UUID) nếu muốn xem hồ sơ cụ thể',
        },
      },
      required: [],
    },
  },
  {
    name: 'getPatientInsurance',
    description: 'Xem thông tin bảo hiểm của bệnh nhân hiện tại',
    parameters: {
      type: 'object',
      properties: {
        patientId: {
          type: 'string',
          description: 'Mã bệnh nhân nếu muốn chỉ định cụ thể',
        },
      },
      required: [],
    },
  },
  {
    name: 'getPendingInvoices',
    description: 'Xem các hóa đơn đang chờ thanh toán của bệnh nhân',
    parameters: {
      type: 'object',
      properties: {
        patientId: {
          type: 'string',
          description: 'Mã bệnh nhân (PAT-xxxx). Nếu bỏ trống sẽ dùng tài khoản hiện tại.',
        },
        limit: {
          type: 'number',
          description: 'Giới hạn số hóa đơn trả về',
        },
      },
      required: [],
    },
  },
  {
    name: 'getAppointmentDetails',
    description: 'Xem chi tiết một lịch hẹn cụ thể',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: {
          type: 'string',
          description: 'ID của lịch hẹn cần xem (UUID)',
        },
      },
      required: ['appointmentId'],
    },
  },
];

const groqTools = functionDeclarations.map((fn) => ({
  type: 'function',
  function: fn,
}));

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, patientId, context } = await req.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    const effectiveUserId = userId && typeof userId === 'string' ? userId : null;
    const effectivePatientId = patientId && typeof patientId === 'string' ? patientId : null;

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const baseUrl = resolveApiBaseUrl();
    const authorizedFetch = createAuthorizedFetch(req);
    const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const patientProfileForContext = await fetchNormalizedPatientProfile(
      effectiveUserId,
      effectivePatientId,
      baseUrl,
      authorizedFetch
    );

    const latestMessage = messages[messages.length - 1];
    const latestContent: string = latestMessage?.content?.toLowerCase?.() || '';
    const wantsProfileInfo =
      latestMessage?.role === 'user' &&
      (latestContent.includes('hồ sơ') ||
        latestContent.includes('tôi là ai') ||
        latestContent.includes('đăng nhập với tư cách') ||
        latestContent.includes('bệnh nhân nào'));

    if (wantsProfileInfo) {
      if (patientProfileForContext) {
        const summary = buildPatientProfileSummary(patientProfileForContext);
        return NextResponse.json({
          message: summary,
          functionCalls: [
            {
              name: 'getPatientProfile',
              result: {
                success: true,
                profile: patientProfileForContext,
                summary,
              },
            },
          ],
        });
      }

      return NextResponse.json({
        message:
          'Hiện chưa xác định được hồ sơ bệnh nhân của bạn. Vui lòng đăng nhập lại để tiếp tục.',
      });
    }

    let contextPrompt = buildDynamicSystemPrompt(context as ChatContext | undefined);
    if (patientProfileForContext) {
      contextPrompt += `\n\n[HỒ SƠ BỆNH NHÂN]\n${buildPatientProfileSummary(patientProfileForContext)}`;
    }
    const fullSystemPrompt = `${SYSTEM_PROMPT}

---
**THÔNG TIN NGỮ CẢNH HIỆN TẠI:**
${contextPrompt}
---

Hãy sử dụng thông tin ngữ cảnh trên để đưa ra câu trả lời phù hợp và cá nhân hóa cho người dùng.`;

    const formattedHistory: ChatMessageParam[] = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    const hasUserContextMessage = messages.some(
      (msg: any) => msg.role === 'assistant' && msg.content?.includes('THÔNG TIN NGỮ CẢNH')
    );

    if (!hasUserContextMessage) {
      const contextInfo = JSON.stringify(
        {
          currentUserId: effectiveUserId,
          currentPatientId: effectivePatientId,
        },
        null,
        2
      );

      formattedHistory.unshift({
        role: 'assistant',
        content: `Thông tin hệ thống: ${contextInfo}`,
      });
    }

    let conversation: ChatMessageParam[] = [
      { role: 'system', content: fullSystemPrompt },
      ...formattedHistory,
    ];

    const functionResults: any[] = [];
    let iteration = 0;
    const maxIterations = 5;

    while (iteration < maxIterations) {
      const groqResponse = await callGroqModel(conversation, groqModel);
      const choice = groqResponse.choices?.[0];
      const message = choice?.message;

      if (!message) {
        throw new Error('Groq API returned empty response');
      }

      const toolCall = message.tool_calls?.[0];

      if (!toolCall) {
        return NextResponse.json({
          message: message.content || '',
          functionCalls: functionResults,
        });
      }

      const args = safeParseArgs(toolCall.function.arguments);
      const functionResult = await handleFunctionCall(
        {
          name: toolCall.function.name,
          args,
        },
        effectiveUserId,
        effectivePatientId,
        baseUrl,
        authorizedFetch
      );

      functionResults.push({
        name: toolCall.function.name,
        result: functionResult,
      });

      conversation = [
        ...conversation,
        {
          role: 'assistant',
          content: message.content,
          tool_calls: message.tool_calls,
        },
        {
          role: 'tool',
          name: toolCall.function.name,
          content: JSON.stringify(functionResult),
          tool_call_id: toolCall.id,
        },
      ];

      iteration++;
    }

    throw new Error('Exceeded maximum function call iterations');
  } catch (error: any) {
    console.error('[AI Chatbot] Error:', {
      message: error?.message,
      stack: error?.stack,
      details: error,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

async function handleFunctionCall(
  functionCall: FunctionCall,
  userId: string | null,
  patientId: string | null,
  baseUrl: string,
  authorizedFetch: AuthorizedFetch
): Promise<any> {
  const { name, args } = functionCall;
  console.log(`[AI Chatbot] Function call: ${name}`, args);

  try {
    switch (name) {
      case 'searchAvailableDoctors': {
        const { department } = args;
        let searchTerm = null;

        if (department) {
          const deptResponse = await authorizedFetch(`${baseUrl}/api/v1/departments`);
          const deptData = await deptResponse.json();
          const departments = Array.isArray(deptData) ? deptData : deptData.data || [];

          const dept = departments.find(
            (d: any) =>
              (d.nameEn && d.nameEn.toLowerCase().includes(department.toLowerCase())) ||
              (d.nameVi && d.nameVi.toLowerCase().includes(department.toLowerCase()))
          );

          searchTerm = dept?.nameEn || department;
        }

        const staffUrl = new URL(`${baseUrl}/api/v1/staff/search`);
        if (searchTerm) {
          staffUrl.searchParams.set('department', searchTerm);
        }
        staffUrl.searchParams.set('staffType', 'doctor');
        staffUrl.searchParams.set('status', 'active');
        staffUrl.searchParams.set('limit', '5');

        const staffResponse = await authorizedFetch(staffUrl.toString());
        const staffData = await staffResponse.json();

        let doctors = [];
        if (Array.isArray(staffData)) {
          doctors = staffData;
        } else if (staffData.data?.items && Array.isArray(staffData.data.items)) {
          doctors = staffData.data.items;
        } else if (Array.isArray(staffData.data)) {
          doctors = staffData.data;
        }

        return {
          success: true,
          doctors: doctors.map((doc: any) => ({
            id: doc.id || doc.staffId,
            name: doc.personalInfo?.fullName || doc.fullName || 'Chưa có tên',
            department: doc.professionalInfo?.department || doc.department || 'N/A',
            specialization: doc.professionalInfo?.title || doc.title || 'Bác sĩ',
            experience: doc.yearsOfExperience || doc.professionalInfo?.yearsOfExperience || 0,
          })),
          message: `Tìm thấy ${doctors.length} bác sĩ phù hợp`,
        };
      }

      case 'getAvailableSlots': {
        const { doctorId, date } = args;

        const response = await authorizedFetch(
          `${baseUrl}/api/v2/appointments/providers/${doctorId}/available-slots?date=${date}`
        );
        const slots = await response.json();

        return {
          success: true,
          slots: Array.isArray(slots)
            ? slots.map((slot: any) => ({
                id: slot.id,
                startTime: slot.startTime || slot.start_time,
                endTime: slot.endTime || slot.end_time,
                available: slot.available !== false,
              }))
            : [],
          date,
          doctorId,
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

        const response = await authorizedFetch(url.toString());
        const data = await response.json();
        const appointments = Array.isArray(data) ? data : data.data || [];

        return {
          success: true,
          appointments: appointments,
          count: appointments.length,
        };
      }

      case 'getDepartments': {
        const response = await authorizedFetch(`${baseUrl}/api/v1/departments`);
        const data = await response.json();
        const departments = Array.isArray(data) ? data : data.data || [];

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

      case 'getDepartmentStaffCount': {
        const { departmentName } = args;
        const deptResponse = await authorizedFetch(`${baseUrl}/api/v1/departments`);
        const deptData = await deptResponse.json();
        const departments = Array.isArray(deptData) ? deptData : deptData.data || [];

        const dept = departments.find(
          (d: any) =>
            (d.nameEn && d.nameEn.toLowerCase().includes(departmentName.toLowerCase())) ||
            (d.nameVi && d.nameVi.toLowerCase().includes(departmentName.toLowerCase())) ||
            (d.code && d.code.toLowerCase().includes(departmentName.toLowerCase()))
        );

        if (!dept) {
          return {
            success: false,
            message: `Không tìm thấy khoa "${departmentName}". Vui lòng thử với tên khác.`,
            availableDepartments: departments.map((d: any) => d.nameVi || d.nameEn),
          };
        }

        const staffUrl = new URL(`${baseUrl}/api/v1/staff/search`);
        staffUrl.searchParams.set('department', dept.nameEn || dept.nameVi);
        staffUrl.searchParams.set('staffType', 'doctor');
        staffUrl.searchParams.set('status', 'active');
        staffUrl.searchParams.set('limit', '100');

        const staffResponse = await authorizedFetch(staffUrl.toString());
        const staffData = await staffResponse.json();

        let doctors = [];
        if (Array.isArray(staffData)) {
          doctors = staffData;
        } else if (staffData.data?.items && Array.isArray(staffData.data.items)) {
          doctors = staffData.data.items;
        } else if (Array.isArray(staffData.data)) {
          doctors = staffData.data;
        }

        const totalCount = staffData.data?.pagination?.total || doctors.length;

        return {
          success: true,
          departmentName: dept.nameVi || dept.nameEn,
          departmentNameEn: dept.nameEn,
          departmentCode: dept.code,
          doctorCount: totalCount,
          doctors: doctors.slice(0, 10).map((doc: any) => ({
            name: doc.personalInfo?.fullName || doc.fullName || 'Chưa có tên',
            specialization: doc.professionalInfo?.title || doc.title || 'Bác sĩ',
          })),
          message: `Khoa ${dept.nameVi || dept.nameEn} có ${totalCount} bác sĩ đang làm việc`,
        };
      }

      case 'getDepartmentDetails': {
        const { departmentName } = args;
        const deptResponse = await authorizedFetch(`${baseUrl}/api/v1/departments`);
        const deptData = await deptResponse.json();
        const departments = Array.isArray(deptData) ? deptData : deptData.data || [];

        const dept = departments.find(
          (d: any) =>
            (d.nameEn && d.nameEn.toLowerCase().includes(departmentName.toLowerCase())) ||
            (d.nameVi && d.nameVi.toLowerCase().includes(departmentName.toLowerCase())) ||
            (d.code && d.code.toLowerCase().includes(departmentName.toLowerCase()))
        );

        if (!dept) {
          return {
            success: false,
            message: `Không tìm thấy khoa "${departmentName}"`,
            availableDepartments: departments.map((d: any) => d.nameVi || d.nameEn),
          };
        }

        const staffUrl = new URL(`${baseUrl}/api/v1/staff/search`);
        staffUrl.searchParams.set('department', dept.nameEn || dept.nameVi);
        staffUrl.searchParams.set('staffType', 'doctor');
        staffUrl.searchParams.set('status', 'active');
        staffUrl.searchParams.set('limit', '20');

        const staffResponse = await authorizedFetch(staffUrl.toString());
        const staffData = await staffResponse.json();

        let doctors = [];
        if (Array.isArray(staffData)) {
          doctors = staffData;
        } else if (staffData.data?.items && Array.isArray(staffData.data.items)) {
          doctors = staffData.data.items;
        } else if (Array.isArray(staffData.data)) {
          doctors = staffData.data;
        }

        const totalCount = staffData.data?.pagination?.total || doctors.length;

        return {
          success: true,
          department: {
            id: dept.id,
            code: dept.code,
            name: dept.nameEn,
            nameVi: dept.nameVi,
            description: dept.description,
            location: dept.location,
            phone: dept.phone,
            email: dept.email,
          },
          staffCount: totalCount,
          doctors: doctors.map((doc: any) => ({
            id: doc.id || doc.staffId,
            name: doc.personalInfo?.fullName || doc.fullName || 'Chưa có tên',
            specialization: doc.professionalInfo?.title || doc.title || 'Bác sĩ',
            experience: doc.yearsOfExperience || doc.professionalInfo?.yearsOfExperience || 0,
          })),
          message: `Thông tin khoa ${dept.nameVi || dept.nameEn}`,
        };
      }

      case 'getPatientProfile': {
        const targetUserId =
          typeof args.userId === 'string' && args.userId.trim().length > 0 ? args.userId : userId;
        const targetPatientId =
          typeof args.patientId === 'string' && args.patientId.trim().length > 0
            ? args.patientId
            : patientId;

        if (!targetUserId && !targetPatientId) {
          return {
            success: false,
            message: 'Bạn cần đăng nhập để xem hồ sơ bệnh nhân',
          };
        }

        const normalizedProfile = await fetchNormalizedPatientProfile(
          targetUserId,
          targetPatientId,
          baseUrl,
          authorizedFetch
        );

        if (!normalizedProfile) {
          return {
            success: false,
            message: 'Không tìm thấy hồ sơ bệnh nhân',
          };
        }

        return {
          success: true,
          profile: normalizedProfile,
          summary: buildPatientProfileSummary(normalizedProfile),
        };
      }

      case 'getPatientInsurance': {
        const targetPatientId =
          (typeof args.patientId === 'string' && args.patientId.trim().length > 0
            ? args.patientId
            : patientId) || null;
        if (!targetPatientId) {
          return {
            success: false,
            message: 'Chưa xác định được bệnh nhân để tra cứu bảo hiểm',
          };
        }

        const response = await authorizedFetch(
          `${baseUrl}/api/v1/patients/${targetPatientId}/insurance`
        );
        const data = await response.json();
        const insurance = data.data || data.insurance || data;

        return {
          success: true,
          patientId: targetPatientId,
          insurance,
        };
      }

      case 'getPendingInvoices': {
        const targetPatientId =
          (typeof args.patientId === 'string' && args.patientId.trim().length > 0
            ? args.patientId
            : patientId) || null;
        if (!targetPatientId) {
          return {
            success: false,
            message: 'Chưa xác định được bệnh nhân để tra cứu hóa đơn',
          };
        }

        const response = await authorizedFetch(
          `${baseUrl}/api/v1/billing/invoices/patient/${targetPatientId}`
        );
        const data = await response.json();
        let invoices = [];
        if (Array.isArray(data)) {
          invoices = data;
        } else if (Array.isArray(data.invoices)) {
          invoices = data.invoices;
        } else if (Array.isArray(data.data)) {
          invoices = data.data;
        }

        const pending = invoices.filter((invoice: any) => {
          const status = (invoice.status || invoice.paymentStatus || '').toString().toUpperCase();
          return status === 'PENDING' || status === 'UNPAID';
        });

        const limit = typeof args.limit === 'number' ? args.limit : undefined;
        const limitedPending = limit ? pending.slice(0, limit) : pending;
        const totalDue = pending.reduce(
          (sum: number, invoice: any) =>
            sum + Number(invoice.amountDue ?? invoice.totalDue ?? invoice.totalAmount ?? 0),
          0
        );

        return {
          success: true,
          patientId: targetPatientId,
          totalPending: pending.length,
          totalAmountDue: totalDue,
          invoices: limitedPending,
        };
      }

      case 'getAppointmentDetails': {
        const { appointmentId } = args;
        if (!appointmentId) {
          return {
            success: false,
            message: 'Thiếu appointmentId để tra cứu',
          };
        }

        const response = await authorizedFetch(`${baseUrl}/api/v1/appointments/${appointmentId}`);
        const data = await response.json();
        const appointment = data.data || data.appointment || data;

        return {
          success: true,
          appointment,
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

function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || process.env.API_GATEWAY_URL;

  if (configured && configured.length > 0) {
    return configured;
  }

  console.warn(
    '[AI Chatbot] NEXT_PUBLIC_API_URL/API_GATEWAY_URL not set. Falling back to http://localhost:3101'
  );
  return 'http://localhost:3101';
}

function createAuthorizedFetch(req: NextRequest): AuthorizedFetch {
  const forwardedHeaders: Record<string, string> = {};
  const cookieHeader = req.headers.get('cookie') || serializeCookies(req);
  if (cookieHeader) forwardedHeaders['cookie'] = cookieHeader;

  const authHeader = req.headers.get('authorization');
  if (authHeader) forwardedHeaders['authorization'] = authHeader;

  return async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers ?? {});
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');

    Object.entries(forwardedHeaders).forEach(([key, value]) => headers.set(key, value));

    return fetch(url, {
      ...init,
      headers,
    });
  };
}

function serializeCookies(req: NextRequest): string | null {
  if (!req.cookies) return null;

  const serialized = req.cookies
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  return serialized.length > 0 ? serialized : null;
}

async function callGroqModel(
  conversation: ChatMessageParam[],
  model: string
): Promise<GroqResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: conversation.map((msg) => {
        const baseMsg: any = {
          role: msg.role,
          content: msg.content,
        };

        if (msg.name) {
          baseMsg.name = msg.name;
        }

        if (msg.tool_call_id) {
          baseMsg.tool_call_id = msg.tool_call_id;
        }

        if (msg.tool_calls) {
          baseMsg.tool_calls = msg.tool_calls;
        }

        return baseMsg;
      }),
      tools: groqTools,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorData}`);
  }

  return response.json();
}

function safeParseArgs(args: string): Record<string, any> {
  try {
    const parsed = JSON.parse(args || '{}');
    if (parsed && typeof parsed === 'object') {
      Object.keys(parsed).forEach((key) => {
        if (parsed[key] === null || typeof parsed[key] === 'undefined') {
          delete parsed[key];
        }
      });
    }
    return parsed;
  } catch (error) {
    console.error('[AI Chatbot] Failed to parse function arguments', args);
    return {};
  }
}

type NormalizedPatientProfile = {
  patientId: string | null;
  fullName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  nationalId: string | null;
  contact: {
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  insuranceStatus: string | null;
};

async function fetchNormalizedPatientProfile(
  userId: string | null,
  patientId: string | null,
  baseUrl: string,
  authorizedFetch: AuthorizedFetch
): Promise<NormalizedPatientProfile | null> {
  if (!userId && !patientId) {
    return null;
  }

  try {
    let response: Response;
    if (userId) {
      response = await authorizedFetch(`${baseUrl}/api/v1/patients/user/${userId}`);
    } else {
      response = await authorizedFetch(`${baseUrl}/api/v1/patients/${patientId}`);
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const profile = data.data || data.patient || data;

    if (!profile) {
      return null;
    }

    let normalizedProfile: NormalizedPatientProfile = {
      patientId: profile.patientId || profile.id || patientId || null,
      fullName: profile.fullName || profile.personalInfo?.fullName || profile.name || null,
      gender: profile.gender || profile.personalInfo?.gender || null,
      dateOfBirth: profile.dateOfBirth || profile.personalInfo?.dateOfBirth || null,
      nationalId: profile.nationalId || profile.personalInfo?.nationalId || null,
      contact: profile.contactInfo || {
        phone: profile.phone || profile.contact?.phone || null,
        email: profile.email || profile.contact?.email || null,
        address: profile.address || profile.contact?.address || null,
      },
      insuranceStatus: profile.insuranceInfo?.status || profile.insurance?.status || null,
    };

    const needsDetailLookup =
      (!normalizedProfile.fullName ||
        !normalizedProfile.contact.phone ||
        !normalizedProfile.contact.email) &&
      normalizedProfile.patientId;

    if (needsDetailLookup && normalizedProfile.patientId) {
      try {
        const detailResponse = await authorizedFetch(
          `${baseUrl}/api/v1/patients/${normalizedProfile.patientId}`
        );
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const detailProfile = detailData.data || detailData.patient || detailData;
          if (detailProfile) {
            normalizedProfile = {
              patientId: detailProfile.patientId || normalizedProfile.patientId,
              fullName:
                detailProfile.fullName ||
                detailProfile.personalInfo?.fullName ||
                normalizedProfile.fullName,
              gender:
                detailProfile.gender ||
                detailProfile.personalInfo?.gender ||
                normalizedProfile.gender,
              dateOfBirth:
                detailProfile.dateOfBirth ||
                detailProfile.personalInfo?.dateOfBirth ||
                normalizedProfile.dateOfBirth,
              nationalId:
                detailProfile.nationalId ||
                detailProfile.personalInfo?.nationalId ||
                normalizedProfile.nationalId,
              contact: detailProfile.contactInfo || normalizedProfile.contact,
              insuranceStatus:
                detailProfile.insuranceInfo?.status ||
                detailProfile.insurance?.status ||
                normalizedProfile.insuranceStatus,
            };
          }
        }
      } catch (error) {
        console.warn('[AI Chatbot] Unable to fetch detailed profile', error);
      }
    }

    return normalizedProfile;
  } catch (error) {
    console.warn('[AI Chatbot] fetchNormalizedPatientProfile error', error);
    return null;
  }
}

function buildPatientProfileSummary(profile: NormalizedPatientProfile): string {
  const parts: string[] = [];
  if (profile.fullName) {
    parts.push(`Tên bệnh nhân: ${profile.fullName}.`);
  }
  if (profile.patientId) {
    parts.push(`Mã bệnh nhân: ${profile.patientId}.`);
  }
  if (profile.gender || profile.dateOfBirth) {
    const details = [
      profile.gender ? `Giới tính: ${profile.gender}` : null,
      profile.dateOfBirth ? `Sinh ngày ${profile.dateOfBirth}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    if (details) {
      parts.push(details);
    }
  }
  if (profile.contact.phone || profile.contact.email) {
    const contact = [
      profile.contact.phone ? `SĐT: ${profile.contact.phone}` : null,
      profile.contact.email ? `Email: ${profile.contact.email}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    if (contact) {
      parts.push(`Liên hệ: ${contact}.`);
    }
  }
  return parts.join(' ') || 'Không có thông tin hồ sơ chi tiết.';
}
