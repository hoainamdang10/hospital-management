"use strict";
/**
 * GrantAccessUseCase - Application Layer
 * Use case for granting access to medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantAccessUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const RecordId_1 = require("../../domain/value-objects/RecordId");
class GrantAccessUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
            const recordId = RecordId_1.RecordId.create(request.recordId);
            const medicalRecord = await this.medicalRecordRepository.findById(recordId);
            if (!medicalRecord) {
                return {
                    success: false,
                    message: 'Không tìm thấy hồ sơ bệnh án',
                    errors: [{ field: 'recordId', message: 'Hồ sơ không tồn tại', code: 'NOT_FOUND' }]
                };
            }
            // Log access grant in access log
            medicalRecord.recordReadAccess(request.grantedBy, `Cấp quyền ${request.accessLevel} cho ${request.grantedTo}`);
            await this.medicalRecordRepository.update(medicalRecord);
            return {
                success: true,
                message: 'Quyền truy cập đã được cấp thành công',
                data: {
                    recordId: request.recordId,
                    grantedTo: request.grantedTo,
                    accessLevel: request.accessLevel,
                    grantedAt: new Date().toISOString(),
                    expiresAt: request.expiresAt?.toISOString()
                }
            };
        }
        catch (error) {
            throw new Error(`Lỗi khi cấp quyền truy cập: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
    async validate(request) {
        const errors = [];
        if (!request.recordId)
            errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
        if (!request.grantedTo)
            errors.push({ field: 'grantedTo', message: 'GrantedTo là bắt buộc', code: 'REQUIRED' });
        if (!request.grantedBy)
            errors.push({ field: 'grantedBy', message: 'GrantedBy là bắt buộc', code: 'REQUIRED' });
        if (!request.accessLevel)
            errors.push({ field: 'accessLevel', message: 'AccessLevel là bắt buộc', code: 'REQUIRED' });
        return { isValid: errors.length === 0, errors };
    }
    async authorize(request, userId) {
        return request.grantedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
    getDescription() {
        return 'Cấp quyền truy cập hồ sơ bệnh án';
    }
    getRequiredPermissions() {
        return ['medical_record:share', 'access:grant'];
    }
}
exports.GrantAccessUseCase = GrantAccessUseCase;
//# sourceMappingURL=GrantAccessUseCase.js.map