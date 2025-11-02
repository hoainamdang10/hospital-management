"use strict";
/**
 * CreatePrescriptionUseCase - Create new prescription
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePrescriptionUseCase = void 0;
const Prescription_aggregate_1 = require("../../domain/aggregates/Prescription.aggregate");
const PrescriptionId_1 = require("../../domain/value-objects/PrescriptionId");
const PrescriptionRequest_1 = require("../dto/PrescriptionRequest");
class CreatePrescriptionUseCase {
    constructor(prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }
    async execute(request) {
        const validation = (0, PrescriptionRequest_1.validateCreatePrescriptionRequest)(request);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const sequence = await this.prescriptionRepository.getNextSequence(yearMonth);
        const prescriptionId = PrescriptionId_1.PrescriptionId.generate(sequence);
        const prescribedDate = new Date(request.prescribedDate);
        const validUntil = request.validUntil ? new Date(request.validUntil) : undefined;
        const prescription = Prescription_aggregate_1.PrescriptionAggregate.create(prescriptionId, request.medicalRecordId, request.patientId, request.prescribedBy, request.medications, prescribedDate, request.createdBy, {
            diagnosis: request.diagnosis,
            diagnosisCode: request.diagnosisCode,
            generalInstructions: request.generalInstructions,
            precautions: request.precautions,
            validUntil,
            refillsAllowed: request.refillsAllowed,
        });
        await this.prescriptionRepository.save(prescription);
        return {
            prescriptionId: prescriptionId.value,
            medicationCount: prescription.medications.length,
            status: prescription.status,
            createdAt: prescription.createdAt.toISOString(),
            message: 'Tạo đơn thuốc thành công',
        };
    }
    async authorize(request, userId) {
        return request.prescribedBy === userId || request.createdBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
}
exports.CreatePrescriptionUseCase = CreatePrescriptionUseCase;
//# sourceMappingURL=CreatePrescriptionUseCase.js.map