/**
 * ClinicalNoteController - HTTP Controller for Clinical Notes
 * Handles HTTP requests and delegates to use cases
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */
import { Request, Response, NextFunction } from 'express';
import { CreateClinicalNoteUseCase, GetClinicalNoteUseCase, UpdateClinicalNoteUseCase, CosignClinicalNoteUseCase, ListClinicalNotesUseCase } from '../../application/use-cases';
export declare class ClinicalNoteController {
    private readonly createUseCase;
    private readonly getUseCase;
    private readonly updateUseCase;
    private readonly cosignUseCase;
    private readonly listUseCase;
    constructor(createUseCase: CreateClinicalNoteUseCase, getUseCase: GetClinicalNoteUseCase, updateUseCase: UpdateClinicalNoteUseCase, cosignUseCase: CosignClinicalNoteUseCase, listUseCase: ListClinicalNotesUseCase);
    createNote(req: Request, res: Response, next: NextFunction): Promise<void>;
    getNote(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateNote(req: Request, res: Response, next: NextFunction): Promise<void>;
    cosignNote(req: Request, res: Response, next: NextFunction): Promise<void>;
    listNotes(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=ClinicalNoteController.d.ts.map