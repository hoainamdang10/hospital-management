"use strict";
/**
 * DispensePrescriptionUseCase - Dispense prescription from pharmacy
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispensePrescriptionUseCase = void 0;
const PrescriptionId_1 = require("../../domain/value-objects/PrescriptionId");
const PrescriptionRequest_1 = require("../dto/PrescriptionRequest");
class DispensePrescriptionUseCase {
    constructor(prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }
    async execute(request) {
        const validation = (0, PrescriptionRequest_1.validateDispensePrescriptionRequest)(request);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const prescriptionId = PrescriptionId_1.PrescriptionId.create(request.prescriptionId);
        const prescription = await this.prescriptionRepository.findById(prescriptionId);
        if (!prescription) {
            throw new Error(`Không tìm thấy đơn thuốc với ID ${request.prescriptionId}`);
        }
        prescription.dispense(request.dispensedBy, request.pharmacyId);
        await this.prescriptionRepository.save(prescription);
        return {
            prescriptionId: request.prescriptionId,
            status: prescription.status,
            dispensedAt: prescription.dispensedAt.toISOString(),
            message: 'Cấp thuốc thành công',
        };
    }
    async authorize(request, userId) {
        return request.dispensedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
}
exports.DispensePrescriptionUseCase = DispensePrescriptionUseCase;
//# sourceMappingURL=DispensePrescriptionUseCase.js.map