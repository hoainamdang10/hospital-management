import { Request, Response } from 'express';
export declare class UserController {
    private userService;
    constructor();
    getProfile: (req: Request, res: Response) => Promise<void>;
    updateProfile: (req: Request, res: Response) => Promise<void>;
    getAllUsers: (req: Request, res: Response) => Promise<void>;
    getUserById: (req: Request, res: Response) => Promise<void>;
    activateUser: (req: Request, res: Response) => Promise<void>;
    deactivateUser: (req: Request, res: Response) => Promise<void>;
    updateUserRole: (req: Request, res: Response) => Promise<void>;
    deleteUser: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=user.controller.d.ts.map