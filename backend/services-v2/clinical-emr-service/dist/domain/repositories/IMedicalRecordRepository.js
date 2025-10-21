"use strict";
/**
 * IMedicalRecordRepository - Domain Repository Interface
 * Repository interface for medical record aggregate
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordValidationError = exports.MedicalRecordConcurrencyError = exports.MedicalRecordAlreadyExistsError = exports.MedicalRecordNotFoundError = exports.MedicalRecordRepositoryError = void 0;
/**
 * Repository error types
 */
class MedicalRecordRepositoryError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'MedicalRecordRepositoryError';
    }
}
exports.MedicalRecordRepositoryError = MedicalRecordRepositoryError;
class MedicalRecordNotFoundError extends MedicalRecordRepositoryError {
    constructor(recordId) {
        super(`Không tìm thấy hồ sơ bệnh án với ID: ${recordId}`, 'MEDICAL_RECORD_NOT_FOUND');
    }
}
exports.MedicalRecordNotFoundError = MedicalRecordNotFoundError;
class MedicalRecordAlreadyExistsError extends MedicalRecordRepositoryError {
    constructor(recordId) {
        super(`Hồ sơ bệnh án với ID ${recordId} đã tồn tại`, 'MEDICAL_RECORD_ALREADY_EXISTS');
    }
}
exports.MedicalRecordAlreadyExistsError = MedicalRecordAlreadyExistsError;
class MedicalRecordConcurrencyError extends MedicalRecordRepositoryError {
    constructor(recordId) {
        super(`Hồ sơ bệnh án ${recordId} đã được cập nhật bởi người khác`, 'MEDICAL_RECORD_CONCURRENCY_ERROR');
    }
}
exports.MedicalRecordConcurrencyError = MedicalRecordConcurrencyError;
class MedicalRecordValidationError extends MedicalRecordRepositoryError {
    constructor(message) {
        super(`Lỗi validation hồ sơ bệnh án: ${message}`, 'MEDICAL_RECORD_VALIDATION_ERROR');
    }
}
exports.MedicalRecordValidationError = MedicalRecordValidationError;
//# sourceMappingURL=IMedicalRecordRepository.js.map