import { Request, Response } from 'express';
export declare class AdminOrchestrationController {
    private orchestrator;
    private logger;
    constructor();
    initialize(): Promise<void>;
    createDoctor: (req: Request, res: Response) => Promise<void>;
    bulkUserImport: (req: Request, res: Response) => Promise<void>;
    systemMaintenance: (req: Request, res: Response) => Promise<void>;
    crossServiceSync: (req: Request, res: Response) => Promise<void>;
    getOperationStatus: (req: Request, res: Response) => Promise<void>;
    cancelOperation: (req: Request, res: Response) => Promise<void>;
    getHealthStatus: (req: Request, res: Response) => Promise<void>;
    getStatistics: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=orchestration.controller.d.ts.map