"use strict";
/**
 * Rescheduling Queue Controller - Presentation Layer
 * HTTP endpoints for rescheduling queue management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Design
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReschedulingQueueController = void 0;
const IReschedulingQueueRepository_1 = require("../../domain/interfaces/IReschedulingQueueRepository");
class ReschedulingQueueController {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    /**
     * Get queue statistics
     * GET /api/v1/rescheduling-queue/statistics
     */
    async getStatistics(req, res) {
        try {
            const statistics = await this.dependencies.reschedulingQueueRepository.getQueueStatistics();
            res.json({
                success: true,
                data: statistics,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Failed to get rescheduling queue statistics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve queue statistics',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Get pending rescheduling entries
     * GET /api/v1/rescheduling-queue/pending
     */
    async getPendingEntries(req, res) {
        try {
            const { doctorId, priority, limit = 50, offset = 0 } = req.query;
            const query = {
                doctorId: doctorId,
                priority: priority,
                limit: Number(limit),
                offset: Number(offset)
            };
            const entries = await this.dependencies.reschedulingQueueRepository.findPendingEntries(query);
            res.json({
                success: true,
                data: entries,
                count: entries.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Failed to get pending rescheduling entries:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve pending entries',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Get rescheduling entry by ID
     * GET /api/v1/rescheduling-queue/:id
     */
    async getEntryById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Entry ID is required'
                });
                return;
            }
            const entry = await this.dependencies.reschedulingQueueRepository.findById(id);
            if (!entry) {
                res.status(404).json({
                    success: false,
                    error: 'Rescheduling queue entry not found'
                });
                return;
            }
            res.json({
                success: true,
                data: entry,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Failed to get rescheduling queue entry:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve queue entry',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Update patient response
     * PATCH /api/v1/rescheduling-queue/:id/patient-response
     */
    async updatePatientResponse(req, res) {
        try {
            const { id } = req.params;
            const { patientResponse, notes, respondedBy } = req.body;
            if (!id || !patientResponse) {
                res.status(400).json({
                    success: false,
                    error: 'Entry ID and patient response are required'
                });
                return;
            }
            if (!Object.values(IReschedulingQueueRepository_1.PatientResponse).includes(patientResponse)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid patient response',
                    validResponses: Object.values(IReschedulingQueueRepository_1.PatientResponse)
                });
                return;
            }
            const updatedEntry = await this.dependencies.reschedulingService.processPatientResponse({
                queueEntryId: id,
                patientResponse,
                notes,
                respondedBy
            });
            res.json({
                success: true,
                data: updatedEntry,
                message: 'Patient response updated successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Failed to update patient response:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update patient response',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Process expired entries
     * POST /api/v1/rescheduling-queue/process-expired
     */
    async processExpiredEntries(req, res) {
        try {
            await this.dependencies.reschedulingService.processExpiredEntries();
            res.json({
                success: true,
                message: 'Expired entries processed successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Failed to process expired entries:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process expired entries',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Get entries by doctor ID
     * GET /api/v1/rescheduling-queue/doctor/:doctorId
     */
    async getEntriesByDoctor(req, res) {
        try {
            const { doctorId } = req.params;
            const { status, priority, limit = 50, offset = 0 } = req.query;
            if (!doctorId) {
                res.status(400).json({
                    success: false,
                    error: 'Doctor ID is required'
                });
                return;
            }
            const query = {
                status: status,
                priority: priority,
                limit: Number(limit),
                offset: Number(offset)
            };
            const entries = await this.dependencies.reschedulingQueueRepository.findByDoctorId(doctorId, query);
            res.json({
                success: true,
                data: entries,
                count: entries.length,
                doctorId,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Failed to get entries by doctor:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve entries for doctor',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Complete rescheduling
     * POST /api/v1/rescheduling-queue/:id/complete
     */
    async completeRescheduling(req, res) {
        try {
            const { id } = req.params;
            const { newAppointmentId, resolvedBy } = req.body;
            if (!id || !newAppointmentId || !resolvedBy) {
                res.status(400).json({
                    success: false,
                    error: 'Entry ID, new appointment ID, and resolved by are required'
                });
                return;
            }
            const completedEntry = await this.dependencies.reschedulingService.completeRescheduling(id, newAppointmentId, resolvedBy);
            res.json({
                success: true,
                data: completedEntry,
                message: 'Rescheduling completed successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Failed to complete rescheduling:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to complete rescheduling',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Find available slots for rescheduling
     * GET /api/v1/rescheduling-queue/:id/available-slots
     */
    async findAvailableSlots(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Entry ID is required'
                });
                return;
            }
            const availableSlots = await this.dependencies.reschedulingService.findAvailableSlotsForRescheduling(id);
            res.json({
                success: true,
                data: availableSlots,
                count: availableSlots.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Failed to find available slots:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to find available slots',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.ReschedulingQueueController = ReschedulingQueueController;
//# sourceMappingURL=ReschedulingQueueController.js.map