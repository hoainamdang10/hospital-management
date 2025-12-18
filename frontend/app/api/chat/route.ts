import { NextRequest, NextResponse } from 'next/server';
import { buildDynamicSystemPrompt } from '@/components/ChatBot/contextPromptBuilder';
import type { ChatContext } from '@/components/ChatBot/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content, Part } from '@google/generative-ai';

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

type ModelResponse = {
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
          format: 'enum',
          enum: ['upcoming', 'past', 'cancelled', 'scheduled', 'confirmed', 'completed', 'all'],
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
        patientId: {
          type: 'string',
          description: 'Mã bệnh nhân (PAT-xxxxxx-xxx) nếu muốn xem hồ sơ theo patientId',
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

const geminiTools = [{ functionDeclarations }];

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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const baseUrl = resolveApiBaseUrl();
    const authorizedFetch = createAuthorizedFetch(req);
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
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
      contextPrompt += `\n\n[THÔNG TIN HỆ THỐNG]\n${contextInfo}`;
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

    let conversation: ChatMessageParam[] = [
      { role: 'system', content: fullSystemPrompt },
      ...formattedHistory,
    ];

    const functionResults: any[] = [];
    let iteration = 0;
    const maxIterations = 5;

    while (iteration < maxIterations) {
      const modelResponse = await callGeminiModel(conversation, geminiModel);
      const choice = modelResponse.choices?.[0];
      const message = choice?.message;

      if (!message) {
        throw new Error('Gemini API returned empty response');
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

function toGeminiContents(conversation: ChatMessageParam[]): Content[] {
  const contents: Content[] = [];

  const push = (role: 'user' | 'model', parts: Part[]) => {
    if (!parts.length) return;
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts.push(...parts);
      return;
    }
    contents.push({ role, parts });
  };

  for (const msg of conversation) {
    if (msg.role === 'system') continue;

    if (msg.role === 'user') {
      push('user', [{ text: msg.content ?? '' }]);
      continue;
    }

    if (msg.role === 'assistant') {
      const parts: Part[] = [];
      if (msg.content) parts.push({ text: msg.content });

      if (msg.tool_calls?.length) {
        for (const toolCall of msg.tool_calls) {
          parts.push({
            functionCall: {
              name: toolCall.function.name,
              args: safeParseArgs(toolCall.function.arguments),
            },
          });
        }
      }

      push('model', parts);
      continue;
    }

    if (msg.role === 'tool' && msg.name) {
      let parsed: any = {};
      try {
        parsed = JSON.parse(msg.content || '{}');
      } catch {
        parsed = { raw: msg.content };
      }

      push('user', [
        {
          functionResponse: {
            name: msg.name,
            response: parsed && typeof parsed === 'object' ? parsed : { value: parsed },
          },
        },
      ]);
    }
  }

  return contents;
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
        let searchTerm: string | null = null;
        let departmentCode: string | null = null;
        let departmentId: string | null = null;

        if (department) {
          const deptResponse = await authorizedFetch(`${baseUrl}/api/v1/departments`);
          const deptData = await deptResponse.json();
          const departments = Array.isArray(deptData) ? deptData : deptData.data || [];

          const dept = departments.find(
            (d: any) =>
              (d.nameEn && d.nameEn.toLowerCase().includes(department.toLowerCase())) ||
              (d.nameVi && d.nameVi.toLowerCase().includes(department.toLowerCase()))
          );

          departmentCode = dept?.code || null;
          departmentId = dept?.id || null;
          searchTerm = dept?.nameEn || dept?.nameVi || department;
        }

        const staffUrl = new URL(`${baseUrl}/api/v1/staff/search`);
        if (departmentCode) {
          staffUrl.searchParams.set('departmentCode', departmentCode);
        } else if (departmentId) {
          staffUrl.searchParams.set('departmentId', departmentId);
        } else if (searchTerm) {
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
          `${baseUrl}/api/v1/appointments/providers/${doctorId}/available-slots?date=${date}`
        );
        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          return {
            success: false,
            doctorId,
            date,
            message:
              payload?.error?.message ||
              payload?.message ||
              `Không lấy được slot trống (HTTP ${response.status})`,
          };
        }

        const availableSlots = payload?.data?.availableSlots || payload?.availableSlots || payload;

        return {
          success: true,
          slots: Array.isArray(availableSlots)
            ? availableSlots.map((slot: any) => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
                appointmentDate: slot.appointmentDate,
                appointmentTime: slot.appointmentTime,
                formattedTime: slot.formattedTime,
                dayOfWeek: slot.dayOfWeek,
                isAvailable: slot.isAvailable !== false,
              }))
            : [],
          totalSlots: payload?.data?.totalSlots ?? payload?.totalSlots,
          date,
          doctorId,
        };
      }

      case 'getMyAppointments': {
        const toLocalDate = (value: Date) => {
          const year = value.getFullYear();
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const day = String(value.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        let targetPatientId = patientId;
        if (!targetPatientId && userId) {
          const normalizedProfile = await fetchNormalizedPatientProfile(
            userId,
            null,
            baseUrl,
            authorizedFetch
          );
          targetPatientId = normalizedProfile?.patientId || null;
        }

        if (!targetPatientId) {
          return {
            success: false,
            message: 'Chưa xác định được bệnh nhân để xem lịch hẹn (thiếu patientId)',
          };
        }

        const rawStatus = typeof args.status === 'string' ? args.status.toLowerCase() : '';
        const url = new URL(`${baseUrl}/api/v1/appointments`);
        url.searchParams.set('patientId', targetPatientId);
        url.searchParams.set('page', '1');
        url.searchParams.set('pageSize', '50');

        const today = toLocalDate(new Date());
        if (rawStatus === 'upcoming') {
          url.searchParams.set('startDate', today);
        } else if (rawStatus === 'past') {
          url.searchParams.set('endDate', today);
        } else if (rawStatus && rawStatus !== 'all') {
          const statusMap: Record<string, string> = {
            cancelled: 'CANCELLED',
            scheduled: 'SCHEDULED',
            confirmed: 'CONFIRMED',
            completed: 'COMPLETED',
          };
          const mapped = statusMap[rawStatus] || rawStatus.toUpperCase();
          url.searchParams.set('status', mapped);
        }

        const response = await authorizedFetch(url.toString());
        const data = await response.json();

        if (!response.ok || data?.success === false) {
          return {
            success: false,
            patientId: targetPatientId,
            message:
              data?.error?.message ||
              data?.message ||
              `Không lấy được lịch hẹn (HTTP ${response.status})`,
          };
        }

        const payload = data?.data || data;
        const appointments = Array.isArray(payload?.appointments)
          ? payload.appointments
          : Array.isArray(payload)
            ? payload
            : [];

        const filteredAppointments =
          rawStatus === 'upcoming'
            ? appointments.filter((apt: any) => {
                const status = (apt.status || '').toString().toUpperCase();
                return status !== 'CANCELLED' && status !== 'COMPLETED';
              })
            : rawStatus === 'past'
              ? appointments.filter((apt: any) => {
                  const status = (apt.status || '').toString().toUpperCase();
                  return status === 'CANCELLED' || status === 'COMPLETED';
                })
              : appointments;

        return {
          success: true,
          patientId: targetPatientId,
          appointments: filteredAppointments,
          count: filteredAppointments.length,
          page: payload?.page,
          pageSize: payload?.pageSize,
          total: payload?.total,
          totalPages: payload?.totalPages,
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
        if (dept.code) {
          staffUrl.searchParams.set('departmentCode', dept.code);
        } else if (dept.id) {
          staffUrl.searchParams.set('departmentId', dept.id);
        } else {
          staffUrl.searchParams.set('department', dept.nameEn || dept.nameVi);
        }
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
        if (dept.code) {
          staffUrl.searchParams.set('departmentCode', dept.code);
        } else if (dept.id) {
          staffUrl.searchParams.set('departmentId', dept.id);
        } else {
          staffUrl.searchParams.set('department', dept.nameEn || dept.nameVi);
        }
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

        if (!response.ok) {
          return {
            success: false,
            patientId: targetPatientId,
            message:
              (data?.error?.message || data?.message || data?.error)?.toString?.() ||
              `Không lấy được hóa đơn (HTTP ${response.status})`,
          };
        }

        const invoices = Array.isArray(data?.invoices)
          ? data.invoices
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];

        const pending = invoices.filter((invoice: any) => {
          const status = (invoice.status || invoice.paymentStatus || '').toString().toLowerCase();
          const outstanding = Number(
            invoice.outstandingAmount ??
              invoice.amountDue ??
              invoice.totalDue ??
              invoice.totalAmount ??
              0
          );
          const isClosed =
            status === 'paid' ||
            status === 'cancelled' ||
            status === 'refunded' ||
            status === 'expired';
          if (isClosed) return false;
          if (Number.isFinite(outstanding) && outstanding > 0) return true;
          return status === 'pending' || status === 'partially_paid' || status === 'overdue';
        });

        const limit = typeof args.limit === 'number' ? args.limit : undefined;
        const limitedPending = limit ? pending.slice(0, limit) : pending;
        const totalDue = pending.reduce(
          (sum: number, invoice: any) =>
            sum +
            Number(
              invoice.outstandingAmount ??
                invoice.amountDue ??
                invoice.totalDue ??
                invoice.totalAmount ??
                0
            ),
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

async function callGeminiModel(
  conversation: ChatMessageParam[],
  model: string
): Promise<ModelResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const systemInstruction =
    conversation.find((msg) => msg.role === 'system')?.content ||
    'Bạn là AI Assistant của hệ thống quản lý bệnh viện.';

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });
  const result = await geminiModel.generateContent({
    contents: toGeminiContents(conversation),
    systemInstruction,
    tools: geminiTools as any,
    generationConfig: { temperature: 0.7 },
  });

  const text = result.response.text();
  const calls = result.response.functionCalls?.() || [];

  const tool_calls =
    calls && calls.length
      ? calls.map((call, index) => ({
          id: `gemini_${Date.now()}_${index}`,
          type: 'function' as const,
          function: {
            name: call.name,
            arguments: JSON.stringify(call.args ?? {}),
          },
        }))
      : undefined;

  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: text ?? null,
          tool_calls,
        },
      },
    ],
  };
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
