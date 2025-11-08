"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLabResultsUseCase = void 0;
const mappers_1 = require("../dto/mappers");
class ListLabResultsUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const { page = 1, limit = 20 } = request;
        const data = await this.repository.listByRecord(request.recordId, {
            page,
            limit,
        });
        return data.map((result) => mappers_1.mappers.labResult(result));
    }
}
exports.ListLabResultsUseCase = ListLabResultsUseCase;
