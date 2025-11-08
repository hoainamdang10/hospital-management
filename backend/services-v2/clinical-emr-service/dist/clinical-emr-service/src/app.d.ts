/**
 * Clinical EMR Service - Express Application Setup
 * Main application configuration and middleware setup
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Express.js, HIPAA, Vietnamese Healthcare Standards
 */
import { Application } from "express";
/**
 * Create and configure Express application
 */
export declare function createApp(): Promise<Application>;
/**
 * Initialize application with dependencies
 */
export declare function initializeApp(): Promise<Application>;
/**
 * Cleanup event subscriptions
 */
export declare function cleanupEventSubscriptions(): Promise<void>;
/**
 * Get event subscriptions status
 */
export declare function getEventSubscriptionsStatus(): any;
//# sourceMappingURL=app.d.ts.map