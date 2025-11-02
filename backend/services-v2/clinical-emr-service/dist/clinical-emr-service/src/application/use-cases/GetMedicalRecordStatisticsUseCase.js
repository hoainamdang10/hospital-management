"use strict";
/**
 * GetMedicalRecordStatisticsUseCase - Application Layer
 * Use case for getting medical record statistics
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMedicalRecordStatisticsUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
class GetMedicalRecordStatisticsUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(medicalRecordRepository) {
        super();
        this.medicalRecordRepository = medicalRecordRepository;
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
        return await this.executeInternal(request);
    }
    async executeInternal(request) {
        try {
            let statistics;
            if (request.patientId) {
                statistics = await this.medicalRecordRepository.getPatientStatistics(request.patientId);
            }
            else if (request.doctorId) {
                statistics = await this.medicalRecordRepository.getDoctorStatistics(request.doctorId);
            }
            else {
                // System-wide statistics not available, return empty stats
                statistics = {
                    totalRecords: 0,
                    activeRecords: 0,
                    archivedRecords: 0
                };
            }
            return {
                success: true,
                message: 'Thống kê hồ sơ bệnh án',
                data: {
                    overview: {
                        totalRecords: statistics.totalRecords || 0,
                        activeRecords: statistics.activeRecords || 0,
                        archivedRecords: statistics.archivedRecords || 0,
                        recordsThisMonth: statistics.recordsThisMonth || 0,
                        recordsThisYear: statistics.recordsThisYear || 0
                    },
                    byStatus: statistics.byStatus || {},
                    bySpecialty: statistics.bySpecialty || {},
                    trends: {
                        dailyAverage: statistics.dailyAverage || 0,
                        weeklyAverage: statistics.weeklyAverage || 0,
                        monthlyAverage: statistics.monthlyAverage || 0
                    },
                    topDiagnoses: statistics.topDiagnoses || [],
                    topMedications: statistics.topMedications || []
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi lấy thống kê: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.requestedBy) {
            errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });
        }
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.requestedBy === userId;
    }
    involvesPHI(request) {
        return false;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
    getDescription() {
        return 'Xem thống kê hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:read', 'statistics:view'];
    }
}
exports.GetMedicalRecordStatisticsUseCase = GetMedicalRecordStatisticsUseCase;
//# sourceMappingURL=GetMedicalRecordStatisticsUseCase.js.map