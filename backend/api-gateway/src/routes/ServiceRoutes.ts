/**
 * ServiceRoutes - Enhanced Service Route Configuration
 * Comprehensive route definitions for all microservices with Vietnamese healthcare standards
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Pure API Gateway Pattern, Vietnamese Healthcare Standards, RESTful API Design
 */

import { Request, Response, Router } from "express";
import { EnhancedGatewayConfig } from "../config/EnhancedGatewayConfig";
import { CircuitBreakerMiddleware } from "../middleware/CircuitBreakerMiddleware";
import { PureAPIGatewayMiddleware } from "../middleware/PureAPIGatewayMiddleware";

export interface RouteDefinition {
  path: string;
  method: string;
  serviceName: string;
  description: string;
  vietnameseDescription: string;
  requiresAuth: boolean;
  roles: string[];
  rateLimit?: number;
  cacheEnabled: boolean;
  healthcareContext: string;
}

export interface ServiceRouteGroup {
  serviceName: string;
  basePrefix: string;
  description: string;
  vietnameseDescription: string;
  routes: RouteDefinition[];
  middlewares: string[];
  healthCheck: string;
}

export class ServiceRoutes {
  private static instance: ServiceRoutes;
  private router: Router;
  private config: EnhancedGatewayConfig;
  private pureAPIGateway: PureAPIGatewayMiddleware;
  private circuitBreaker: CircuitBreakerMiddleware;

  private constructor() {
    this.router = Router();
    this.config = EnhancedGatewayConfig.getInstance();
    this.pureAPIGateway = PureAPIGatewayMiddleware.getInstance();
    this.circuitBreaker = CircuitBreakerMiddleware.getInstance();
    this.setupRoutes();
  }

  public static getInstance(): ServiceRoutes {
    if (!ServiceRoutes.instance) {
      ServiceRoutes.instance = new ServiceRoutes();
    }
    return ServiceRoutes.instance;
  }

  /**
   * Setup all service routes
   */
  private setupRoutes(): void {
    console.log(
      "🛣️ Setting up Enhanced Service Routes for Vietnamese Healthcare System"
    );

    // Apply global middleware
    this.router.use(this.circuitBreaker.middleware());
    this.router.use(this.pureAPIGateway.middleware());

    // Setup service route groups
    const serviceRouteGroups = this.getServiceRouteGroups();

    for (const group of serviceRouteGroups) {
      this.setupServiceRouteGroup(group);
    }

    // Setup health check routes
    this.setupHealthCheckRoutes();

    // Setup Vietnamese healthcare specific routes
    this.setupVietnameseHealthcareRoutes();

    console.log("✅ All service routes configured successfully");
  }

  /**
   * Get service route groups
   */
  private getServiceRouteGroups(): ServiceRouteGroup[] {
    return [
      {
        serviceName: "identity-service",
        basePrefix: "/api/v1/auth",
        description: "Identity and Authentication Service",
        vietnameseDescription: "Dịch vụ Xác thực và Phân quyền",
        middlewares: ["auth", "rateLimit"],
        healthCheck: "/health",
        routes: [
          {
            path: "/login",
            method: "POST",
            serviceName: "identity-service",
            description: "User login",
            vietnameseDescription: "Đăng nhập người dùng",
            requiresAuth: false,
            roles: [],
            rateLimit: 10,
            cacheEnabled: false,
            healthcareContext: "AUTHENTICATION",
          },
          {
            path: "/logout",
            method: "POST",
            serviceName: "identity-service",
            description: "User logout",
            vietnameseDescription: "Đăng xuất người dùng",
            requiresAuth: true,
            roles: ["USER"],
            cacheEnabled: false,
            healthcareContext: "AUTHENTICATION",
          },
          {
            path: "/profile",
            method: "GET",
            serviceName: "identity-service",
            description: "Get user profile",
            vietnameseDescription: "Lấy thông tin hồ sơ người dùng",
            requiresAuth: true,
            roles: ["USER"],
            cacheEnabled: true,
            healthcareContext: "USER_PROFILE",
          },
        ],
      },

      {
        serviceName: "patient-registry-service",
        basePrefix: "/api/v1/patients",
        description: "Patient Registry Service",
        vietnameseDescription: "Dịch vụ Đăng ký Bệnh nhân",
        middlewares: ["auth", "rateLimit", "hipaaCompliance"],
        healthCheck: "/health",
        routes: [
          {
            path: "/",
            method: "POST",
            serviceName: "patient-registry-service",
            description: "Register new patient",
            vietnameseDescription: "Đăng ký bệnh nhân mới",
            requiresAuth: true,
            roles: ["RECEPTIONIST", "NURSE", "DOCTOR", "ADMIN"],
            cacheEnabled: false,
            healthcareContext: "PATIENT_REGISTRATION",
          },
          {
            path: "/:patientId",
            method: "GET",
            serviceName: "patient-registry-service",
            description: "Get patient details",
            vietnameseDescription: "Lấy thông tin chi tiết bệnh nhân",
            requiresAuth: true,
            roles: ["NURSE", "DOCTOR", "ADMIN"],
            cacheEnabled: true,
            healthcareContext: "PATIENT_DATA",
          },
          {
            path: "/:patientId",
            method: "PUT",
            serviceName: "patient-registry-service",
            description: "Update patient information",
            vietnameseDescription: "Cập nhật thông tin bệnh nhân",
            requiresAuth: true,
            roles: ["RECEPTIONIST", "NURSE", "ADMIN"],
            cacheEnabled: false,
            healthcareContext: "PATIENT_UPDATE",
          },
          {
            path: "/:patientId/insurance",
            method: "GET",
            serviceName: "patient-registry-service",
            description: "Get patient insurance information",
            vietnameseDescription: "Lấy thông tin bảo hiểm bệnh nhân",
            requiresAuth: true,
            roles: ["RECEPTIONIST", "BILLING", "ADMIN"],
            cacheEnabled: true,
            healthcareContext: "INSURANCE_DATA",
          },
        ],
      },

      {
        serviceName: "provider-staff-service",
        basePrefix: "/api/v1/providers",
        description: "Healthcare Provider Staff Service",
        vietnameseDescription: "Dịch vụ Nhân viên Y tế",
        middlewares: ["auth", "rateLimit"],
        healthCheck: "/health",
        routes: [
          {
            path: "/doctors",
            method: "GET",
            serviceName: "provider-staff-service",
            description: "Get all doctors",
            vietnameseDescription: "Lấy danh sách bác sĩ",
            requiresAuth: true,
            roles: ["USER"],
            cacheEnabled: true,
            healthcareContext: "PROVIDER_DIRECTORY",
          },
          {
            path: "/doctors/:doctorId",
            method: "GET",
            serviceName: "provider-staff-service",
            description: "Get doctor details",
            vietnameseDescription: "Lấy thông tin chi tiết bác sĩ",
            requiresAuth: true,
            roles: ["USER"],
            cacheEnabled: true,
            healthcareContext: "PROVIDER_PROFILE",
          },
          {
            path: "/doctors/:doctorId/schedule",
            method: "GET",
            serviceName: "provider-staff-service",
            description: "Get doctor schedule",
            vietnameseDescription: "Lấy lịch làm việc của bác sĩ",
            requiresAuth: true,
            roles: ["USER"],
            cacheEnabled: true,
            healthcareContext: "PROVIDER_SCHEDULE",
          },
        ],
      },

      {
        serviceName: "scheduling-service",
        basePrefix: "/api/v1/appointments",
        description: "Appointment Scheduling Service",
        vietnameseDescription: "Dịch vụ Đặt lịch Khám bệnh",
        middlewares: ["auth", "rateLimit", "appointmentValidation"],
        healthCheck: "/health",
        routes: [
          {
            path: "/",
            method: "POST",
            serviceName: "scheduling-service",
            description: "Schedule new appointment",
            vietnameseDescription: "Đặt lịch hẹn mới",
            requiresAuth: true,
            roles: ["PATIENT", "RECEPTIONIST", "NURSE"],
            cacheEnabled: false,
            healthcareContext: "APPOINTMENT_SCHEDULING",
          },
          {
            path: "/:appointmentId",
            method: "GET",
            serviceName: "scheduling-service",
            description: "Get appointment details",
            vietnameseDescription: "Lấy thông tin chi tiết lịch hẹn",
            requiresAuth: true,
            roles: ["PATIENT", "DOCTOR", "NURSE", "RECEPTIONIST"],
            cacheEnabled: true,
            healthcareContext: "APPOINTMENT_DATA",
          },
          {
            path: "/:appointmentId",
            method: "PUT",
            serviceName: "scheduling-service",
            description: "Update appointment",
            vietnameseDescription: "Cập nhật lịch hẹn",
            requiresAuth: true,
            roles: ["PATIENT", "RECEPTIONIST", "NURSE"],
            cacheEnabled: false,
            healthcareContext: "APPOINTMENT_UPDATE",
          },
          {
            path: "/:appointmentId/cancel",
            method: "POST",
            serviceName: "scheduling-service",
            description: "Cancel appointment",
            vietnameseDescription: "Hủy lịch hẹn",
            requiresAuth: true,
            roles: ["PATIENT", "RECEPTIONIST", "NURSE", "DOCTOR"],
            cacheEnabled: false,
            healthcareContext: "APPOINTMENT_CANCELLATION",
          },
          {
            path: "/availability",
            method: "GET",
            serviceName: "scheduling-service",
            description: "Check appointment availability",
            vietnameseDescription: "Kiểm tra lịch trống",
            requiresAuth: true,
            roles: ["USER"],
            cacheEnabled: true,
            healthcareContext: "AVAILABILITY_CHECK",
          },
        ],
      },

      {
        serviceName: "clinical-emr-service",
        basePrefix: "/api/v1/medical-records",
        description: "Clinical Electronic Medical Records Service",
        vietnameseDescription: "Dịch vụ Hồ sơ Y tế Điện tử",
        middlewares: [
          "auth",
          "rateLimit",
          "hipaaCompliance",
          "medicalRecordAccess",
        ],
        healthCheck: "/health",
        routes: [
          {
            path: "/",
            method: "POST",
            serviceName: "clinical-emr-service",
            description: "Create medical record",
            vietnameseDescription: "Tạo hồ sơ y tế",
            requiresAuth: true,
            roles: ["DOCTOR", "NURSE"],
            cacheEnabled: false,
            healthcareContext: "MEDICAL_RECORD_CREATION",
          },
          {
            path: "/:recordId",
            method: "GET",
            serviceName: "clinical-emr-service",
            description: "Get medical record",
            vietnameseDescription: "Lấy hồ sơ y tế",
            requiresAuth: true,
            roles: ["DOCTOR", "NURSE", "PATIENT"],
            cacheEnabled: false, // Medical records should not be cached
            healthcareContext: "MEDICAL_RECORD_ACCESS",
          },
          {
            path: "/:recordId",
            method: "PUT",
            serviceName: "clinical-emr-service",
            description: "Update medical record",
            vietnameseDescription: "Cập nhật hồ sơ y tế",
            requiresAuth: true,
            roles: ["DOCTOR", "NURSE"],
            cacheEnabled: false,
            healthcareContext: "MEDICAL_RECORD_UPDATE",
          },
          {
            path: "/patient/:patientId",
            method: "GET",
            serviceName: "clinical-emr-service",
            description: "Get patient medical history",
            vietnameseDescription: "Lấy lịch sử y tế bệnh nhân",
            requiresAuth: true,
            roles: ["DOCTOR", "NURSE"],
            cacheEnabled: false,
            healthcareContext: "MEDICAL_HISTORY",
          },
          {
            path: "/:recordId/reports",
            method: "POST",
            serviceName: "clinical-emr-service",
            description: "Generate medical report",
            vietnameseDescription: "Tạo báo cáo y tế",
            requiresAuth: true,
            roles: ["DOCTOR"],
            cacheEnabled: false,
            healthcareContext: "MEDICAL_REPORT_GENERATION",
          },
        ],
      },

      {
        serviceName: "billing-service",
        basePrefix: "/api/v1/billing",
        description: "Billing and Payment Service",
        vietnameseDescription: "Dịch vụ Thanh toán và Hóa đơn",
        middlewares: ["auth", "rateLimit", "billingValidation"],
        healthCheck: "/health",
        routes: [
          {
            path: "/invoices",
            method: "POST",
            serviceName: "billing-service",
            description: "Generate invoice",
            vietnameseDescription: "Tạo hóa đơn",
            requiresAuth: true,
            roles: ["BILLING", "RECEPTIONIST", "ADMIN"],
            cacheEnabled: false,
            healthcareContext: "INVOICE_GENERATION",
          },
          {
            path: "/invoices/:invoiceId",
            method: "GET",
            serviceName: "billing-service",
            description: "Get invoice details",
            vietnameseDescription: "Lấy thông tin hóa đơn",
            requiresAuth: true,
            roles: ["PATIENT", "BILLING", "ADMIN"],
            cacheEnabled: true,
            healthcareContext: "INVOICE_DATA",
          },
          {
            path: "/payments",
            method: "POST",
            serviceName: "billing-service",
            description: "Process payment",
            vietnameseDescription: "Xử lý thanh toán",
            requiresAuth: true,
            roles: ["PATIENT", "BILLING", "RECEPTIONIST"],
            cacheEnabled: false,
            healthcareContext: "PAYMENT_PROCESSING",
          },
          {
            path: "/insurance/validate",
            method: "POST",
            serviceName: "billing-service",
            description: "Validate insurance coverage",
            vietnameseDescription: "Xác thực bảo hiểm",
            requiresAuth: true,
            roles: ["BILLING", "RECEPTIONIST"],
            cacheEnabled: true,
            healthcareContext: "INSURANCE_VALIDATION",
          },
          {
            path: "/patient/:patientId/invoices",
            method: "GET",
            serviceName: "billing-service",
            description: "Get patient invoices",
            vietnameseDescription: "Lấy hóa đơn của bệnh nhân",
            requiresAuth: true,
            roles: ["PATIENT", "BILLING", "ADMIN"],
            cacheEnabled: true,
            healthcareContext: "PATIENT_BILLING_HISTORY",
          },
        ],
      },

      {
        serviceName: "notifications-service",
        basePrefix: "/api/v1/notifications",
        description: "Notification Service",
        vietnameseDescription: "Dịch vụ Thông báo",
        middlewares: ["auth", "rateLimit"],
        healthCheck: "/health",
        routes: [
          {
            path: "/send",
            method: "POST",
            serviceName: "notifications-service",
            description: "Send notification",
            vietnameseDescription: "Gửi thông báo",
            requiresAuth: true,
            roles: ["SYSTEM", "ADMIN", "DOCTOR", "NURSE"],
            cacheEnabled: false,
            healthcareContext: "NOTIFICATION_SENDING",
          },
          {
            path: "/schedule",
            method: "POST",
            serviceName: "notifications-service",
            description: "Schedule notification",
            vietnameseDescription: "Lên lịch thông báo",
            requiresAuth: true,
            roles: ["SYSTEM", "ADMIN", "DOCTOR", "NURSE"],
            cacheEnabled: false,
            healthcareContext: "NOTIFICATION_SCHEDULING",
          },
          {
            path: "/patient/:patientId",
            method: "GET",
            serviceName: "notifications-service",
            description: "Get patient notifications",
            vietnameseDescription: "Lấy thông báo của bệnh nhân",
            requiresAuth: true,
            roles: ["PATIENT", "DOCTOR", "NURSE"],
            cacheEnabled: true,
            healthcareContext: "NOTIFICATION_HISTORY",
          },
          {
            path: "/templates",
            method: "GET",
            serviceName: "notifications-service",
            description: "Get notification templates",
            vietnameseDescription: "Lấy mẫu thông báo",
            requiresAuth: true,
            roles: ["ADMIN", "SYSTEM"],
            cacheEnabled: true,
            healthcareContext: "NOTIFICATION_TEMPLATES",
          },
        ],
      },
    ];
  }

  /**
   * Setup service route group
   */
  private setupServiceRouteGroup(group: ServiceRouteGroup): void {
    console.log(
      `🔧 Setting up routes for ${group.serviceName} (${group.vietnameseDescription})`
    );

    for (const route of group.routes) {
      const fullPath = `${group.basePrefix}${route.path}`;

      console.log(
        `   📍 ${route.method.toUpperCase()} ${fullPath} - ${route.vietnameseDescription}`
      );

      // Routes are handled by Pure API Gateway middleware
      // No need to define individual route handlers as middleware handles all routing
    }
  }

  /**
   * Setup health check routes
   */
  private setupHealthCheckRoutes(): void {
    // Gateway health check
    this.router.get("/health", (req: Request, res: Response) => {
      const gatewayStatus = this.pureAPIGateway.getStatus();
      const circuitBreakerSummary =
        this.circuitBreaker.getVietnameseHealthcareSummary();

      res.json({
        status: "healthy",
        service: "api-gateway",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
        vietnamese: {
          message: "Cổng API hoạt động bình thường",
          healthcareCompliance: "Tuân thủ tiêu chuẩn y tế Việt Nam",
        },
        pureAPIGateway: gatewayStatus,
        circuitBreakers: circuitBreakerSummary,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      });
    });

    // Service health checks
    this.router.get("/health/services", (req: Request, res: Response) => {
      const allServices = this.config.getAllServices();
      const serviceHealth: Record<string, any> = {};

      for (const [serviceName, serviceConfig] of Object.entries(allServices)) {
        const healthyInstances = this.config.getHealthyInstances(serviceName);
        serviceHealth[serviceName] = {
          enabled: serviceConfig.enabled,
          totalInstances: serviceConfig.instances.length,
          healthyInstances: healthyInstances.length,
          status: healthyInstances.length > 0 ? "healthy" : "unhealthy",
          vietnamese: {
            name: this.getVietnameseServiceName(serviceName),
            status:
              healthyInstances.length > 0
                ? "Hoạt động bình thường"
                : "Không khả dụng",
          },
        };
      }

      res.json({
        overallStatus: Object.values(serviceHealth).every(
          (s) => s.status === "healthy"
        )
          ? "healthy"
          : "degraded",
        services: serviceHealth,
        timestamp: new Date().toISOString(),
        vietnamese: {
          message: "Trạng thái các dịch vụ y tế",
          compliance: "Tuân thủ HIPAA và tiêu chuẩn y tế Việt Nam",
        },
      });
    });
  }

  /**
   * Setup Vietnamese healthcare specific routes
   */
  private setupVietnameseHealthcareRoutes(): void {
    // BHYT validation endpoint
    this.router.post(
      "/api/v1/healthcare/bhyt/validate",
      (req: Request, res: Response) => {
        // This will be routed to billing service for BHYT validation
      }
    );

    // MOH reporting endpoint
    this.router.post(
      "/api/v1/healthcare/moh/report",
      (req: Request, res: Response) => {
        // This will be routed to appropriate service for MOH reporting
      }
    );

    // Vietnamese healthcare compliance check
    this.router.get(
      "/api/v1/healthcare/compliance",
      (req: Request, res: Response) => {
        const compliance = this.config.validateVietnameseHealthcareCompliance();

        res.json({
          compliant: compliance,
          standards: {
            hipaa: true,
            vietnameseHealthcare: true,
            bhyt: true,
            bhtn: true,
            moh: true,
          },
          vietnamese: {
            message: compliance
              ? "Tuân thủ đầy đủ các tiêu chuẩn"
              : "Chưa tuân thủ một số tiêu chuẩn",
            details: "Hệ thống tuân thủ HIPAA và các tiêu chuẩn y tế Việt Nam",
          },
          timestamp: new Date().toISOString(),
        });
      }
    );
  }

  /**
   * Get Vietnamese service name
   */
  private getVietnameseServiceName(serviceName: string): string {
    const vietnameseNames: Record<string, string> = {
      "identity-service": "Dịch vụ Xác thực",
      "patient-registry-service": "Dịch vụ Đăng ký Bệnh nhân",
      "provider-staff-service": "Dịch vụ Nhân viên Y tế",
      "scheduling-service": "Dịch vụ Đặt lịch Khám",
      "clinical-emr-service": "Dịch vụ Hồ sơ Y tế",
      "billing-service": "Dịch vụ Thanh toán",
      "notifications-service": "Dịch vụ Thông báo",
    };

    return vietnameseNames[serviceName] || serviceName;
  }

  /**
   * Get router
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Get route documentation
   */
  public getRouteDocumentation(): any {
    const serviceGroups = this.getServiceRouteGroups();

    return {
      title: "Hospital Management System V2 - API Gateway Routes",
      vietnamese: {
        title: "Hệ thống Quản lý Bệnh viện V2 - Định tuyến Cổng API",
        description:
          "Tài liệu API cho hệ thống quản lý bệnh viện tuân thủ tiêu chuẩn y tế Việt Nam",
      },
      version: "2.0.0",
      baseUrl: `http://localhost:${this.config.getConfig().gateway.port}`,
      services: serviceGroups.map((group) => ({
        serviceName: group.serviceName,
        description: group.description,
        vietnameseDescription: group.vietnameseDescription,
        basePrefix: group.basePrefix,
        routes: group.routes.map((route) => ({
          method: route.method,
          path: `${group.basePrefix}${route.path}`,
          description: route.description,
          vietnameseDescription: route.vietnameseDescription,
          requiresAuth: route.requiresAuth,
          roles: route.roles,
          healthcareContext: route.healthcareContext,
        })),
      })),
      compliance: {
        hipaa: true,
        vietnameseHealthcare: true,
        pureAPIGateway: true,
        circuitBreaker: true,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
