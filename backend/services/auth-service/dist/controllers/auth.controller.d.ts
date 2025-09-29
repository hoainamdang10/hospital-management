import { Request, Response } from "express";
export declare class AuthController {
    private authService;
    constructor();
    signUp: (req: Request, res: Response) => Promise<void>;
    signIn: (req: Request, res: Response) => Promise<void>;
    signOut: (req: Request, res: Response) => Promise<void>;
    refreshToken: (req: Request, res: Response) => Promise<void>;
    resetPassword: (req: Request, res: Response) => Promise<void>;
    verifyToken: (req: Request, res: Response) => Promise<void>;
    createDoctorRecord: (req: Request, res: Response) => Promise<void>;
    createPatientRecord: (req: Request, res: Response) => Promise<void>;
    registerPatient: (req: Request, res: Response) => Promise<void>;
    registerDoctor: (req: Request, res: Response) => Promise<void>;
    registerReceptionist: (req: Request, res: Response) => Promise<void>;
    sendMagicLink: (req: Request, res: Response) => Promise<void>;
    sendPhoneOTP: (req: Request, res: Response) => Promise<void>;
    verifyPhoneOTP: (req: Request, res: Response) => Promise<void>;
    initiateOAuth: (req: Request, res: Response) => Promise<void>;
    handleOAuthCallback: (req: Request, res: Response) => Promise<void>;
    checkEmailAvailability: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map