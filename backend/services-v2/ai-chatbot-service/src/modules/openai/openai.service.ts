import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

@Injectable()
export class OpenAIService {
    private readonly logger = new Logger(OpenAIService.name);
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Định nghĩa các functions mà chatbot có thể gọi
     */
    private getFunctionDefinitions() {
        return [
            {
                name: 'searchAvailableDoctors',
                description: 'Tìm kiếm bác sĩ có sẵn theo chuyên khoa và thời gian mong muốn',
                parameters: {
                    type: 'object',
                    properties: {
                        department: {
                            type: 'string',
                            description: 'Chuyên khoa (VD: Tim mạch, Da liễu, Nội khoa)',
                        },
                        date: {
                            type: 'string',
                            description: 'Ngày hẹn mong muốn (định dạng YYYY-MM-DD)',
                        },
                        timePreference: {
                            type: 'string',
                            enum: ['morning', 'afternoon', 'evening', 'any'],
                            description: 'Khung giờ ưa thích: sáng, chiều, tối hoặc bất kỳ',
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
                            description: 'ID của bác sĩ (định dạng DOC-XXXX-YYYYMM-NNN)',
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
                        patientId: {
                            type: 'string',
                            description: 'ID của bệnh nhân',
                        },
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
                            description: 'Ghi chú bổ sung (không bắt buộc)',
                        },
                    },
                    required: ['patientId', 'doctorId', 'slotId', 'reason'],
                },
            },
            {
                name: 'getPatientAppointments',
                description: 'Xem danh sách lịch hẹn của bệnh nhân',
                parameters: {
                    type: 'object',
                    properties: {
                        patientId: {
                            type: 'string',
                            description: 'ID của bệnh nhân',
                        },
                        status: {
                            type: 'string',
                            enum: ['upcoming', 'past', 'cancelled', 'all'],
                            description: 'Trạng thái lịch hẹn cần xem',
                        },
                    },
                    required: ['patientId'],
                },
            },
            {
                name: 'cancelAppointment',
                description: 'Hủy một lịch hẹn đã đặt',
                parameters: {
                    type: 'object',
                    properties: {
                        appointmentId: {
                            type: 'string',
                            description: 'ID của lịch hẹn cần hủy',
                        },
                        reason: {
                            type: 'string',
                            description: 'Lý do hủy lịch',
                        },
                    },
                    required: ['appointmentId'],
                },
            },
        ];
    }

    /**
     * System prompt định nghĩa vai trò và hành vi của chatbot
     */
    private getSystemPrompt(): string {
        return `Bạn là AI Assistant của hệ thống quản lý bệnh viện, chuyên hỗ trợ bệnh nhân đặt lịch khám.

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
- Không tự ý thay đổi thông tin bệnh nhân đã cung cấp`;
    }

    /**
     * Xử lý cuộc hội thoại với OpenAI
     */
    async chat(
        messages: ChatCompletionMessageParam[],
        sessionId: string,
    ): Promise<any> {
        try {
            // Thêm system prompt vào đầu conversation
            const conversationMessages: ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: this.getSystemPrompt(),
                },
                ...messages,
            ];

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview', // Hoặc 'gpt-3.5-turbo' cho tiết kiệm chi phí
                messages: conversationMessages,
                functions: this.getFunctionDefinitions(),
                function_call: 'auto',
                temperature: 0.7,
                max_tokens: 1000,
            });

            const message = response.choices[0].message;

            // Nếu AI muốn gọi function
            if (message.function_call) {
                this.logger.log(
                    `Function call requested: ${message.function_call.name}`,
                );
                return {
                    type: 'function_call',
                    functionName: message.function_call.name,
                    arguments: JSON.parse(message.function_call.arguments),
                    message: message,
                };
            }

            // Nếu là response thông thường
            return {
                type: 'message',
                content: message.content,
                message: message,
            };
        } catch (error) {
            this.logger.error(`OpenAI API error: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Tạo embedding cho semantic search (optional, cho advanced features)
     */
    async createEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            this.logger.error(`Embedding error: ${error.message}`);
            throw error;
        }
    }
}
