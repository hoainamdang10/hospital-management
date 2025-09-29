// OpenAPI Schema types
interface SchemaObject {
  type?: string;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: string[];
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  allOf?: Array<{ $ref?: string } | SchemaObject>;
  $ref?: string;
  description?: string;
  example?: any;
  additionalProperties?: boolean | SchemaObject;
  oneOf?: Array<SchemaObject>;
}

interface PathItemObject {
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
}

interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: Array<ParameterObject | { $ref: string }>;
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject | { $ref: string }>;
  security?: Array<Record<string, string[]>>;
}

interface ParameterObject {
  name: string;
  in: 'query' | 'path' | 'header';
  required?: boolean;
  description?: string;
  schema: SchemaObject;
}

interface RequestBodyObject {
  required?: boolean;
  content: Record<string, { schema: SchemaObject | { $ref: string } }>;
}

interface ResponseObject {
  description: string;
  content?: Record<string, { schema: SchemaObject | { $ref: string } }>;
}

/**
 * OpenAPI 3.0 schemas for Doctor entities
 */
export const doctorSchemas: Record<string, SchemaObject> = {
  // Doctor entity
  Doctor: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'UUID của bác sĩ',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      doctor_id: {
        type: 'string',
        pattern: '^[A-Z]{4}-DOC-[0-9]{6}-[0-9]{3}$',
        description: 'Mã bác sĩ theo format khoa (CARD-DOC-YYYYMM-XXX)',
        example: 'CARD-DOC-202501-001'
      },
      profile_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID profile trong bảng profiles',
        example: '456e7890-e89b-12d3-a456-426614174001'
      },
      full_name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Họ tên đầy đủ',
        example: 'Bác sĩ Nguyễn Văn A'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email',
        example: 'doctor@hospital.com'
      },
      phone_number: {
        type: 'string',
        pattern: '^0[0-9]{9}$',
        description: 'Số điện thoại Việt Nam',
        example: '0123456789'
      },
      specialization: {
        type: 'string',
        description: 'Chuyên khoa',
        example: 'Tim mạch'
      },
      license_number: {
        type: 'string',
        pattern: '^VN-[A-Z]{2}-[0-9]{4}$',
        description: 'Số giấy phép hành nghề',
        example: 'VN-TM-1234'
      },
      years_of_experience: {
        type: 'integer',
        minimum: 0,
        maximum: 50,
        description: 'Số năm kinh nghiệm',
        example: 10
      },
      department_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID khoa',
        example: '789e0123-e89b-12d3-a456-426614174002'
      },
      gender: {
        type: 'string',
        enum: ['male', 'female', 'other'],
        description: 'Giới tính',
        example: 'male'
      },
      date_of_birth: {
        type: 'string',
        format: 'date',
        description: 'Ngày sinh',
        example: '1985-01-15'
      },
      address: {
        type: 'string',
        maxLength: 500,
        description: 'Địa chỉ',
        example: '123 Đường ABC, Quận 1, TP.HCM'
      },
      photo_url: {
        type: 'string',
        format: 'uri',
        description: 'URL ảnh đại diện',
        example: 'https://example.com/photos/doctor1.jpg'
      },
      bio: {
        type: 'string',
        maxLength: 1000,
        description: 'Tiểu sử',
        example: 'Bác sĩ chuyên khoa Tim mạch với 10 năm kinh nghiệm...'
      },
      consultation_fee: {
        type: 'number',
        minimum: 0,
        description: 'Phí khám (VND)',
        example: 500000
      },
      is_active: {
        type: 'boolean',
        description: 'Trạng thái hoạt động',
        example: true
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Thời gian tạo',
        example: '2025-01-01T12:00:00.000Z'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        description: 'Thời gian cập nhật',
        example: '2025-01-01T12:00:00.000Z'
      }
    },
    required: ['id', 'doctor_id', 'profile_id', 'full_name', 'email', 'specialization', 'license_number', 'years_of_experience', 'department_id']
  },

  // Create Doctor Request
  CreateDoctorRequest: {
    type: 'object',
    properties: {
      full_name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Họ tên đầy đủ',
        example: 'Nguyễn Văn A'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email',
        example: 'doctor@hospital.com'
      },
      phone_number: {
        type: 'string',
        pattern: '^0[0-9]{9}$',
        description: 'Số điện thoại Việt Nam',
        example: '0123456789'
      },
      specialization: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Chuyên khoa',
        example: 'Tim mạch'
      },
      license_number: {
        type: 'string',
        pattern: '^VN-[A-Z]{2}-[0-9]{4}$',
        description: 'Số giấy phép hành nghề',
        example: 'VN-TM-1234'
      },
      years_of_experience: {
        type: 'integer',
        minimum: 0,
        maximum: 50,
        description: 'Số năm kinh nghiệm',
        example: 10
      },
      department_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID khoa',
        example: '789e0123-e89b-12d3-a456-426614174002'
      },
      gender: {
        type: 'string',
        enum: ['male', 'female', 'other'],
        description: 'Giới tính',
        example: 'male'
      },
      date_of_birth: {
        type: 'string',
        format: 'date',
        description: 'Ngày sinh',
        example: '1985-01-15'
      },
      address: {
        type: 'string',
        maxLength: 500,
        description: 'Địa chỉ',
        example: '123 Đường ABC, Quận 1, TP.HCM'
      },
      bio: {
        type: 'string',
        maxLength: 1000,
        description: 'Tiểu sử',
        example: 'Bác sĩ chuyên khoa Tim mạch với 10 năm kinh nghiệm...'
      },
      consultation_fee: {
        type: 'number',
        minimum: 0,
        description: 'Phí khám (VND)',
        example: 500000
      }
    },
    required: ['full_name', 'email', 'phone_number', 'specialization', 'license_number', 'years_of_experience', 'department_id']
  },

  // Update Doctor Request
  UpdateDoctorRequest: {
    type: 'object',
    properties: {
      full_name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Họ tên đầy đủ',
        example: 'Nguyễn Văn A'
      },
      phone_number: {
        type: 'string',
        pattern: '^0[0-9]{9}$',
        description: 'Số điện thoại Việt Nam',
        example: '0123456789'
      },
      specialization: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Chuyên khoa',
        example: 'Tim mạch'
      },
      years_of_experience: {
        type: 'integer',
        minimum: 0,
        maximum: 50,
        description: 'Số năm kinh nghiệm',
        example: 10
      },
      department_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID khoa',
        example: '789e0123-e89b-12d3-a456-426614174002'
      },
      address: {
        type: 'string',
        maxLength: 500,
        description: 'Địa chỉ',
        example: '123 Đường ABC, Quận 1, TP.HCM'
      },
      bio: {
        type: 'string',
        maxLength: 1000,
        description: 'Tiểu sử',
        example: 'Bác sĩ chuyên khoa Tim mạch với 10 năm kinh nghiệm...'
      },
      consultation_fee: {
        type: 'number',
        minimum: 0,
        description: 'Phí khám (VND)',
        example: 500000
      },
      is_active: {
        type: 'boolean',
        description: 'Trạng thái hoạt động',
        example: true
      }
    }
  },

  // Doctor List Response
  DoctorListResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardApiResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Doctor'
            }
          },
          pagination: {
            $ref: '#/components/schemas/Pagination'
          }
        }
      }
    ]
  },

  // Single Doctor Response
  DoctorResponse: {
    allOf: [
      { $ref: '#/components/schemas/StandardApiResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/Doctor'
          }
        }
      }
    ]
  },

  // Doctor Experience
  DoctorExperience: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'ID kinh nghiệm',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      doctor_id: {
        type: 'string',
        description: 'ID bác sĩ',
        example: 'CARD-DOC-202501-001'
      },
      hospital_name: {
        type: 'string',
        description: 'Tên bệnh viện',
        example: 'Bệnh viện Chợ Rẫy'
      },
      position: {
        type: 'string',
        description: 'Chức vụ',
        example: 'Bác sĩ trưởng khoa'
      },
      start_date: {
        type: 'string',
        format: 'date',
        description: 'Ngày bắt đầu',
        example: '2020-01-01'
      },
      end_date: {
        type: 'string',
        format: 'date',
        description: 'Ngày kết thúc',
        example: '2023-12-31'
      },
      description: {
        type: 'string',
        maxLength: 1000,
        description: 'Mô tả công việc',
        example: 'Phụ trách khoa Tim mạch, thực hiện các ca phẫu thuật tim...'
      },
      is_current: {
        type: 'boolean',
        description: 'Có phải công việc hiện tại',
        example: false
      }
    },
    required: ['doctor_id', 'hospital_name', 'position', 'start_date']
  },

  // Doctor Schedule
  DoctorSchedule: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'ID lịch làm việc'
      },
      doctor_id: {
        type: 'string',
        description: 'ID bác sĩ'
      },
      day_of_week: {
        type: 'integer',
        minimum: 0,
        maximum: 6,
        description: 'Thứ trong tuần (0=Chủ nhật, 1=Thứ 2, ...)',
        example: 1
      },
      start_time: {
        type: 'string',
        pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
        description: 'Giờ bắt đầu (HH:MM)',
        example: '08:00'
      },
      end_time: {
        type: 'string',
        pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
        description: 'Giờ kết thúc (HH:MM)',
        example: '17:00'
      },
      is_available: {
        type: 'boolean',
        description: 'Có sẵn sàng',
        example: true
      }
    },
    required: ['doctor_id', 'day_of_week', 'start_time', 'end_time']
  },

  // Doctor Review
  DoctorReview: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'ID đánh giá'
      },
      doctor_id: {
        type: 'string',
        description: 'ID bác sĩ'
      },
      patient_id: {
        type: 'string',
        description: 'ID bệnh nhân'
      },
      rating: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        description: 'Điểm đánh giá (1-5 sao)',
        example: 5
      },
      comment: {
        type: 'string',
        maxLength: 1000,
        description: 'Nhận xét',
        example: 'Bác sĩ rất tận tâm và chuyên nghiệp'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Thời gian tạo'
      }
    },
    required: ['doctor_id', 'patient_id', 'rating']
  },

  // Doctor Stats
  DoctorStats: {
    type: 'object',
    properties: {
      total_appointments: {
        type: 'integer',
        description: 'Tổng số lịch hẹn',
        example: 150
      },
      completed_appointments: {
        type: 'integer',
        description: 'Số lịch hẹn đã hoàn thành',
        example: 140
      },
      total_patients: {
        type: 'integer',
        description: 'Tổng số bệnh nhân',
        example: 120
      },
      average_rating: {
        type: 'number',
        minimum: 0,
        maximum: 5,
        description: 'Điểm đánh giá trung bình',
        example: 4.8
      },
      total_reviews: {
        type: 'integer',
        description: 'Tổng số đánh giá',
        example: 85
      },
      upcoming_appointments: {
        type: 'integer',
        description: 'Số lịch hẹn sắp tới',
        example: 10
      }
    }
  }
};

/**
 * Doctor API paths for OpenAPI documentation
 */
export const doctorPaths: Record<string, PathItemObject> = {
  '/api/doctors': {
    get: {
      tags: ['Doctors'],
      summary: 'Lấy danh sách bác sĩ',
      description: 'Lấy danh sách bác sĩ với phân trang và tìm kiếm',
      parameters: [
        { $ref: '#/components/parameters/PageParam' },
        { $ref: '#/components/parameters/LimitParam' },
        { $ref: '#/components/parameters/SearchParam' },
        {
          name: 'specialization',
          in: 'query',
          description: 'Lọc theo chuyên khoa',
          schema: {
            type: 'string',
            example: 'Tim mạch'
          }
        },
        {
          name: 'department_id',
          in: 'query',
          description: 'Lọc theo khoa',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Danh sách bác sĩ',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DoctorListResponse'
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '500': { $ref: '#/components/responses/InternalServerError' }
      }
    },
    post: {
      tags: ['Doctors'],
      summary: 'Tạo bác sĩ mới',
      description: 'Tạo bác sĩ mới trong hệ thống',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateDoctorRequest'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Tạo bác sĩ thành công',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DoctorResponse'
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '500': { $ref: '#/components/responses/InternalServerError' }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  '/api/doctors/{doctorId}': {
    get: {
      tags: ['Doctors'],
      summary: 'Lấy thông tin bác sĩ',
      description: 'Lấy thông tin chi tiết của một bác sĩ',
      parameters: [
        {
          name: 'doctorId',
          in: 'path',
          required: true,
          description: 'ID hoặc doctor_id của bác sĩ',
          schema: {
            type: 'string',
            example: 'CARD-DOC-202501-001'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Thông tin bác sĩ',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DoctorResponse'
              }
            }
          }
        },
        '404': { $ref: '#/components/responses/NotFound' },
        '500': { $ref: '#/components/responses/InternalServerError' }
      }
    },
    put: {
      tags: ['Doctors'],
      summary: 'Cập nhật thông tin bác sĩ',
      description: 'Cập nhật thông tin của một bác sĩ',
      parameters: [
        {
          name: 'doctorId',
          in: 'path',
          required: true,
          description: 'ID hoặc doctor_id của bác sĩ',
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateDoctorRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Cập nhật thành công',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DoctorResponse'
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
        '500': { $ref: '#/components/responses/InternalServerError' }
      },
      security: [{ bearerAuth: [] }]
    },
    delete: {
      tags: ['Doctors'],
      summary: 'Xóa bác sĩ',
      description: 'Xóa mềm một bác sĩ (đặt is_active = false)',
      parameters: [
        {
          name: 'doctorId',
          in: 'path',
          required: true,
          description: 'ID hoặc doctor_id của bác sĩ',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Xóa thành công',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/StandardApiResponse'
              }
            }
          }
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
        '500': { $ref: '#/components/responses/InternalServerError' }
      },
      security: [{ bearerAuth: [] }]
    }
  }
};
