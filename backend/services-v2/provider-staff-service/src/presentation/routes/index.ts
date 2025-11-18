/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Express } from 'express';
import { createStaffRoutes } from './staffRoutes';
import { createDepartmentRoutes } from './department.routes';
import { StaffController } from '../controllers/StaffController';
import { logger } from '../../infrastructure/logging/logger';
import { RegisterStaffUseCase } from '../../application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from '../../application/use-cases/GetStaffProfileUseCase';
import { AssignStaffToDepartmentUseCase } from '../../application/use-cases/AssignStaffToDepartmentUseCase';
import { SetDepartmentHeadUseCase } from '../../application/use-cases/SetDepartmentHeadUseCase';
import { AddStaffCredentialUseCase } from '../../application/use-cases/AddStaffCredentialUseCase';
import { RemoveStaffCredentialUseCase } from '../../application/use-cases/RemoveStaffCredentialUseCase';
import { RenewStaffCredentialUseCase } from '../../application/use-cases/RenewStaffCredentialUseCase';
import { GetExpiringCredentialsUseCase } from '../../application/use-cases/GetExpiringCredentialsUseCase';
import { ActivateStaffUseCase } from '../../application/use-cases/ActivateStaffUseCase';
import { SuspendStaffUseCase } from '../../application/use-cases/SuspendStaffUseCase';
import { ReactivateStaffUseCase } from '../../application/use-cases/ReactivateStaffUseCase';
import { TerminateStaffUseCase } from '../../application/use-cases/TerminateStaffUseCase';
import { UpdateEmploymentStatusUseCase } from '../../application/use-cases/UpdateEmploymentStatusUseCase';
import { UpdateStaffScheduleUseCase } from '../../application/use-cases/UpdateStaffScheduleUseCase';
// REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service (bounded context violation)
import { GetStaffSpecializationsUseCase } from '../../application/use-cases/GetStaffSpecializationsUseCase';
import { AddStaffSpecializationUseCase } from '../../application/use-cases/AddStaffSpecializationUseCase';
import { RemoveStaffSpecializationUseCase } from '../../application/use-cases/RemoveStaffSpecializationUseCase';
import { StaffCommandHandlers } from '../../application/handlers/StaffCommandHandlers';
import { StaffQueryHandlers } from '../../application/handlers/StaffQueryHandlers';
import { SupabaseDepartmentRepository } from '../../infrastructure/repositories/SupabaseDepartmentRepository';

export function setupRoutes(
  app: Express,
  registerStaffUseCase: RegisterStaffUseCase,
  getStaffProfileUseCase: GetStaffProfileUseCase,
  assignStaffToDepartmentUseCase: AssignStaffToDepartmentUseCase,
  setDepartmentHeadUseCase: SetDepartmentHeadUseCase,
  staffCommandHandlers: StaffCommandHandlers,
  staffQueryHandlers: StaffQueryHandlers,
  addStaffCredentialUseCase: AddStaffCredentialUseCase,
  removeStaffCredentialUseCase: RemoveStaffCredentialUseCase,
  renewStaffCredentialUseCase: RenewStaffCredentialUseCase,
  getExpiringCredentialsUseCase: GetExpiringCredentialsUseCase,
  activateStaffUseCase: ActivateStaffUseCase,
  suspendStaffUseCase: SuspendStaffUseCase,
  reactivateStaffUseCase: ReactivateStaffUseCase,
  terminateStaffUseCase: TerminateStaffUseCase,
  updateEmploymentStatusUseCase: UpdateEmploymentStatusUseCase,
  updateStaffScheduleUseCase: UpdateStaffScheduleUseCase,
  // REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service
  getStaffSpecializationsUseCase: GetStaffSpecializationsUseCase,
  addStaffSpecializationUseCase: AddStaffSpecializationUseCase,
  removeStaffSpecializationUseCase: RemoveStaffSpecializationUseCase
): void {
  // Initialize controller
  const staffController = new StaffController(
    logger,
    registerStaffUseCase,
    getStaffProfileUseCase,
    assignStaffToDepartmentUseCase,
    setDepartmentHeadUseCase,
    staffCommandHandlers,
    staffQueryHandlers,
    addStaffCredentialUseCase,
    removeStaffCredentialUseCase,
    renewStaffCredentialUseCase,
    getExpiringCredentialsUseCase,
    activateStaffUseCase,
    suspendStaffUseCase,
    reactivateStaffUseCase,
    terminateStaffUseCase,
    updateEmploymentStatusUseCase,
    updateStaffScheduleUseCase,
    // REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service
    getStaffSpecializationsUseCase,
    addStaffSpecializationUseCase,
    removeStaffSpecializationUseCase
  );

  // Staff routes
  const staffRoutes = createStaffRoutes(staffController);
  app.use('/api/v1/staff', staffRoutes);

  // Department routes (now integrated into Provider Service)
  const departmentRepository = new SupabaseDepartmentRepository(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  const departmentRoutes = createDepartmentRoutes(departmentRepository);
  app.use('/api/v1/departments', departmentRoutes);

  logger.info('Department routes registered at /api/v1/departments');

  // Note: /health endpoint is registered in src/main.ts (detailed version)
  // Removed duplicate registration to avoid conflicts

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
