"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhancedMedicalRecordController = exports.EnhancedMedicalRecordController = void 0;
const shared_1 = require("@hospital/shared");
const express_validator_1 = require("express-validator");
const medical_record_repository_1 = require("../repositories/medical-record.repository");
const cache_service_1 = require("../services/cache.service");
const integration_service_1 = require("../services/integration.service");
const metrics_service_1 = require("../services/metrics.service");
class EnhancedMedicalRecordController {
    constructor() {
        this.medicalRecordRepository = new medical_record_repository_1.MedicalRecordRepository();
    }
    // Enhanced get all with caching and performance monitoring
    async getAllMedicalRecords(req, res) {
        const startTime = Date.now();
        const operation = "get_all_medical_records";
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
            const offset = (page - 1) * limit;
            // Try cache first
            const cacheKey = `all_records:${page}:${limit}`;
            let records = await cache_service_1.cacheService.getSearchResults(cacheKey, {});
            let cacheHit = false;
            if (records) {
                cacheHit = true;
                metrics_service_1.metricsService.recordCacheOperation("hit", "all_records");
            }
            else {
                // Fetch from database
                records = await this.medicalRecordRepository.findAll(limit, offset);
                // Cache the results
                await cache_service_1.cacheService.setSearchResults(cacheKey, {}, records);
                metrics_service_1.metricsService.recordCacheOperation("miss", "all_records");
            }
            const total = await this.medicalRecordRepository.count();
            // Apply data masking if needed
            if (req.shouldMaskData) {
                records = this.maskSensitiveData(records);
            }
            // Record performance metrics
            const duration = Date.now() - startTime;
            metrics_service_1.metricsService.recordPerformance({
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            metrics_service_1.metricsService.recordPerformance({
                operation,
                duration_ms: duration,
                success: false,
                user_id: req.user?.id,
            });
            metrics_service_1.metricsService.recordError("database_error", "fetch_all_records", operation);
            shared_1.logger.error("Error fetching medical records", { error });
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    // Enhanced get by patient with integration
    async getMedicalRecordsByPatient(req, res) {
        const startTime = Date.now();
        const operation = "get_records_by_patient";
        try {
            const { patient_id } = req.params;
            // Validate patient exists via integration
            const isValidPatient = await integration_service_1.integrationService.validatePatient(patient_id);
            if (!isValidPatient) {
                metrics_service_1.metricsService.recordError("validation_error", "invalid_patient", operation);
                res.status(404).json({
                    success: false,
                    message: "Patient not found",
                });
                return;
            }
            // Try cache first
            let records = await cache_service_1.cacheService.getPatientRecords(patient_id);
            let cacheHit = false;
            if (records) {
                cacheHit = true;
                metrics_service_1.metricsService.recordCacheOperation("hit", "patient_records");
            }
            else {
                // Fetch from database
                records =
                    await this.medicalRecordRepository.findByPatientId(patient_id);
                // Get additional patient info
                const patientInfo = await integration_service_1.integrationService.getPatientInfo(patient_id);
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
                await cache_service_1.cacheService.setPatientRecords(patient_id, records);
                metrics_service_1.metricsService.recordCacheOperation("miss", "patient_records");
            }
            // Apply data masking if needed
            if (req.shouldMaskData) {
                records = this.maskSensitiveData(records);
            }
            // Update patient last visit
            await integration_service_1.integrationService.updatePatientLastVisit(patient_id);
            // Record performance metrics
            const duration = Date.now() - startTime;
            metrics_service_1.metricsService.recordPerformance({
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            metrics_service_1.metricsService.recordPerformance({
                operation,
                duration_ms: duration,
                success: false,
                user_id: req.user?.id,
            });
            metrics_service_1.metricsService.recordError("database_error", "fetch_patient_records", operation);
            shared_1.logger.error("Error fetching patient records", { error });
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    // Enhanced create with full integration
    async createMedicalRecord(req, res) {
        const startTime = Date.now();
        const operation = "create_medical_record";
        try {
            // Validation
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                metrics_service_1.metricsService.recordError("validation_error", "invalid_input", operation);
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                });
                return;
            }
            const recordData = req.body;
            // Validate patient and doctor exist
            const [isValidPatient, isValidDoctor] = await Promise.all([
                integration_service_1.integrationService.validatePatient(recordData.patient_id),
                integration_service_1.integrationService.validateDoctor(recordData.doctor_id),
            ]);
            if (!isValidPatient) {
                metrics_service_1.metricsService.recordError("validation_error", "invalid_patient", operation);
                res.status(404).json({
                    success: false,
                    message: "Patient not found",
                });
                return;
            }
            if (!isValidDoctor) {
                metrics_service_1.metricsService.recordError("validation_error", "invalid_doctor", operation);
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
            const record = await this.medicalRecordRepository.create(recordData, req.user?.id || "SYSTEM");
            // Invalidate relevant caches
            await Promise.all([
                cache_service_1.cacheService.invalidatePatientCache(recordData.patient_id),
                cache_service_1.cacheService.invalidateDoctorCache(recordData.doctor_id),
                cache_service_1.cacheService.invalidateSearchCache(),
            ]);
            // Post-creation integrations
            const integrationPromises = [];
            // Find and update related appointment
            const appointment = await integration_service_1.integrationService.getRelatedAppointment(recordData.patient_id, recordData.doctor_id, new Date().toISOString().split("T")[0]);
            if (appointment) {
                integrationPromises.push(integration_service_1.integrationService.updateAppointmentStatus(appointment.id, "completed"));
            }
            // Create billing record if services provided
            if (recordData.treatment || recordData.medication) {
                integrationPromises.push(integration_service_1.integrationService.createBillingRecord({
                    patient_id: recordData.patient_id,
                    doctor_id: recordData.doctor_id,
                    record_id: record.record_id,
                    services: this.extractServices(recordData),
                }));
            }
            // Send notifications for critical results
            if (this.isCriticalResult(recordData)) {
                integrationPromises.push(integration_service_1.integrationService.sendNotification({
                    type: "critical_result",
                    recipients: [recordData.doctor_id],
                    patient_id: recordData.patient_id,
                    doctor_id: recordData.doctor_id,
                    record_id: record.record_id,
                    urgency: "critical",
                    message: "Critical medical result requires immediate attention",
                }));
                metrics_service_1.metricsService.recordSecurityEvent("critical_result_created", "high", req.user?.id);
            }
            else {
                integrationPromises.push(integration_service_1.integrationService.sendNotification({
                    type: "medical_record_created",
                    recipients: [recordData.patient_id, recordData.doctor_id],
                    patient_id: recordData.patient_id,
                    doctor_id: recordData.doctor_id,
                    record_id: record.record_id,
                    urgency: "low",
                }));
            }
            // Execute all integrations
            await Promise.allSettled(integrationPromises);
            // Record business metrics
            metrics_service_1.metricsService.recordBusinessMetric("records_created", 1, {
                doctor_id: recordData.doctor_id,
                patient_id: recordData.patient_id,
                has_diagnosis: (!!recordData.diagnosis).toString(),
                has_treatment: (!!recordData.treatment).toString(),
                critical: this.isCriticalResult(recordData).toString(),
            });
            // Record performance metrics
            const duration = Date.now() - startTime;
            metrics_service_1.metricsService.recordPerformance({
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            metrics_service_1.metricsService.recordPerformance({
                operation,
                duration_ms: duration,
                success: false,
                user_id: req.user?.id,
            });
            metrics_service_1.metricsService.recordError("database_error", "create_record", operation);
            shared_1.logger.error("Error creating medical record", { error });
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    // Enhanced update with change tracking
    async updateMedicalRecord(req, res) {
        const startTime = Date.now();
        const operation = "update_medical_record";
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                metrics_service_1.metricsService.recordError("validation_error", "invalid_input", operation);
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
                metrics_service_1.metricsService.recordError("not_found", "record_not_found", operation);
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
            const record = await this.medicalRecordRepository.update(id, updateData, req.user?.id || "SYSTEM");
            // Invalidate caches
            await Promise.all([
                cache_service_1.cacheService.invalidatePatientCache(record.patient_id),
                cache_service_1.cacheService.invalidateDoctorCache(record.doctor_id),
                cache_service_1.cacheService.invalidateSearchCache(),
            ]);
            // Send notification if significant changes
            if (changes.significant) {
                await integration_service_1.integrationService.sendNotification({
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
            metrics_service_1.metricsService.recordBusinessMetric("records_updated", 1, {
                changes_count: changes.count.toString(),
                significant_change: changes.significant.toString(),
                critical_change: changes.critical.toString(),
            });
            // Record performance metrics
            const duration = Date.now() - startTime;
            metrics_service_1.metricsService.recordPerformance({
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            metrics_service_1.metricsService.recordPerformance({
                operation,
                duration_ms: duration,
                success: false,
                user_id: req.user?.id,
            });
            metrics_service_1.metricsService.recordError("database_error", "update_record", operation);
            shared_1.logger.error("Error updating medical record", { error });
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    // Health and metrics endpoint
    async getHealthMetrics(req, res) {
        try {
            const [cacheHealth, integrationHealth, performanceMetrics, metricsHealth,] = await Promise.all([
                cache_service_1.cacheService.healthCheck(),
                integration_service_1.integrationService.healthCheck(),
                metrics_service_1.metricsService.getPerformanceMetrics("1h"),
                metrics_service_1.metricsService.healthCheck(),
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
                stats: await metrics_service_1.metricsService.getMetricsSummary("1h"),
            });
        }
        catch (error) {
            shared_1.logger.error("Error getting health metrics", { error });
            res.status(500).json({
                success: false,
                message: "Health check failed",
                error: error.message,
            });
        }
    }
    // Utility methods
    maskSensitiveData(records) {
        return records.map((record) => ({
            ...record,
            symptoms: this.maskText(record.symptoms),
            diagnosis: this.maskText(record.diagnosis),
            treatment: this.maskText(record.treatment),
            examination_notes: this.maskText(record.examination_notes),
            medication: this.maskText(record.medication),
        }));
    }
    maskText(text) {
        if (!text)
            return text;
        return text.length > 10 ? text.substring(0, 10) + "***" : "***";
    }
    extractServices(recordData) {
        const services = [];
        if (recordData.examination_notes)
            services.push("examination");
        if (recordData.diagnosis)
            services.push("diagnosis");
        if (recordData.treatment)
            services.push("treatment");
        if (recordData.medication)
            services.push("medication");
        if (recordData.vital_signs)
            services.push("vital_signs");
        return services;
    }
    isCriticalResult(recordData) {
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
    trackChanges(existingRecord, updateData) {
        const changes = {
            count: 0,
            significant: false,
            critical: false,
            summary: "",
        };
        const significantFields = ["diagnosis", "treatment", "medication"];
        const criticalFields = ["diagnosis"];
        const changedFields = [];
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
exports.EnhancedMedicalRecordController = EnhancedMedicalRecordController;
exports.enhancedMedicalRecordController = new EnhancedMedicalRecordController();
//# sourceMappingURL=enhanced-medical-record.controller.js.map