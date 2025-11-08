"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMedicalRecordUseCase = void 0;
const mappers_1 = require("../dto/mappers");
const ApplicationError_1 = require("../errors/ApplicationError");
class GetMedicalRecordUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        if (!request.id) {
            throw new ApplicationError_1.ApplicationError(400, "recordId là bắt buộc");
        }
        const data = await this.repository.getById(request.id);
        if (!data) {
            throw new ApplicationError_1.ApplicationError(404, "Không tìm thấy hồ sơ");
        }
        if (request.patientId && data.patientId !== request.patientId) {
            throw new ApplicationError_1.ApplicationError(403, "Bạn không có quyền truy cập hồ sơ này");
        }
        return mappers_1.mappers.medicalRecord(data);
    }
}
exports.GetMedicalRecordUseCase = GetMedicalRecordUseCase;
