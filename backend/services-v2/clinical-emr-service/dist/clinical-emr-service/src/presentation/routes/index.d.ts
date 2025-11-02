/**
 * Routes - Export Index
 * Central export point for all route creators
 */
import { Express } from 'express';
import { DIContainer } from '@shared/infrastructure/di/container';
export * from './clinicalNoteRoutes';
export * from './diagnosticReportRoutes';
export * from './treatmentPlanRoutes';
export * from './prescriptionRoutes';
/**
 * Setup all routes for the application
 */
export declare function setupRoutes(app: Express, container: DIContainer): void;
//# sourceMappingURL=index.d.ts.map