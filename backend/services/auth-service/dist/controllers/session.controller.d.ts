import { Request, Response } from 'express';
export declare class SessionController {
    private sessionService;
    constructor();
    getCurrentSession: (req: Request, res: Response) => Promise<void>;
    getUserSessions: (req: Request, res: Response) => Promise<void>;
    revokeAllSessions: (req: Request, res: Response) => Promise<void>;
    getAllSessions: (req: Request, res: Response) => Promise<void>;
    revokeUserSessions: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=session.controller.d.ts.map