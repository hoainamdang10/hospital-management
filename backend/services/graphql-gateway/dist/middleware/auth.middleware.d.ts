import { ApolloServerPlugin } from "@apollo/server";
import { GraphQLContext, UserRole } from "../context";
/**
 * Authentication middleware for GraphQL
 * Handles JWT token validation and role-based access control
 */
export declare const authMiddleware: ApolloServerPlugin<GraphQLContext>;
/**
 * Field-level authorization directive
 */
export declare function requireAuth(roles?: UserRole[]): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Resource ownership check
 */
export declare function requireOwnership(getResourceUserId: (parent: any, args: any) => string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Permission-based authorization
 */
export declare function requirePermission(permission: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export default authMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map