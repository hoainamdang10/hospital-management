import { Request, Response } from "express";
export declare class QueueController {
    private receptionistRepository;
    constructor();
    getQueueStatus: (req: Request, res: Response) => Promise<void>;
    getLiveQueue: (req: Request, res: Response) => Promise<void>;
    updateQueuePriority: (req: Request, res: Response) => Promise<void>;
    catch(error: any): void;
}
//# sourceMappingURL=queue.controller.d.ts.map