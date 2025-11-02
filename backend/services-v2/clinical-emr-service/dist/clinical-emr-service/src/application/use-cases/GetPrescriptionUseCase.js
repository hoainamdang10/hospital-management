"use strict";
/**
 * GetPrescriptionUseCase - Get prescription by ID with HIPAA logging
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPrescriptionUseCase = void 0;
const PrescriptionId_1 = require("../../domain/value-objects/PrescriptionId");
const PrescriptionRequest_1 = require("../dto/PrescriptionRequest");
class GetPrescriptionUseCase {
    constructor(prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }
    async execute(request) {
        const validation = (0, PrescriptionRequest_1.validateGetPrescriptionRequest)(request);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const prescriptionId = PrescriptionId_1.PrescriptionId.create(request.prescriptionId);
        const prescription = await this.prescriptionRepository.findById(prescriptionId);
        if (!prescription) {
            throw new Error(`Không tìm thấy đơn thuốc với ID ${request.prescriptionId}`);
        }
        prescription.recordReadAccess(request.accessedBy, request.accessPurpose, request.ipAddress, request.userAgent);
        await this.prescriptionRepository.save(prescription);
        return {
            prescriptionId: prescription.prescriptionId.value,
            medicalRecordId: prescription.medicalRecordId,
            patientId: prescription.patientId,
            prescribedBy: prescription.prescribedBy,
            diagnosis: prescription.diagnosis,
            medications: prescription.medications,
            generalInstructions: prescription.generalInstructions,
            precautions: prescription.precautions,
            prescribedDate: prescription.prescribedDate.toISOString(),
            validUntil: prescription.validUntil?.toISOString(),
            dispensedBy: prescription.dispensedBy,
            dispensedAt: prescription.dispensedAt?.toISOString(),
            pharmacyId: prescription.pharmacyId,
            refillsAllowed: prescription.refillsAllowed,
            refillsRemaining: prescription.refillsRemaining,
            status: prescription.status,
            createdAt: prescription.createdAt.toISOString(),
            updatedAt: prescription.updatedAt.toISOString(),
        };
    }
    async authorize(request, userId) {
        return request.accessedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
}
exports.GetPrescriptionUseCase = GetPrescriptionUseCase;
//# sourceMappingURL=GetPrescriptionUseCase.js.map