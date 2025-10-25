"use strict";
/**
 * GetDoctorMedicalRecordsUseCase - Application Layer
 * Use case for retrieving all medical records by doctor
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDoctorMedicalRecordsUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
class GetDoctorMedicalRecordsUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
                data: {
                    records: [],
                    pagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 },
                    statistics: { totalRecords: 0, totalPatients: 0, recordsThisMonth: 0 }
                },
                errors: validation.errors
            };
        }
        return await this.executeInternal(request);
    }
    async executeInternal(request) {
        try {
            const page = request.page || 1;
            const pageSize = request.pageSize || 20;
            const offset = (page - 1) * pageSize;
            const records = await this.medicalRecordRepository.findByDoctorId(request.doctorId, {
                status: request.status,
                limit: pageSize,
                offset
            });
            const totalCount = await this.medicalRecordRepository.countByDoctorId(request.doctorId, request.status);
            const statistics = await this.medicalRecordRepository.getDoctorStatistics(request.doctorId);
            return {
                success: true,
                message: `Tìm thấy ${records.length} hồ sơ bệnh án`,
                data: {
                    records: records.map(r => r.toJSON()),
                    pagination: {
                        totalCount,
                        page,
                        pageSize,
                        totalPages: Math.ceil(totalCount / pageSize)
                    },
                    statistics: {
                        totalRecords: statistics.totalRecords,
                        totalPatients: statistics.uniquePatients,
                        recordsThisMonth: statistics.recordsThisMonth
                    }
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi lấy danh sách hồ sơ bác sĩ: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.doctorId)
            errors.push({ field: 'doctorId', message: 'DoctorId là bắt buộc', code: 'REQUIRED' });
        if (!request.requestedBy)
            errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.requestedBy === userId && request.doctorId === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Lấy danh sách hồ sơ bệnh án của bác sĩ';
    }
    getRequiredPermissions() {
        return ['medical_record:read'];
    }
}
exports.GetDoctorMedicalRecordsUseCase = GetDoctorMedicalRecordsUseCase;
//# sourceMappingURL=GetDoctorMedicalRecordsUseCase.js.map