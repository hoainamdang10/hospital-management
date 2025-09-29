import { Request, Response } from 'express';
export declare enum UserRole {
    ADMIN = "admin",
    DOCTOR = "doctor",
    PATIENT = "patient",
    NURSE = "nurse",
    RECEPTIONIST = "receptionist",
    MANAGER = "manager"
}
export interface User {
    id: string;
    email: string;
    role: string;
    profile?: any;
}
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    resetTime: Date;
}
export interface GraphQLContext {
    req: Request;
    res: Response;
    user?: User;
    token?: string;
    language: string;
    rateLimitInfo?: RateLimitInfo;
    requestId: string;
    startTime: number;
    restApi?: any;
    dataloaders?: any;
    userAgent?: string;
    ipAddress?: string;
    i18n?: any;
}
export interface BaseContext {
    req: Request;
    res: Response;
}
//# sourceMappingURL=context.types.d.ts.map