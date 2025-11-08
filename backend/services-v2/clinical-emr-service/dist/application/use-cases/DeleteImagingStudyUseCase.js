"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteImagingStudyUseCase = void 0;
class DeleteImagingStudyUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute({ recordId, studyId, }) {
        await this.repository.delete(recordId, studyId);
    }
}
exports.DeleteImagingStudyUseCase = DeleteImagingStudyUseCase;
