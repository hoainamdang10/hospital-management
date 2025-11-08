"use strict";
/**
 * BulkExportFHIRUseCase - Application Layer
 * HIPAA Compliance: Bulk FHIR R4 export for data portability
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, FHIR R4, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkExportFHIRUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
class BulkExportFHIRUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(medicalRecordRepository, fhirExportService) {
        super();
        this.medicalRecordRepository = medicalRecordRepository;
        this.fhirExportService = fhirExportService;
    }
    async execute(request) {
        const validation = await this.validate(request);
        if (!validation.isValid) {
            return {
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            };
        }
        // Authorization check
        if (!this.isAuthorized(request.requestedByRole)) {
            return {
                success: false,
                message: 'Không có quyền export FHIR data',
                errors: [{ field: 'authorization', message: 'Unauthorized', code: 'FORBIDDEN' }]
            };
        }
        return await this.executeInternal(request);
    }
    async executeInternal(request) {
        try {
            const format = request.format || 'json';
            const resourceTypes = request.resourceTypes || [
                'Patient', 'Observation', 'Condition', 'MedicationRequest',
                'DiagnosticReport', 'Procedure', 'Encounter'
            ];
            // If async export requested, create job and return job ID
            if (request.async) {
                const jobId = await this.fhirExportService.createExportJob({
                    patientIds: request.patientIds,
                    resourceTypes,
                    startDate: request.startDate,
                    endDate: request.endDate,
                    format,
                    requestedBy: request.requestedBy
                });
                return {
                    success: true,
                    message: 'FHIR export job đã được tạo',
                    data: {
                        jobId,
                        exportedAt: new Date().toISOString(),
                        fhirVersion: '4.0.1',
                        format,
                        statistics: {
                            totalRecords: 0,
                            totalPatients: 0,
                            resourceCounts: {}
                        }
                    }
                };
            }
            // Synchronous export
            const filters = {};
            if (request.patientIds && request.patientIds.length > 0) {
                filters.patientIds = request.patientIds;
            }
            if (request.startDate)
                filters.startDate = new Date(request.startDate);
            if (request.endDate)
                filters.endDate = new Date(request.endDate);
            // Get medical records
            const records = await this.medicalRecordRepository.findByFilters(filters);
            // Convert to FHIR Bundle
            const fhirBundle = await this.fhirExportService.exportToFHIRBundle(records, resourceTypes, format);
            // Calculate statistics
            const resourceCounts = {};
            fhirBundle.entry.forEach(entry => {
                const resourceType = entry.resource.resourceType;
                resourceCounts[resourceType] = (resourceCounts[resourceType] || 0) + 1;
            });
            const uniquePatients = new Set(records.map(r => r.patientId.value)).size;
            return {
                success: true,
                message: `Đã export ${fhirBundle.total} FHIR resources`,
                data: {
                    fhirBundle,
                    exportedAt: new Date().toISOString(),
                    fhirVersion: '4.0.1',
                    format,
                    statistics: {
                        totalRecords: records.length,
                        totalPatients: uniquePatients,
                        resourceCounts
                    }
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi bulk export FHIR: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.requestedBy) {
            errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });
        }
        if (!request.requestedByRole) {
            errors.push({ field: 'requestedByRole', message: 'RequestedByRole là bắt buộc', code: 'REQUIRED' });
        }
        // Validate date range
        if (request.startDate && request.endDate) {
            const start = new Date(request.startDate);
            const end = new Date(request.endDate);
            if (start > end) {
                errors.push({ field: 'dateRange', message: 'Start date phải trước end date', code: 'INVALID_RANGE' });
            }
        }
        return { isValid: errors.length === 0, errors };
    }
    isAuthorized(role) {
        const authorizedRoles = ['super_admin', 'admin', 'doctor'];
        return authorizedRoles.includes(role.toLowerCase());
    }
    async authorize(request, userId) {
        return this.isAuthorized(request.requestedByRole);
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientIds && request.patientIds.length === 1 ? request.patientIds[0] : null;
    }
    getDescription() {
        return 'Bulk export medical records sang FHIR R4 format (HIPAA data portability)';
    }
    getRequiredPermissions() {
        return ['medical_record:read', 'fhir:export', 'bulk:export'];
    }
}
exports.BulkExportFHIRUseCase = BulkExportFHIRUseCase;
//# sourceMappingURL=BulkExportFHIRUseCase.js.map