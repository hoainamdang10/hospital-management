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
import { VerifyEmailUseCase } from "../../application/use-cases/VerifyEmailUseCase";
import { ResendVerificationEmailUseCase } from "../../application/use-cases/ResendVerificationEmailUseCase";
import { LogoutUserUseCase } from "../../application/use-cases/LogoutUserUseCase";
import { GetUserUseCase } from "../../application/use-cases/GetUserUseCase";
import { UpdateUserUseCase } from "../../application/use-cases/UpdateUserUseCase";
import { ListUsersUseCase } from "../../application/use-cases/ListUsersUseCase";
import { ProvisionStaffUseCase } from "../../application/use-cases/ProvisionStaffUseCase";
import { AcceptStaffInvitationUseCase } from "../../application/use-cases/AcceptStaffInvitationUseCase";
import { ValidateStaffInvitationUseCase } from "../../application/use-cases/ValidateStaffInvitationUseCase";
import { ChangePasswordUseCase } from "../../application/use-cases/ChangePasswordUseCase";
import { AssignRoleUseCase } from "../../application/use-cases/AssignRoleUseCase";
import { UnlockAccountUseCase } from "../../application/use-cases/UnlockAccountUseCase";
import { IHealthCheckService } from "../../application/services/IHealthCheckService";
import { IDegradationService } from "../../application/services/IDegradationService";
import { IPermissionService } from "../../domain/services/IPermissionService";
import { ILogger } from "../../application/services/ILogger";
import { ICacheService } from "../../application/services/ICacheService";
import { OutboxPublisher } from "../../infrastructure/outbox/OutboxPublisher";
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
    verifyEmailUseCase: VerifyEmailUseCase;
    resendVerificationEmailUseCase: ResendVerificationEmailUseCase;
    logoutUserUseCase: LogoutUserUseCase;
    getUserUseCase: GetUserUseCase;
    updateUserUseCase: UpdateUserUseCase;
    listUsersUseCase: ListUsersUseCase;
    changePasswordUseCase: ChangePasswordUseCase;
    assignRoleUseCase: AssignRoleUseCase;
    unlockAccountUseCase: UnlockAccountUseCase;
    provisionStaffUseCase: ProvisionStaffUseCase;
    acceptStaffInvitationUseCase: AcceptStaffInvitationUseCase;
    validateStaffInvitationUseCase: ValidateStaffInvitationUseCase;
    healthCheck: IHealthCheckService;
    degradationService: IDegradationService;
    permissionService: IPermissionService;
    outboxPublisher: OutboxPublisher;
}
//# sourceMappingURL=types.d.ts.map