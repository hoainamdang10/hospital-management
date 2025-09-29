import { Request, Response } from 'express';
export declare class PatientController {
    private patientRepository;
    constructor();
    getAllPatients(req: Request, res: Response): Promise<void>;
    getPatientById(req: Request, res: Response): Promise<void>;
    getPatientByProfileId(req: Request, res: Response): Promise<void>;
    getPatientCountForDoctor(req: Request, res: Response): Promise<void>;
    getPatientStatsForDoctor(req: Request, res: Response): Promise<void>;
    getPatientsByDoctorId(req: Request, res: Response): Promise<void>;
    createPatient(req: Request, res: Response): Promise<void>;
    updatePatient(req: Request, res: Response): Promise<void>;
    deletePatient(req: Request, res: Response): Promise<void>;
    getPatientStats(req: Request, res: Response): Promise<void>;
    searchPatients(req: Request, res: Response): Promise<void>;
    getPatientsWithUpcomingAppointments(req: Request, res: Response): Promise<void>;
    getPatientMedicalSummary(req: Request, res: Response): Promise<void>;
    getRealtimeStatus(req: Request, res: Response): Promise<void>;
    getLivePatients(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=patient.controller.d.ts.map