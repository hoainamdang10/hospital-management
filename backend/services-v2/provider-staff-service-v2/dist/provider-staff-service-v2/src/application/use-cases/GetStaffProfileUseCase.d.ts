/**
 * GetStaffProfileUseCase
 * Use case for retrieving staff profile information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IProviderStaffRepository } from '../repositories/IProviderStaffRepository';
export interface GetStaffProfileRequest {
    staffId: string;
}
export interface GetStaffProfileResponse {
    success: boolean;
    data?: {
        id: string;
        fullName: string;
        citizenId?: string;
        dateOfBirth?: string;
        gender?: string;
        phoneNumber?: string;
        email?: string;
        address?: string;
        licenseNumber?: string;
        specialization?: string;
        yearsOfExperience?: number;
        qualifications?: string[];
        certifications?: string[];
        staffType: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    };
    message: string;
}
export declare class GetStaffProfileUseCase {
    private readonly staffRepository;
    constructor(staffRepository: IProviderStaffRepository);
    execute(request: GetStaffProfileRequest): Promise<GetStaffProfileResponse>;
}
//# sourceMappingURL=GetStaffProfileUseCase.d.ts.map