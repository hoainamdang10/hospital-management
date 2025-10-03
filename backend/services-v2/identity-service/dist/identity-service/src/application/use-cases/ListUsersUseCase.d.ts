/**
 * List Users Use Case
 * Retrieves paginated list of users with filtering
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
export interface ListUsersRequest {
    requesterId: string;
    page?: number;
    limit?: number;
    roleType?: string;
    isActive?: boolean;
    searchTerm?: string;
}
export interface ListUsersResponse {
    success: boolean;
    users?: Array<{
        id: string;
        email: string;
        fullName: string;
        phoneNumber?: string;
        roleType: string;
        isActive: boolean;
        isEmailVerified: boolean;
        lastLoginAt?: string;
        createdAt: string;
    }>;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    message?: string;
    error?: string;
}
/**
 * List Users Use Case
 * Retrieves paginated list of users with filtering and search
 */
export declare class ListUsersUseCase implements IUseCase<ListUsersRequest, ListUsersResponse> {
    private userRepository;
    private logger;
    private circuitBreaker;
    private readonly DEFAULT_PAGE;
    private readonly DEFAULT_LIMIT;
    private readonly MAX_LIMIT;
    constructor(userRepository: IUserRepository, logger: any);
    execute(request: ListUsersRequest): Promise<ListUsersResponse>;
    private listUsersInternal;
}
//# sourceMappingURL=ListUsersUseCase.d.ts.map