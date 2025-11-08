"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteClinicalNoteUseCase = void 0;
class DeleteClinicalNoteUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute({ recordId, noteId, }) {
        await this.repository.delete(recordId, noteId);
    }
}
exports.DeleteClinicalNoteUseCase = DeleteClinicalNoteUseCase;
