"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListImagingStudiesUseCase = void 0;
const mappers_1 = require("../dto/mappers");
class ListImagingStudiesUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const { page = 1, limit = 20 } = request;
        const data = await this.repository.listByRecord(request.recordId, {
            page,
            limit,
        });
        return data.map((study) => mappers_1.mappers.imagingStudy(study));
    }
}
exports.ListImagingStudiesUseCase = ListImagingStudiesUseCase;
