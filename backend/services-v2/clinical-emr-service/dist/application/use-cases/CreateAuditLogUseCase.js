"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAuditLogUseCase = void 0;
const joi_1 = __importDefault(require("joi"));
const AuditLog_1 = require("../../domain/entities/AuditLog");
const mappers_1 = require("../dto/mappers");
const schema = joi_1.default.object({
    recordId: joi_1.default.string().uuid().required(),
    actorId: joi_1.default.string().uuid().required(),
    action: joi_1.default.string().required(),
    metadata: joi_1.default.object().optional(),
});
class CreateAuditLogUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const payload = await schema.validateAsync(request, { abortEarly: false });
        const entity = AuditLog_1.AuditLog.create({
            recordId: payload.recordId,
            actorId: payload.actorId,
            action: payload.action,
            metadata: payload.metadata,
        });
        await this.repository.log(entity.toJSON());
        return mappers_1.mappers.auditLog(entity.toJSON());
    }
}
exports.CreateAuditLogUseCase = CreateAuditLogUseCase;
