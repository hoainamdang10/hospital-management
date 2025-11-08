import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@infrastructure/docs/SwaggerConfig';

/**
 * Swagger Documentation Routes
 * Provides interactive API documentation at /api-docs
 */
export function createDocsRoutes(): Router {
  const router = Router();

  // Swagger UI options
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #2c3e50; }
    `,
    customSiteTitle: 'Hospital Management API Docs',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  };

  // Serve Swagger UI
  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Serve raw OpenAPI spec as JSON
  router.get('/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  return router;
}

/**
 * OpenAPI Documentation for Health Check Endpoints
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health Check
 *     summary: Kiểm tra trạng thái tất cả services
 *     description: Trả về trạng thái health của API Gateway và tất cả downstream services
 *     security: []
 *     responses:
 *       200:
 *         description: Tất cả services đang hoạt động bình thường
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Một hoặc nhiều services đang gặp sự cố
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */

/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags:
 *       - Health Check
 *     summary: Readiness probe
 *     description: Kiểm tra API Gateway đã sẵn sàng nhận requests
 *     security: []
 *     responses:
 *       200:
 *         description: API Gateway sẵn sàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @openapi
 * /health/live:
 *   get:
 *     tags:
 *       - Health Check
 *     summary: Liveness probe
 *     description: Kiểm tra API Gateway đang chạy
 *     security: []
 *     responses:
 *       200:
 *         description: API Gateway đang chạy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Đăng nhập
 *     description: Đăng nhập bằng email và password, trả về JWT token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: doctor@hospital.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *       401:
 *         description: Email hoặc password không đúng
 *       429:
 *         description: Quá nhiều lần thử đăng nhập
 *
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Đăng ký tài khoản mới
 *     description: Tạo tài khoản người dùng mới
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email đã tồn tại
 *
 * /api/v1/patients:
 *   get:
 *     tags:
 *       - Patients
 *     summary: Lấy danh sách bệnh nhân
 *     description: Trả về danh sách bệnh nhân (có phân trang)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách bệnh nhân
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     tags:
 *       - Patients
 *     summary: Tạo bệnh nhân mới
 *     description: Đăng ký bệnh nhân mới vào hệ thống
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Tạo bệnh nhân thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *
 * /api/v1/patients/{id}:
 *   get:
 *     tags:
 *       - Patients
 *     summary: Lấy thông tin bệnh nhân
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Thông tin bệnh nhân
 *       404:
 *         description: Không tìm thấy bệnh nhân
 */

/**
 * @openapi
 * /api/v1/providers:
 *   get:
 *     tags:
 *       - Providers
 *     summary: Lấy danh sách bác sĩ/nhân viên
 *     description: Trả về danh sách providers (có phân trang)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Lọc theo chuyên khoa
 *     responses:
 *       200:
 *         description: Danh sách providers
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /api/v1/providers/{id}:
 *   get:
 *     tags:
 *       - Providers
 *     summary: Lấy thông tin bác sĩ/nhân viên
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Thông tin provider
 *       404:
 *         description: Không tìm thấy provider
 *
 * /api/v1/providers/{id}/schedule:
 *   get:
 *     tags:
 *       - Providers
 *     summary: Lấy lịch làm việc của bác sĩ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lịch làm việc
 *
 * /api/v1/appointments:
 *   get:
 *     tags:
 *       - Appointments
 *     summary: Lấy danh sách lịch hẹn
 *     description: Trả về danh sách appointments (có phân trang)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, CONFIRMED, CANCELLED, COMPLETED]
 *     responses:
 *       200:
 *         description: Danh sách appointments
 *   post:
 *     tags:
 *       - Appointments
 *     summary: Đặt lịch hẹn mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - providerId
 *               - appointmentDate
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               providerId:
 *                 type: string
 *                 format: uuid
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đặt lịch thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Lịch hẹn bị trùng
 *
 * /api/v1/appointments/{id}:
 *   get:
 *     tags:
 *       - Appointments
 *     summary: Lấy thông tin lịch hẹn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Thông tin appointment
 *   delete:
 *     tags:
 *       - Appointments
 *     summary: Hủy lịch hẹn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Hủy lịch thành công
 *       404:
 *         description: Không tìm thấy lịch hẹn
 */

/**
 * @openapi
 * /api/v2/clinical-emr/records:
 *   get:
 *     tags:
 *       - Clinical EMR
 *     summary: Lấy danh sách hồ sơ bệnh án
 *     description: Trả về danh sách EMR records (FHIR R4 compliant)
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Danh sách EMR records
 *   post:
 *     tags:
 *       - Clinical EMR
 *     summary: Tạo hồ sơ bệnh án mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - providerId
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               providerId:
 *                 type: string
 *                 format: uuid
 *               diagnosis:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo EMR thành công
 *
 * /api/v1/billing/invoices:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Lấy danh sách hóa đơn
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, CANCELLED]
 *     responses:
 *       200:
 *         description: Danh sách hóa đơn
 *   post:
 *     tags:
 *       - Billing
 *     summary: Tạo hóa đơn mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - amount
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 example: 500000
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo hóa đơn thành công
 *
 * /api/v1/billing/payments:
 *   post:
 *     tags:
 *       - Billing
 *     summary: Thanh toán hóa đơn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, BANK_TRANSFER, INSURANCE]
 *     responses:
 *       200:
 *         description: Thanh toán thành công
 *
 * /api/v1/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Lấy danh sách thông báo
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 *
 * /api/v1/notifications/{id}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Đánh dấu đã đọc
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 *
 * /api/v1/schedules:
 *   get:
 *     tags:
 *       - Scheduler
 *     summary: Lấy danh sách scheduled jobs
 *     responses:
 *       200:
 *         description: Danh sách jobs
 *   post:
 *     tags:
 *       - Scheduler
 *     summary: Tạo scheduled job mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cronExpression
 *             properties:
 *               name:
 *                 type: string
 *               cronExpression:
 *                 type: string
 *                 example: "0 0 * * *"
 *               enabled:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Tạo job thành công
 */

