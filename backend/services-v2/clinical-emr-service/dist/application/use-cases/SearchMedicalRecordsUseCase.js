"use strict";
/**
 * SearchMedicalRecordsUseCase - Application Layer
 * Use case for searching and filtering medical records with advanced criteria
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchMedicalRecordsUseCase = void 0;
const use_case_interface_1 = require("../../../shared/application/use-cases/base/use-case.interface");
const clinical_aggregate_1 = require("../../domain/aggregates/clinical.aggregate");
const Diagnosis_1 = require("../../domain/value-objects/Diagnosis");
const Medication_1 = require("../../domain/value-objects/Medication");
/**
 * Search Medical Records Use Case
 */
class SearchMedicalRecordsUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(medicalRecordRepository) {
        super();
        this.medicalRecordRepository = medicalRecordRepository;
    }
    /**
     * Execute the use case
     */
    async executeInternal(request) {
        const startTime = Date.now();
        try {
            // Set default pagination if not provided
            const pagination = request.pagination || { page: 1, limit: 20 };
            pagination.offset = (pagination.page - 1) * pagination.limit;
            // Set default sort if not provided
            const sort = request.sort || { field: 'visitDate', direction: 'desc' };
            // Execute search
            const searchResults = await this.executeSearch(request.criteria, sort, pagination, request);
            // Calculate execution time
            const executionTime = Date.now() - startTime;
            // Generate search ID for audit
            const searchId = this.generateSearchId(request.searchedBy);
            // Audit search if requested
            if (request.auditSearch !== false) {
                await this.auditSearch(request, searchResults.totalCount, executionTime, searchId);
            }
            return {
                success: true,
                message: `Tìm thấy ${searchResults.totalCount} hồ sơ bệnh án phù hợp`,
                data: {
                    results: searchResults,
                    searchCriteria: request.criteria,
                    executionTime,
                    searchId
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi tìm kiếm hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Execute search with criteria
     */
    async executeSearch(criteria, sort, pagination, request) {
        // Get all medical records that match criteria
        const allRecords = await this.medicalRecordRepository.search(criteria, sort);
        // Apply access control if requested
        const accessibleRecords = request.respectAccessControl !== false
            ? await this.filterByAccessControl(allRecords, request.searchedBy)
            : allRecords;
        // Calculate pagination
        const totalCount = accessibleRecords.length;
        const totalPages = Math.ceil(totalCount / pagination.limit);
        const hasNextPage = pagination.page < totalPages;
        const hasPreviousPage = pagination.page > 1;
        // Get paginated results
        const paginatedRecords = accessibleRecords.slice(pagination.offset, pagination.offset + pagination.limit);
        // Convert to summary format
        const recordSummaries = await Promise.all(paginatedRecords.map(record => this.convertToSummary(record, request)));
        return {
            records: recordSummaries,
            totalCount,
            page: pagination.page,
            limit: pagination.limit,
            totalPages,
            hasNextPage,
            hasPreviousPage
        };
    }
    /**
     * Filter records by access control
     */
    async filterByAccessControl(records, userId) {
        return records.filter(record => {
            // Users can access records they created or are assigned to
            return record.doctorId === userId || record.createdBy === userId;
        });
    }
    /**
     * Convert medical record to summary format
     */
    async convertToSummary(record, request) {
        // Log read access for HIPAA compliance
        record.recordReadAccess(request.searchedBy, 'Tìm kiếm hồ sơ bệnh án');
        const primaryDiagnosis = record.diagnoses.find(d => d.isPrimary());
        const activeMedications = record.medications.filter(m => m.isActive());
        const summary = {
            recordId: record.recordId.value,
            patientId: record.patientId,
            doctorId: record.doctorId,
            appointmentId: record.appointmentId,
            visitDate: record.visitDate.toISOString(),
            status: record.status,
            summary: record.getSummary(),
            symptoms: record.symptoms,
            diagnosesCount: record.diagnoses.length,
            primaryDiagnosis: primaryDiagnosis ? {
                code: primaryDiagnosis.code,
                display: primaryDiagnosis.display,
                severity: primaryDiagnosis.severity
            } : undefined,
            hasCriticalDiagnoses: record.getCriticalDiagnoses().length > 0,
            medicationsCount: record.medications.length,
            activeMedicationsCount: activeMedications.length,
            hasHighPriorityMedications: record.getHighPriorityMedications().length > 0,
            hasVitalSigns: record.hasVitalSigns(),
            vitalSignsSummary: record.vitalSigns?.getSummary(),
            fhirCompliant: record.isFHIRCompliant(),
            specialtyCode: record.specialtyCode,
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
            lastAccessedAt: record.getLastAccessInfo()?.date.toISOString()
        };
        // Include detailed information if requested
        if (request.includeDetails) {
            summary.details = {
                examinationNotes: record.examinationNotes,
                notes: record.notes
            };
            if (request.includeDiagnoses) {
                summary.details.diagnoses = record.diagnoses.map(d => d.toJSON());
            }
            if (request.includeMedications) {
                summary.details.medications = record.medications.map(m => m.toJSON());
            }
            if (request.includeVitalSigns && record.vitalSigns) {
                summary.details.vitalSigns = record.vitalSigns.toJSON();
            }
            if (request.includeAccessLog) {
                summary.details.accessLog = record.accessLog;
            }
        }
        return summary;
    }
    /**
     * Generate unique search ID
     */
    generateSearchId(userId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '');
        return `SEARCH-${userId}-${timestamp}`;
    }
    /**
     * Audit search operation
     */
    async auditSearch(request, resultCount, executionTime, searchId) {
        // In a real implementation, this would log to an audit system
        console.log(`Search Audit: ${searchId}`, {
            searchedBy: request.searchedBy,
            criteria: request.criteria,
            resultCount,
            executionTime,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Validate request
     */
    async validate(request) {
        const errors = [];
        // Required fields validation
        if (!request.searchedBy || request.searchedBy.trim() === '') {
            errors.push({
                field: 'searchedBy',
                message: 'Người tìm kiếm là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.criteria || Object.keys(request.criteria).length === 0) {
            errors.push({
                field: 'criteria',
                message: 'Ít nhất một tiêu chí tìm kiếm là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        // Pagination validation
        if (request.pagination) {
            if (request.pagination.page < 1) {
                errors.push({
                    field: 'pagination.page',
                    message: 'Số trang phải lớn hơn 0',
                    code: 'INVALID_PAGINATION'
                });
            }
            if (request.pagination.limit < 1 || request.pagination.limit > 100) {
                errors.push({
                    field: 'pagination.limit',
                    message: 'Số lượng kết quả phải từ 1-100',
                    code: 'INVALID_PAGINATION'
                });
            }
        }
        // Date range validation
        if (request.criteria.visitDateFrom && request.criteria.visitDateTo) {
            const fromDate = new Date(request.criteria.visitDateFrom);
            const toDate = new Date(request.criteria.visitDateTo);
            if (fromDate > toDate) {
                errors.push({
                    field: 'criteria.visitDate',
                    message: 'Ngày bắt đầu phải trước ngày kết thúc',
                    code: 'INVALID_DATE_RANGE'
                });
            }
        }
        if (request.criteria.createdDateFrom && request.criteria.createdDateTo) {
            const fromDate = new Date(request.criteria.createdDateFrom);
            const toDate = new Date(request.criteria.createdDateTo);
            if (fromDate > toDate) {
                errors.push({
                    field: 'criteria.createdDate',
                    message: 'Ngày tạo bắt đầu phải trước ngày tạo kết thúc',
                    code: 'INVALID_DATE_RANGE'
                });
            }
        }
        // Enum validation
        if (request.criteria.status) {
            const invalidStatuses = request.criteria.status.filter(status => !Object.values(clinical_aggregate_1.MedicalRecordStatus).includes(status));
            if (invalidStatuses.length > 0) {
                errors.push({
                    field: 'criteria.status',
                    message: `Trạng thái không hợp lệ: ${invalidStatuses.join(', ')}`,
                    code: 'INVALID_ENUM_VALUE'
                });
            }
        }
        if (request.criteria.diagnosisCategory) {
            const invalidCategories = request.criteria.diagnosisCategory.filter(category => !Object.values(Diagnosis_1.DiagnosisCategory).includes(category));
            if (invalidCategories.length > 0) {
                errors.push({
                    field: 'criteria.diagnosisCategory',
                    message: `Loại chẩn đoán không hợp lệ: ${invalidCategories.join(', ')}`,
                    code: 'INVALID_ENUM_VALUE'
                });
            }
        }
        if (request.criteria.diagnosisSeverity) {
            const invalidSeverities = request.criteria.diagnosisSeverity.filter(severity => !Object.values(Diagnosis_1.DiagnosisSeverity).includes(severity));
            if (invalidSeverities.length > 0) {
                errors.push({
                    field: 'criteria.diagnosisSeverity',
                    message: `Mức độ nghiêm trọng không hợp lệ: ${invalidSeverities.join(', ')}`,
                    code: 'INVALID_ENUM_VALUE'
                });
            }
        }
        if (request.criteria.medicationStatus) {
            const invalidStatuses = request.criteria.medicationStatus.filter(status => !Object.values(Medication_1.MedicationStatus).includes(status));
            if (invalidStatuses.length > 0) {
                errors.push({
                    field: 'criteria.medicationStatus',
                    message: `Trạng thái thuốc không hợp lệ: ${invalidStatuses.join(', ')}`,
                    code: 'INVALID_ENUM_VALUE'
                });
            }
        }
        // Sort validation
        if (request.sort) {
            const validSortFields = ['visitDate', 'createdAt', 'updatedAt', 'patientId', 'doctorId'];
            if (!validSortFields.includes(request.sort.field)) {
                errors.push({
                    field: 'sort.field',
                    message: `Trường sắp xếp không hợp lệ: ${request.sort.field}`,
                    code: 'INVALID_SORT_FIELD'
                });
            }
            if (!['asc', 'desc'].includes(request.sort.direction)) {
                errors.push({
                    field: 'sort.direction',
                    message: `Hướng sắp xếp không hợp lệ: ${request.sort.direction}`,
                    code: 'INVALID_SORT_DIRECTION'
                });
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Check authorization
     */
    async authorize(request, userId) {
        // Basic authorization - user must match searchedBy
        if (request.searchedBy !== userId) {
            return false;
        }
        // Additional authorization rules can be added here
        // For example, checking if user has search permissions
        return true;
    }
    /**
     * Check if involves PHI
     */
    involvesPHI(request) {
        return true; // Medical record searches always involve PHI
    }
    /**
     * Get patient ID
     */
    getPatientId(request) {
        return request.criteria.patientId || null;
    }
    /**
     * Get use case description
     */
    getDescription() {
        return 'Tìm kiếm hồ sơ bệnh án với tiêu chí nâng cao';
    }
    /**
     * Get required permissions
     */
    getRequiredPermissions() {
        return ['medical_record:read', 'medical_record:search'];
    }
}
exports.SearchMedicalRecordsUseCase = SearchMedicalRecordsUseCase;
//# sourceMappingURL=SearchMedicalRecordsUseCase.js.map