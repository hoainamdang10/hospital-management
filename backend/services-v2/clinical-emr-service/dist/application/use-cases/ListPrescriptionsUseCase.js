"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPrescriptionsUseCase = void 0;
const mappers_1 = require("../dto/mappers");
class ListPrescriptionsUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const { page = 1, limit = 20 } = request;
        const data = await this.repository.listByRecord(request.recordId, {
            page,
            limit,
        });
        return data.map((item) => mappers_1.mappers.prescription(item));
    }
}
exports.ListPrescriptionsUseCase = ListPrescriptionsUseCase;
