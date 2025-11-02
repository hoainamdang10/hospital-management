"use strict";
/**
 * PrescriptionController - HTTP Controller for Prescriptions
 * @compliance Clean Architecture, RESTful API, Pharmacy Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionController = void 0;
class PrescriptionController {
    constructor(createUseCase, getUseCase, dispenseUseCase, listUseCase) {
        this.createUseCase = createUseCase;
        this.getUseCase = getUseCase;
        this.dispenseUseCase = dispenseUseCase;
        this.listUseCase = listUseCase;
    }
    async createPrescription(req, res, next) {
        try {
            const request = {
                medicalRecordId: req.body.medicalRecordId,
                patientId: req.body.patientId,
                prescribedBy: req.body.prescribedBy,
                medications: req.body.medications,
                prescribedDate: req.body.prescribedDate,
                createdBy: req.user?.userId || req.body.createdBy,
                diagnosis: req.body.diagnosis,
                diagnosisCode: req.body.diagnosisCode,
                generalInstructions: req.body.generalInstructions,
                precautions: req.body.precautions,
                validUntil: req.body.validUntil,
                refillsAllowed: req.body.refillsAllowed,
            };
            const response = await this.createUseCase.execute(request);
            res.status(201).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async getPrescription(req, res, next) {
        try {
            const request = {
                prescriptionId: req.params.prescriptionId,
                accessedBy: req.user?.userId || '',
                accessPurpose: req.query.accessPurpose,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            };
            const response = await this.getUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async dispensePrescription(req, res, next) {
        try {
            const request = {
                prescriptionId: req.params.prescriptionId,
                dispensedBy: req.user?.userId || req.body.dispensedBy,
                pharmacyId: req.body.pharmacyId,
            };
            const response = await this.dispenseUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async listPrescriptions(req, res, next) {
        try {
            const request = {
                patientId: req.query.patientId,
                medicalRecordId: req.query.medicalRecordId,
                prescribedBy: req.query.prescribedBy,
                status: req.query.status,
                pharmacyId: req.query.pharmacyId,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
                hasRefills: req.query.hasRefills === 'true' ? true : req.query.hasRefills === 'false' ? false : undefined,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
            };
            const response = await this.listUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PrescriptionController = PrescriptionController;
//# sourceMappingURL=PrescriptionController.js.map