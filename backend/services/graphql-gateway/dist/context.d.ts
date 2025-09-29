import { SupabaseClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import { createDataLoaders } from "./dataloaders";
import { RestApiService } from "./services/rest-api.service";
/**
 * GraphQL Context Interface
 * Contains all data and services needed by resolvers
 */
export interface GraphQLContext {
    req: Request;
    res?: Response;
    user?: AuthenticatedUser;
    token?: string;
    restApi: RestApiService;
    supabase: SupabaseClient;
    dataloaders: ReturnType<typeof createDataLoaders>;
    requestId: string;
    startTime: number;
    userAgent?: string;
    ipAddress?: string;
    language: "vi" | "en";
    i18n?: {
        translate: (key: string, params?: any) => string;
    };
    rateLimitInfo?: {
        limit: number;
        remaining: number;
        resetTime: Date;
    };
}
/**
 * Authenticated User Interface
 */
export interface AuthenticatedUser {
    id: string;
    profileId: string;
    email: string;
    role: UserRole;
    permissions: string[];
    doctor_id?: string;
    patient_id?: string;
    fullName: string;
    is_active: boolean;
    lastLoginAt?: Date;
    sessionId?: string;
    tokenIssuedAt: Date;
    tokenExpiresAt: Date;
}
/**
 * User Roles
 */
export declare enum UserRole {
    ADMIN = "admin",
    DOCTOR = "doctor",
    PATIENT = "patient",
    RECEPTIONIST = "receptionist"
}
/**
 * Context creation parameters
 */
interface ContextParams {
    req: Request;
    res?: Response;
    connectionParams?: any;
}
/**
 * Create GraphQL Context
 * Sets up all services, authentication, and utilities needed by resolvers
 */
export declare function createContext({ req, res, connectionParams, }: ContextParams): Promise<GraphQLContext>;
/**
 * Check if user has required role
 */
export declare function hasRole(user: AuthenticatedUser | undefined, requiredRoles: UserRole[]): boolean;
/**
 * Check if user has required permission
 */
export declare function hasPermission(user: AuthenticatedUser | undefined, requiredPermission: string): boolean;
/**
 * Get user's entity ID based on role
 */
export declare function getUserEntityId(user: AuthenticatedUser): string | undefined;
/**
 * Context utilities for resolvers
 */
export declare const contextUtils: {
    /**
     * Require authentication
     */
    requireAuth(context: GraphQLContext): AuthenticatedUser;
    /**
     * Require specific role
     */
    requireRole(context: GraphQLContext, roles: UserRole[]): AuthenticatedUser;
    /**
     * Require specific permission
     */
    requirePermission(context: GraphQLContext, permission: string): AuthenticatedUser;
    /**
     * Check if user can access entity
     */
    canAccessEntity(context: GraphQLContext, entityUserId: string): boolean;
    /**
     * Get Vietnamese error message
     */
    getVietnameseError(englishMessage: string): string;
    /**
     * Safe i18n translate function
     */
    translate(context: GraphQLContext, key: string, params?: any): string;
};
export default createContext;
//# sourceMappingURL=context.d.ts.map