export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

// Standardized API Response format for all microservices
export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
    service: string;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface ServiceConfig {
  name: string;
  port: number;
  host: string;
  version: string;
  environment: "development" | "staging" | "production";
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface RabbitMQConfig {
  url: string;
  exchange: string;
  queues: {
    [key: string]: string;
  };
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface EmailConfig {
  provider: "sendgrid" | "ses" | "smtp";
  apiKey?: string;
  from: string;
  templates: {
    [key: string]: string;
  };
}

export interface SMSConfig {
  provider: "twilio" | "aws-sns";
  accountSid?: string;
  authToken?: string;
  from: string;
}

export enum UserRole {
  ADMIN = "admin",
  DOCTOR = "doctor",
  PATIENT = "patient",
  RECEPTIONIST = "receptionist",
}

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export enum NotificationType {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
  IN_APP = "in_app",
}

export enum EventType {
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",
  USER_LOGIN = "user.login",
  USER_LOGOUT = "user.logout",

  DOCTOR_CREATED = "doctor.created",
  DOCTOR_UPDATED = "doctor.updated",
  DOCTOR_SCHEDULE_UPDATED = "doctor.schedule_updated",

  PATIENT_CREATED = "patient.created",
  PATIENT_UPDATED = "patient.updated",

  APPOINTMENT_CREATED = "appointment.created",
  APPOINTMENT_UPDATED = "appointment.updated",
  APPOINTMENT_CANCELLED = "appointment.cancelled",
  APPOINTMENT_COMPLETED = "appointment.completed",

  PAYMENT_CREATED = "payment.created",
  PAYMENT_COMPLETED = "payment.completed",
  PAYMENT_FAILED = "payment.failed",

  NOTIFICATION_SENT = "notification.sent",
  NOTIFICATION_FAILED = "notification.failed",
}

export interface Event {
  id: string;
  type: EventType;
  data: any;
  timestamp: Date;
  source: string;
  version: string;
}

export interface HealthCheck {
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: Date;
  uptime: number;
  version: string;
  dependencies: {
    [key: string]: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
  };
}

// Standardized Health Check format for all microservices
export interface StandardHealthCheck {
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  dependencies?: {
    [key: string]: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
  };
  features?: {
    [key: string]: boolean | string;
  };
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface ServiceError extends Error {
  code: string;
  statusCode: number;
  details?: any;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
