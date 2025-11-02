"use strict";
/**
 * ListPrescriptionsUseCase - List prescriptions with filtering
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPrescriptionsUseCase = void 0;
const PrescriptionRequest_1 = require("../dto/PrescriptionRequest");
class ListPrescriptionsUseCase {
    constructor(prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }
    async execute(request) {
        const validation = (0, PrescriptionRequest_1.validateListPrescriptionsRequest)(request);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const limit = request.limit || 20;
        const offset = request.offset || 0;
        const fromDate = request.fromDate ? new Date(request.fromDate) : undefined;
        const toDate = request.toDate ? new Date(request.toDate) : undefined;
        const filters = {
            patientId: request.patientId,
            medicalRecordId: request.medicalRecordId,
            prescribedBy: request.prescribedBy,
            status: request.status,
            pharmacyId: request.pharmacyId,
            fromDate,
            toDate,
            hasRefills: request.hasRefills,
            limit,
            offset,
        };
        const prescriptions = await this.prescriptionRepository.search(filters);
        const total = await this.prescriptionRepository.count(filters);
        const prescriptionSummaries = prescriptions.map(p => ({
            prescriptionId: p.prescriptionId.value,
            patientId: p.patientId,
            prescribedBy: p.prescribedBy,
            medicationCount: p.medications.length,
            prescribedDate: p.prescribedDate.toISOString(),
            validUntil: p.validUntil?.toISOString(),
            dispensedAt: p.dispensedAt?.toISOString(),
            refillsRemaining: p.refillsRemaining,
            status: p.status,
            createdAt: p.createdAt.toISOString(),
        }));
        return {
            prescriptions: prescriptionSummaries,
            total,
            limit,
            offset,
        };
    }
    async authorize(request, userId) {
        return request.accessedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
}
exports.ListPrescriptionsUseCase = ListPrescriptionsUseCase;
//# sourceMappingURL=ListPrescriptionsUseCase.js.map