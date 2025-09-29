import axios, { AxiosInstance } from "axios";

interface ServiceEndpoints {
  PATIENT_SERVICE: string;
  DOCTOR_SERVICE: string;
  APPOINTMENT_SERVICE: string;
  BILLING_SERVICE: string;
  NOTIFICATION_SERVICE: string;
}

export class IntegrationService {
  private endpoints: ServiceEndpoints;
  private httpClient: AxiosInstance;

  constructor() {
    this.endpoints = {
      PATIENT_SERVICE:
        process.env.PATIENT_SERVICE_URL || "http://patient-service:3003",
      DOCTOR_SERVICE:
        process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3002",
      APPOINTMENT_SERVICE:
        process.env.APPOINTMENT_SERVICE_URL ||
        "http://appointment-service:3004",
      BILLING_SERVICE:
        process.env.BILLING_SERVICE_URL || "http://billing-service:3006",
      NOTIFICATION_SERVICE:
        process.env.NOTIFICATION_SERVICE_URL ||
        "http://notification-service:3011",
    };

    this.httpClient = axios.create({
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "X-Service": "medical-records-service",
      },
    });

    // Add request interceptor for authentication
    this.httpClient.interceptors.request.use((config) => {
      const token = process.env.SERVICE_TO_SERVICE_TOKEN;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Patient Service Integration
  async validatePatient(patientId: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(
        `${this.endpoints.PATIENT_SERVICE}/api/patients/${patientId}/validate`
      );
      return response.data.exists;
    } catch (error) {
      console.error("Patient validation failed:", error);
      return false;
    }
  }

  async getPatientInfo(patientId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `${this.endpoints.PATIENT_SERVICE}/api/patients/${patientId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get patient info failed:", error);
      return null;
    }
  }

  async updatePatientLastVisit(patientId: string): Promise<void> {
    try {
      await this.httpClient.put(
        `${this.endpoints.PATIENT_SERVICE}/api/patients/${patientId}/last-visit`,
        { last_visit: new Date().toISOString() }
      );
    } catch (error) {
      console.error("Update patient last visit failed:", error);
    }
  }

  // Doctor Service Integration
  async validateDoctor(doctorId: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(
        `${this.endpoints.DOCTOR_SERVICE}/api/doctors/${doctorId}/validate`
      );
      return response.data.exists;
    } catch (error) {
      console.error("Doctor validation failed:", error);
      return false;
    }
  }

  async getDoctorInfo(doctorId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `${this.endpoints.DOCTOR_SERVICE}/api/doctors/${doctorId}`
      );
      return response.data;
    } catch (error) {
      console.error("Get doctor info failed:", error);
      return null;
    }
  }

  async updateDoctorStats(
    doctorId: string,
    recordCount: number
  ): Promise<void> {
    try {
      await this.httpClient.put(
        `${this.endpoints.DOCTOR_SERVICE}/api/doctors/${doctorId}/stats`,
        { total_records: recordCount }
      );
    } catch (error) {
      console.error("Update doctor stats failed:", error);
    }
  }

  // Appointment Service Integration
  async getRelatedAppointment(
    patientId: string,
    doctorId: string,
    date: string
  ): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `${this.endpoints.APPOINTMENT_SERVICE}/api/appointments/find`,
        {
          params: {
            patient_id: patientId,
            doctor_id: doctorId,
            date: date,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Get related appointment failed:", error);
      return null;
    }
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: string
  ): Promise<void> {
    try {
      await this.httpClient.put(
        `${this.endpoints.APPOINTMENT_SERVICE}/api/appointments/${appointmentId}/status`,
        { status, completed_at: new Date().toISOString() }
      );
    } catch (error) {
      console.error("Update appointment status failed:", error);
    }
  }

  // Billing Service Integration
  async createBillingRecord(recordData: {
    patient_id: string;
    doctor_id: string;
    record_id: string;
    services: string[];
    amount?: number;
  }): Promise<any> {
    try {
      const response = await this.httpClient.post(
        `${this.endpoints.BILLING_SERVICE}/api/billing/create`,
        {
          ...recordData,
          created_from: "medical_record",
          created_at: new Date().toISOString(),
        }
      );
      return response.data;
    } catch (error) {
      console.error("Create billing record failed:", error);
      return null;
    }
  }

  // Notification Service Integration
  async sendNotification(notification: {
    type:
      | "medical_record_created"
      | "medical_record_updated"
      | "critical_result";
    recipients: string[];
    patient_id: string;
    doctor_id: string;
    record_id: string;
    urgency?: "low" | "medium" | "high" | "critical";
    message?: string;
  }): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.endpoints.NOTIFICATION_SERVICE}/api/notifications/send`,
        {
          ...notification,
          source: "medical-records-service",
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Send notification failed:", error);
    }
  }

  // Health check for all integrated services
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const services = Object.entries(this.endpoints);
    const healthStatus: { [key: string]: boolean } = {};

    const promises = services.map(async ([name, url]) => {
      try {
        const response = await this.httpClient.get(`${url}/health`, {
          timeout: 2000,
        });
        healthStatus[name] = response.status === 200;
      } catch (error) {
        healthStatus[name] = false;
      }
    });

    await Promise.allSettled(promises);
    return healthStatus;
  }

  // Bulk operations for performance
  async validateMultiplePatients(
    patientIds: string[]
  ): Promise<{ [key: string]: boolean }> {
    try {
      const response = await this.httpClient.post(
        `${this.endpoints.PATIENT_SERVICE}/api/patients/validate-bulk`,
        { patient_ids: patientIds }
      );
      return response.data.validations;
    } catch (error) {
      console.error("Bulk patient validation failed:", error);
      return {};
    }
  }

  async validateMultipleDoctors(
    doctorIds: string[]
  ): Promise<{ [key: string]: boolean }> {
    try {
      const response = await this.httpClient.post(
        `${this.endpoints.DOCTOR_SERVICE}/api/doctors/validate-bulk`,
        { doctor_ids: doctorIds }
      );
      return response.data.validations;
    } catch (error) {
      console.error("Bulk doctor validation failed:", error);
      return {};
    }
  }

  // Circuit breaker pattern for service resilience
  private circuitBreakers: Map<
    string,
    { failures: number; lastFailure: Date; isOpen: boolean }
  > = new Map();

  private async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(serviceName) || {
      failures: 0,
      lastFailure: new Date(0),
      isOpen: false,
    };

    // Check if circuit is open
    if (breaker.isOpen) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime();
      if (timeSinceLastFailure < 60000) {
        // 1 minute timeout
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit breaker open for ${serviceName}`);
      } else {
        breaker.isOpen = false;
        breaker.failures = 0;
      }
    }

    try {
      const result = await operation();
      breaker.failures = 0;
      this.circuitBreakers.set(serviceName, breaker);
      return result;
    } catch (error) {
      breaker.failures++;
      breaker.lastFailure = new Date();

      if (breaker.failures >= 3) {
        breaker.isOpen = true;
      }

      this.circuitBreakers.set(serviceName, breaker);

      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }
}

export const integrationService = new IntegrationService();
