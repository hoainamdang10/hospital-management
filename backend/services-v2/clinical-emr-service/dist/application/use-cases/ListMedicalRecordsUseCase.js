"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListMedicalRecordsUseCase = void 0;
const mappers_1 = require("../dto/mappers");
class ListMedicalRecordsUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const { page = 1, limit = 20, ...filters } = request;
        const results = await this.repository.list(filters, { page, limit });
        return results.map((record) => mappers_1.mappers.medicalRecord(record));
    }
}
exports.ListMedicalRecordsUseCase = ListMedicalRecordsUseCase;
