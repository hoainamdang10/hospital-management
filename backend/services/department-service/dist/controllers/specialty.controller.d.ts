import { Request, Response } from 'express';
export declare class SpecialtyController {
    private specialtyRepository;
    constructor();
    getAllSpecialties(req: Request, res: Response): Promise<void>;
    getSpecialtyById(req: Request, res: Response): Promise<void>;
    getSpecialtyDoctors(req: Request, res: Response): Promise<void>;
    createSpecialty(req: Request, res: Response): Promise<void>;
    updateSpecialty(req: Request, res: Response): Promise<void>;
    deleteSpecialty(req: Request, res: Response): Promise<void>;
    getSpecialtyStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=specialty.controller.d.ts.map