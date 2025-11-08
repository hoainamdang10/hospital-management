"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListClinicalNotesUseCase = void 0;
const mappers_1 = require("../dto/mappers");
class ListClinicalNotesUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const { page = 1, limit = 20 } = request;
        const notes = await this.repository.listByRecord(request.recordId, {
            page,
            limit,
        });
        return notes.map((n) => mappers_1.mappers.clinicalNote(n));
    }
}
exports.ListClinicalNotesUseCase = ListClinicalNotesUseCase;
