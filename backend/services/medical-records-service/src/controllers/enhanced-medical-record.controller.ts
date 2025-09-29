import { logger } from "@hospital/shared";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { MedicalRecordRepository } from "../repositories/medical-record.repository";
import { cacheService } from "../services/cache.service";
import { integrationService } from "../services/integration.service";
import { metricsService } from "../services/metrics.service";

// Extend Request interface to include user and masking
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  shouldMaskData?: boolean;
}

export class EnhancedMedicalRecordController {
  private medicalRecordRepository: MedicalRecordRepository;

  constructor() {
    this.medicalRecordRepository = new MedicalRecordRepository();
  }

  // Enhanced get all with caching and performance monitoring
  async getAllMedicalRecords(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();
    const operation = "get_all_medical_records";

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
      const offset = (page - 1) * limit;

      // Try cache first
      const cacheKey = `all_records:${page}:${limit}`;
      let records = await cacheService.getSearchResults(cacheKey, {});
      let cacheHit = false;

      if (records) {
        cacheHit = true;
        metricsService.recordCacheOperation("hit", "all_records");
      } else {
        // Fetch from database
        records = await this.medicalRecordRepository.findAll(limit, offset);

        // Cache the results
        await cacheService.setSearchResults(cacheKey, {}, records);
        metricsService.recordCacheOperation("miss", "all_records");
      }

      const total = await this.medicalRecordRepository.count();

      // Apply data masking if needed
      if (req.shouldMaskData) {
        records = this.maskSensitiveData(records);
      }

      // Record performance metrics
      const duration = Date.now() - startTime;
      metricsService.recordPerformance({
        operation,
        duration_ms: duration,
        success: true,
        user_id: req.user?.id,
        resource_count: records.length,
        cache_hit: cacheHit,
      });

      res.json({
        success: true,
        data: records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        metadata: {
          cache_hit: cacheHit,
          response_time_ms: duration,
        },
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      metricsService.recordPerformance({
        operation,
        duration_ms: duration,
        success: false,
        user_id: req.user?.id,
      });

      metricsService.recordError(
        "database_error",
        "fetch_all_records",
        operation
      );

      logger.error("Error fetching medical records", { error });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // Enhanced get by patient with integration
  async getMedicalRecordsByPatient(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();
    const operation = "get_records_by_patient";

    try {
      const { patient_id } = req.params;

      // Validate patient exists via integration
      const isValidPatient =
        await integrationService.validatePatient(patient_id);
      if (!isValidPatient) {
        metricsService.recordError(
          "validation_error",
          "invalid_patient",
          operation
        );
        res.status(404).json({
          success: false,
          message: "Patient not found",
        });
        return;
      }

      // Try cache first
      let records = await cacheService.getPatientRecords(patient_id);
      let cacheHit = false;

      if (records) {
        cacheHit = true;
        metricsService.recordCacheOperation("hit", "patient_records");
      } else {
        // Fetch from database
        records =
          await this.medicalRecordRepository.findByPatientId(patient_id);

        // Get additional patient info
        const patientInfo = await integrationService.getPatientInfo(patient_id);

        // Enrich records with patient info
        records = records.map((record) => ({
          ...record,
          patient_info: patientInfo
            ? {
                name: patientInfo.name,
                age: patientInfo.age,
                gender: patientInfo.gender,
              }
            : null,
        }));

        // Cache the results
        await cacheService.setPatientRecords(patient_id, records);
        metricsService.recordCacheOperation("miss", "patient_records");
      }

      // Apply data masking if needed
      if (req.shouldMaskData) {
        records = this.maskSensitiveData(records);
      }

      // Update patient last visit
      await integrationService.updatePatientLastVisit(patient_id);

      // Record performance metrics
      const duration = Date.now() - startTime;
      metricsService.recordPerformance({
        operation,
        duration_ms: duration,
        success: true,
        user_id: req.user?.id,
        resource_count: records.length,
        cache_hit: cacheHit,
      });

      res.json({
        success: true,
        data: records,
        metadata: {
          patient_id,
          record_count: records.length,
          cache_hit: cacheHit,
          response_time_ms: duration,
        },
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      metricsService.recordPerformance({
        operation,
        duration_ms: duration,
        success: false,
        user_id: req.user?.id,
      });

      metricsService.recordError(
        "database_error",
        "fetch_patient_records",
        operation
      );

      logger.error("Error fetching patient records", { error });
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Enhanced create with full integration
  async createMedicalRecord(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();
    const operation = "create_medical_record";

    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        metricsService.recordError(
          "validation_error",
          "invalid_input",
          operation
        );
        res.status(400).json({
          success: false,
          message: "Validation error",
        });
        return;
      }

      const recordData = req.body;

      // Validate patient and doctor exist
      const [isValidPatient, isValidDoctor] = await Promise.all([
        integrationService.validatePatient(recordData.patient_id),
        integrationService.validateDoctor(recordData.doctor_id),
      ]);

      if (!isValidPatient) {
        metricsService.recordError(
          "validation_error",
          "invalid_patient",
          operation
        );
        res.status(404).json({
          success: false,
          message: "Patient not found",
        });
        return;
      }

      if (!isValidDoctor) {
        metricsService.recordError(
          "validation_error",
          "invalid_doctor",
          operation
        );
        res.status(404).json({
          success: false,
          message: "Patient not found",
        });
        return;
      }

      // Add audit fields
      recordData.created_by = req.user?.id;
      recordData.updated_by = req.user?.id;

      // Create record
      const record = await this.medicalRecordRepository.create(
        recordData,
        req.user?.id || "SYSTEM"
      );

      // Invalidate relevant caches
      await Promise.all([
        cacheService.invalidatePatientCache(recordData.patient_id),
        cacheService.invalidateDoctorCache(recordData.doctor_id),
        cacheService.invalidateSearchCache(),
      ]);

      // Post-creation integrations
      const integrationPromises = [];

      // Find and update related appointment
      const appointment = await integrationService.getRelatedAppointment(
        recordData.patient_id,
        recordData.doctor_id,
        new Date().toISOString().split("T")[0]
      );

      if (appointment) {
        integrationPromises.push(
          integrationService.updateAppointmentStatus(
            appointment.id,
            "completed"
          )
        );
      }

      // Create billing record if services provided
      if (recordData.treatment || recordData.medication) {
        integrationPromises.push(
          integrationService.createBillingRecord({
            patient_id: recordData.patient_id,
            doctor_id: recordData.doctor_id,
            record_id: record.record_id,
            services: this.extractServices(recordData),
          })
        );
      }

      // Send notifications for critical results
      if (this.isCriticalResult(recordData)) {
        integrationPromises.push(
          integrationService.sendNotification({
            type: "critical_result",
            recipients: [recordData.doctor_id],
            patient_id: recordData.patient_id,
            doctor_id: recordData.doctor_id,
            record_id: record.record_id,
            urgency: "critical",
            message: "Critical medical result requires immediate attention",
          })
        );

        metricsService.recordSecurityEvent(
          "critical_result_created",
          "high",
          req.user?.id
        );
      } else {
        integrationPromises.push(
          integrationService.sendNotification({
            type: "medical_record_created",
            recipients: [recordData.patient_id, recordData.doctor_id],
            patient_id: recordData.patient_id,
            doctor_id: recordData.doctor_id,
            record_id: record.record_id,
            urgency: "low",
          })
        );
      }

      // Execute all integrations
      await Promise.allSettled(integrationPromises);

      // Record business metrics
      metricsService.recordBusinessMetric("records_created", 1, {
        doctor_id: recordData.doctor_id,
        patient_id: recordData.patient_id,
        has_diagnosis: (!!recordData.diagnosis).toString(),
        has_treatment: (!!recordData.treatment).toString(),
        critical: this.isCriticalResult(recordData).toString(),
      });

      // Record performance metrics
      const duration = Date.now() - startTime;
      metricsService.recordPerformance({
        operation,
        duration_ms: duration,
        success: true,
        user_id: req.user?.id,
        resource_count: 1,
      });

      res.status(201).json({
        success: true,
        data: record,
        metadata: {
          created_at: new Date().toISOString(),
          response_time_ms: duration,
          integrations_executed: integrationPromises.length,
        },
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      metricsService.recordPerformance({
        operation,
        duration_ms: duration,
        success: false,
        user_id: req.user?.id,
      });

      metricsService.recordError("database_error", "create_record", operation);

      logger.error("Error creating medical record", { error });
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Enhanced update with change tracking
  async updateMedicalRecord(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();
    const operation = "update_medical_record";

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        metricsService.recordError(
          "validation_error",
          "invalid_input",
          operation
        );
        res.status(400).json({
          success: false,
          message: "Validation error",
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      // Get existing record for change tracking
      const existingRecord = await this.medicalRecordRepository.findById(id);
      if (!existingRecord) {
        metricsService.recordError("not_found", "record_not_found", operation);
        res.status(404).json({
          success: false,
          message: "Patient not found",
        });
        return;
      }

      // Add audit fields
      updateData.updated_by = req.user?.id;
      updateData.updated_at = new Date();

      // Track changes
      const changes = this.trackChanges(existingRecord, updateData);

      // Update record
      const record = await this.medicalRecordRepository.update(
        id,
        updateData,
        req.user?.id || "SYSTEM"
      );

      // Invalidate caches
      await Promise.all([
        cacheService.invalidatePatientCache(record.patient_id),
        cacheService.invalidateDoctorCache(record.doctor_id),
        cacheService.invalidateSearchCache(),
      ]);

      // Send notification if significant changes
      if (changes.significant) {
        await integrationService.sendNotification({
          type: "medical_record_updated",
          recipients: [record.patient_id, record.doctor_id],
          patient_id: record.patient_id,
          doctor_id: record.doctor_id,
          record_id: record.record_id,
          urgency: changes.critical ? "high" : "medium",
          message: `Medical record updated: ${changes.summary}`,
        });
      }

      // Record business metrics
      metricsService.recordBusinessMetric("records_updated", 1, {
        changes_count: changes.count.toString(),
        significant_change: changes.significant.toString(),
        critical_change: changes.critical.toString(),
      });

      // Record performance metrics
      const duration = Date.now() - startTime;
      metricsService.recordPerformance({
        operation,
        duration_ms: duration,
        success: true,
        user_id: req.user?.id,
        resource_count: 1,
      });

      res.json({
        success: true,
        data: record,
        metadata: {
          changes_tracked: changes.count,
          updated_at: new Date().toISOString(),
          response_time_ms: duration,
        },
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      metricsService.recordPerformance({
        operation,
        duration_ms: duration,
        success: false,
        user_id: req.user?.id,
      });

      metricsService.recordError("database_error", "update_record", operation);

      logger.error("Error updating medical record", { error });
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Health and metrics endpoint
  async getHealthMetrics(req: Request, res: Response): Promise<void> {
    try {
      const [
        cacheHealth,
        integrationHealth,
        performanceMetrics,
        metricsHealth,
      ] = await Promise.all([
        cacheService.healthCheck(),
        integrationService.healthCheck(),
        metricsService.getPerformanceMetrics("1h"),
        metricsService.healthCheck(),
      ]);

      res.json({
        success: true,
        health: {
          service: "healthy",
          cache: cacheHealth ? "healthy" : "degraded",
          integrations: integrationHealth,
          metrics: metricsHealth.status,
          timestamp: new Date().toISOString(),
        },
        performance: performanceMetrics,
        stats: await metricsService.getMetricsSummary("1h"),
      });
    } catch (error: any) {
      logger.error("Error getting health metrics", { error });
      res.status(500).json({
        success: false,
        message: "Health check failed",
        error: error.message,
      });
    }
  }

  // Utility methods
  private maskSensitiveData(records: any[]): any[] {
    return records.map((record) => ({
      ...record,
      symptoms: this.maskText(record.symptoms),
      diagnosis: this.maskText(record.diagnosis),
      treatment: this.maskText(record.treatment),
      examination_notes: this.maskText(record.examination_notes),
      medication: this.maskText(record.medication),
    }));
  }

  private maskText(text: string | null): string | null {
    if (!text) return text;
    return text.length > 10 ? text.substring(0, 10) + "***" : "***";
  }

  private extractServices(recordData: any): string[] {
    const services = [];
    if (recordData.examination_notes) services.push("examination");
    if (recordData.diagnosis) services.push("diagnosis");
    if (recordData.treatment) services.push("treatment");
    if (recordData.medication) services.push("medication");
    if (recordData.vital_signs) services.push("vital_signs");
    return services;
  }

  private isCriticalResult(recordData: any): boolean {
    const criticalKeywords = [
      "emergency",
      "critical",
      "urgent",
      "immediate",
      "severe",
      "acute",
      "crisis",
      "life-threatening",
    ];

    const text = [
      recordData.symptoms,
      recordData.diagnosis,
      recordData.examination_notes,
    ]
      .join(" ")
      .toLowerCase();

    return criticalKeywords.some((keyword) => text.includes(keyword));
  }

  private trackChanges(existingRecord: any, updateData: any): any {
    const changes = {
      count: 0,
      significant: false,
      critical: false,
      summary: "",
    };

    const significantFields = ["diagnosis", "treatment", "medication"];
    const criticalFields = ["diagnosis"];
    const changedFields: string[] = [];

    Object.keys(updateData).forEach((key) => {
      if (existingRecord[key] !== updateData[key]) {
        changes.count++;
        changedFields.push(key);

        if (significantFields.includes(key)) {
          changes.significant = true;
        }

        if (criticalFields.includes(key)) {
          changes.critical = true;
        }
      }
    });

    changes.summary = changedFields.join(", ");
    return changes;
  }
}

export const enhancedMedicalRecordController =
  new EnhancedMedicalRecordController();
