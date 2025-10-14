/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Express } from 'express';
import { createStaffRoutes } from './staffRoutes';
import { StaffController } from '../controllers/StaffController';
import { logger } from '../../infrastructure/logging/logger';
import { RegisterStaffUseCase } from '../../application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from '../../application/use-cases/GetStaffProfileUseCase';
import { StaffCommandHandlers } from '../../application/handlers/StaffCommandHandlers';
import { StaffQueryHandlers } from '../../application/handlers/StaffQueryHandlers';

export function setupRoutes(
  app: Express,
  registerStaffUseCase: RegisterStaffUseCase,
  getStaffProfileUseCase: GetStaffProfileUseCase,
  staffCommandHandlers: StaffCommandHandlers,
  staffQueryHandlers: StaffQueryHandlers
): void {
  // Initialize controller
  const staffController = new StaffController(
    logger,
    registerStaffUseCase,
    getStaffProfileUseCase,
    staffCommandHandlers,
    staffQueryHandlers
  );

  // Staff routes
  const staffRoutes = createStaffRoutes(staffController);
  app.use('/api/v1/staff', staffRoutes);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      message: 'Provider/Staff Service is running',
      service: 'provider-staff-service',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      error: 'NOT_FOUND'
    });
  });

  logger.info('Routes configured successfully');
}
