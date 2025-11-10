/**
 * Route Dependencies Type Definitions
 * Defines all dependencies needed by route handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { AuthenticationMiddleware } from "../middleware/AuthenticationMiddleware";
import { PermissionMiddleware } from "../middleware/PermissionMiddleware";
import { createInternalServiceAuthMiddleware } from "../middleware/InternalServiceAuthMiddleware";
import { AuthenticateUserUseCase } from "../../application/use-cases/AuthenticateUserUseCase";
import { RegisterUserUseCase } from "../../application/use-cases/RegisterUserUseCase";
import { ForgotPasswordUseCase } from "../../application/use-cases/ForgotPasswordUseCase";
import { ResetPasswordUseCase } from "../../application/use-cases/ResetPasswordUseCase";
import { VerifyEmailUseCase } from "../../application/use-cases/VerifyEmailUseCase";
import { ResendVerificationEmailUseCase } from "../../application/use-cases/ResendVerificationEmailUseCase";
import { LogoutUserUseCase } from "../../application/use-cases/LogoutUserUseCase";
import { EnableMFAUseCase } from "../../application/use-cases/EnableMFAUseCase";
import { VerifyMFAUseCase } from "../../application/use-cases/VerifyMFAUseCase";
import { DisableMFAUseCase } from "../../application/use-cases/DisableMFAUseCase";
import { GetUserUseCase } from "../../application/use-cases/GetUserUseCase";
import { UpdateUserUseCase } from "../../application/use-cases/UpdateUserUseCase";
import { DeleteUserUseCase } from "../../application/use-cases/DeleteUserUseCase";
import { ListUsersUseCase } from "../../application/use-cases/ListUsersUseCase";
import { RefreshTokenUseCase } from "../../application/use-cases/RefreshTokenUseCase";
import { ProvisionStaffUseCase } from "../../application/use-cases/ProvisionStaffUseCase";
import { AcceptStaffInvitationUseCase } from "../../application/use-cases/AcceptStaffInvitationUseCase";
import { ValidateStaffInvitationUseCase } from "../../application/use-cases/ValidateStaffInvitationUseCase";
import { ListStaffInvitationsUseCase } from "../../application/use-cases/ListStaffInvitationsUseCase";
import { GetStaffInvitationUseCase } from "../../application/use-cases/GetStaffInvitationUseCase";
import { CancelStaffInvitationUseCase } from "../../application/use-cases/CancelStaffInvitationUseCase";
import { ResendStaffInvitationUseCase } from "../../application/use-cases/ResendStaffInvitationUseCase";
import { ListActiveSessionsUseCase } from "../../application/use-cases/ListActiveSessionsUseCase";
import { TerminateSessionUseCase } from "../../application/use-cases/TerminateSessionUseCase";
import { TerminateAllSessionsUseCase } from "../../application/use-cases/TerminateAllSessionsUseCase";
import { GetPasswordPolicyUseCase } from "../../application/use-cases/GetPasswordPolicyUseCase";
import { UpdatePasswordPolicyUseCase } from "../../application/use-cases/UpdatePasswordPolicyUseCase";
import { ValidatePasswordUseCase } from "../../application/use-cases/ValidatePasswordUseCase";
import { GetRecoveryMethodsUseCase } from "../../application/use-cases/GetRecoveryMethodsUseCase";
import { UpdateRecoveryMethodsUseCase } from "../../application/use-cases/UpdateRecoveryMethodsUseCase";
import { RequestPasswordResetUseCase } from "../../application/use-cases/RequestPasswordResetUseCase";
import { VerifyResetTokenUseCase } from "../../application/use-cases/VerifyResetTokenUseCase";
import { ResetPasswordWithTokenUseCase } from "../../application/use-cases/ResetPasswordWithTokenUseCase";
import { GetRecoveryHistoryUseCase } from "../../application/use-cases/GetRecoveryHistoryUseCase";
import { ChangePasswordUseCase } from "../../application/use-cases/ChangePasswordUseCase";
import { LockAccountUseCase } from "../../application/use-cases/LockAccountUseCase";
import { UnlockAccountUseCase } from "../../application/use-cases/UnlockAccountUseCase";
import { AssignRoleUseCase } from "../../application/use-cases/AssignRoleUseCase";
import { CheckPermissionUseCase } from "../../application/use-cases/CheckPermissionUseCase";
import { CheckPermissionsUseCase } from "../../application/use-cases/CheckPermissionsUseCase";
import { CheckRoleUseCase } from "../../application/use-cases/CheckRoleUseCase";
import { CheckRolesUseCase } from "../../application/use-cases/CheckRolesUseCase";
import { IHealthCheckService } from "../../application/services/IHealthCheckService";
import { IDegradationService } from "../../application/services/IDegradationService";
import { IPermissionService } from "../../domain/services/IPermissionService";
import { ILogger } from "../../application/services/ILogger";
import { ICacheService } from "../../application/services/ICacheService";
/**
 * All dependencies needed by route handlers
 */
export interface RouteDependencies {
    logger: ILogger;
    cacheService: ICacheService | null;
    authMiddleware: AuthenticationMiddleware;
    permissionMiddleware: PermissionMiddleware;
    internalServiceAuthMiddleware: ReturnType<typeof createInternalServiceAuthMiddleware>;
    authenticateUserUseCase: AuthenticateUserUseCase;
    registerUserUseCase: RegisterUserUseCase;
    forgotPasswordUseCase: ForgotPasswordUseCase;
    resetPasswordUseCase: ResetPasswordUseCase;
    verifyEmailUseCase: VerifyEmailUseCase;
    resendVerificationEmailUseCase: ResendVerificationEmailUseCase;
    logoutUserUseCase: LogoutUserUseCase;
    refreshTokenUseCase: RefreshTokenUseCase;
    enableMFAUseCase: EnableMFAUseCase;
    verifyMFAUseCase: VerifyMFAUseCase;
    disableMFAUseCase: DisableMFAUseCase;
    getUserUseCase: GetUserUseCase;
    updateUserUseCase: UpdateUserUseCase;
    deleteUserUseCase: DeleteUserUseCase;
    listUsersUseCase: ListUsersUseCase;
    changePasswordUseCase: ChangePasswordUseCase;
    lockAccountUseCase: LockAccountUseCase;
    unlockAccountUseCase: UnlockAccountUseCase;
    assignRoleUseCase: AssignRoleUseCase;
    provisionStaffUseCase: ProvisionStaffUseCase;
    acceptStaffInvitationUseCase: AcceptStaffInvitationUseCase;
    validateStaffInvitationUseCase: ValidateStaffInvitationUseCase;
    listStaffInvitationsUseCase: ListStaffInvitationsUseCase;
    getStaffInvitationUseCase: GetStaffInvitationUseCase;
    cancelStaffInvitationUseCase: CancelStaffInvitationUseCase;
    resendStaffInvitationUseCase: ResendStaffInvitationUseCase;
    listActiveSessionsUseCase: ListActiveSessionsUseCase;
    terminateSessionUseCase: TerminateSessionUseCase;
    terminateAllSessionsUseCase: TerminateAllSessionsUseCase;
    getPasswordPolicyUseCase: GetPasswordPolicyUseCase;
    updatePasswordPolicyUseCase: UpdatePasswordPolicyUseCase;
    validatePasswordUseCase: ValidatePasswordUseCase;
    getRecoveryMethodsUseCase: GetRecoveryMethodsUseCase;
    updateRecoveryMethodsUseCase: UpdateRecoveryMethodsUseCase;
    requestPasswordResetUseCase: RequestPasswordResetUseCase;
    verifyResetTokenUseCase: VerifyResetTokenUseCase;
    resetPasswordWithTokenUseCase: ResetPasswordWithTokenUseCase;
    getRecoveryHistoryUseCase: GetRecoveryHistoryUseCase;
    checkPermissionUseCase: CheckPermissionUseCase;
    checkPermissionsUseCase: CheckPermissionsUseCase;
    checkRoleUseCase: CheckRoleUseCase;
    checkRolesUseCase: CheckRolesUseCase;
    healthCheck: IHealthCheckService;
    degradationService: IDegradationService;
    permissionService: IPermissionService;
}
//# sourceMappingURL=types.d.ts.map