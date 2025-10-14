/**
 * Route Dependencies Type Definitions
 * Defines all dependencies needed by route handlers
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { AuthenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { PermissionMiddleware } from '../middleware/PermissionMiddleware';
import { AuthenticateUserUseCase } from '../../application/use-cases/AuthenticateUserUseCase';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { ForgotPasswordUseCase } from '../../application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPasswordUseCase';
import { VerifyEmailUseCase } from '../../application/use-cases/VerifyEmailUseCase';
import { LogoutUserUseCase } from '../../application/use-cases/LogoutUserUseCase';
import { EnableMFAUseCase } from '../../application/use-cases/EnableMFAUseCase';
import { VerifyMFAUseCase } from '../../application/use-cases/VerifyMFAUseCase';
import { DisableMFAUseCase } from '../../application/use-cases/DisableMFAUseCase';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase';
import { UpdateUserUseCase } from '../../application/use-cases/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../application/use-cases/DeleteUserUseCase';
import { ListUsersUseCase } from '../../application/use-cases/ListUsersUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { ProvisionStaffUseCase } from '../../application/use-cases/ProvisionStaffUseCase';
import { AcceptStaffInvitationUseCase } from '../../application/use-cases/AcceptStaffInvitationUseCase';
import { ListActiveSessionsUseCase } from '../../application/use-cases/ListActiveSessionsUseCase';
import { TerminateSessionUseCase } from '../../application/use-cases/TerminateSessionUseCase';
import { TerminateAllSessionsUseCase } from '../../application/use-cases/TerminateAllSessionsUseCase';
import { GetPasswordPolicyUseCase } from '../../application/use-cases/GetPasswordPolicyUseCase';
import { UpdatePasswordPolicyUseCase } from '../../application/use-cases/UpdatePasswordPolicyUseCase';
import { ValidatePasswordUseCase } from '../../application/use-cases/ValidatePasswordUseCase';
import { GetRecoveryMethodsUseCase } from '../../application/use-cases/GetRecoveryMethodsUseCase';
import { UpdateRecoveryMethodsUseCase } from '../../application/use-cases/UpdateRecoveryMethodsUseCase';
import { RequestPasswordResetUseCase } from '../../application/use-cases/RequestPasswordResetUseCase';
import { VerifyResetTokenUseCase } from '../../application/use-cases/VerifyResetTokenUseCase';
import { ResetPasswordWithTokenUseCase } from '../../application/use-cases/ResetPasswordWithTokenUseCase';
import { GetRecoveryHistoryUseCase } from '../../application/use-cases/GetRecoveryHistoryUseCase';
import { ChangePasswordUseCase } from '../../application/use-cases/ChangePasswordUseCase';
import { LockAccountUseCase } from '../../application/use-cases/LockAccountUseCase';
import { UnlockAccountUseCase } from '../../application/use-cases/UnlockAccountUseCase';
import { AssignRoleUseCase } from '../../application/use-cases/AssignRoleUseCase';
import { CheckPermissionUseCase } from '../../application/use-cases/CheckPermissionUseCase';
import { CheckPermissionsUseCase } from '../../application/use-cases/CheckPermissionsUseCase';
import { CheckRoleUseCase } from '../../application/use-cases/CheckRoleUseCase';
import { CheckRolesUseCase } from '../../application/use-cases/CheckRolesUseCase';
import { IdentityServiceHealthCheck } from '../../infrastructure/monitoring/HealthChecks';
import { IdentityServiceDegradation } from '../../infrastructure/resilience/GracefulDegradation';
import { PermissionService } from '../../infrastructure/services/PermissionService';

/**
 * All dependencies needed by route handlers
 */
export interface RouteDependencies {
  // Middleware
  authMiddleware: AuthenticationMiddleware;
  permissionMiddleware: PermissionMiddleware;

  // Auth Use Cases
  authenticateUserUseCase: AuthenticateUserUseCase;
  registerUserUseCase: RegisterUserUseCase;
  forgotPasswordUseCase: ForgotPasswordUseCase;
  resetPasswordUseCase: ResetPasswordUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  logoutUserUseCase: LogoutUserUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  
  // MFA Use Cases
  enableMFAUseCase: EnableMFAUseCase;
  verifyMFAUseCase: VerifyMFAUseCase;
  disableMFAUseCase: DisableMFAUseCase;

  // User Management Use Cases
  getUserUseCase: GetUserUseCase;
  updateUserUseCase: UpdateUserUseCase;
  deleteUserUseCase: DeleteUserUseCase;
  listUsersUseCase: ListUsersUseCase;
  changePasswordUseCase: ChangePasswordUseCase;
  lockAccountUseCase: LockAccountUseCase;
  unlockAccountUseCase: UnlockAccountUseCase;
  assignRoleUseCase: AssignRoleUseCase;

  // Staff Management Use Cases
  provisionStaffUseCase: ProvisionStaffUseCase;
  acceptStaffInvitationUseCase: AcceptStaffInvitationUseCase;

  // Session Management Use Cases
  listActiveSessionsUseCase: ListActiveSessionsUseCase;
  terminateSessionUseCase: TerminateSessionUseCase;
  terminateAllSessionsUseCase: TerminateAllSessionsUseCase;

  // Password Policy Use Cases
  getPasswordPolicyUseCase: GetPasswordPolicyUseCase;
  updatePasswordPolicyUseCase: UpdatePasswordPolicyUseCase;
  validatePasswordUseCase: ValidatePasswordUseCase;

  // Account Recovery Use Cases
  getRecoveryMethodsUseCase: GetRecoveryMethodsUseCase;
  updateRecoveryMethodsUseCase: UpdateRecoveryMethodsUseCase;
  requestPasswordResetUseCase: RequestPasswordResetUseCase;
  verifyResetTokenUseCase: VerifyResetTokenUseCase;
  resetPasswordWithTokenUseCase: ResetPasswordWithTokenUseCase;
  getRecoveryHistoryUseCase: GetRecoveryHistoryUseCase;

  // Permission Check Use Cases
  checkPermissionUseCase: CheckPermissionUseCase;
  checkPermissionsUseCase: CheckPermissionsUseCase;
  checkRoleUseCase: CheckRoleUseCase;
  checkRolesUseCase: CheckRolesUseCase;

  // Services
  healthCheck: IdentityServiceHealthCheck;
  degradationService: IdentityServiceDegradation;
  permissionService: PermissionService;
}

