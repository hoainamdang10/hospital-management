/**
 * RegisterStaffUseCase
 * Use case for registering new staff members
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IProviderStaffRepository } from '../repositories/IProviderStaffRepository';
import { StaffType } from '../../domain/aggregates/ProviderStaff';
export interface RegisterStaffRequest {
    fullName: string;
    citizenId?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    phoneNumber?: string;
    email?: string;
    address?: string;
    licenseNumber?: string;
    specialization?: string;
    yearsOfExperience?: number;
    qualifications?: string[];
    certifications?: string[];
    staffType: StaffType;
}
export interface RegisterStaffResponse {
    success: boolean;
    staffId?: string;
    message: string;
}
export declare class RegisterStaffUseCase {
    private readonly staffRepository;
    constructor(staffRepository: IProviderStaffRepository);
    execute(request: RegisterStaffRequest): Promise<RegisterStaffResponse>;
}
//# sourceMappingURL=RegisterStaffUseCase.d.ts.map