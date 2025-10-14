"use strict";
/**
 * GetStaffProfileUseCase
 * Use case for retrieving staff profile information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetStaffProfileUseCase = void 0;
const StaffId_1 = require("../../domain/value-objects/StaffId");
class GetStaffProfileUseCase {
    constructor(staffRepository) {
        this.staffRepository = staffRepository;
    }
    async execute(request) {
        try {
            const staffId = StaffId_1.StaffId.fromString(request.staffId);
            const staff = await this.staffRepository.findById(staffId);
            if (!staff) {
                return {
                    success: false,
                    message: 'Staff not found'
                };
            }
            return {
                success: true,
                data: {
                    id: staff.id,
                    fullName: staff.personalInfo.fullName,
                    citizenId: staff.personalInfo.citizenId,
                    dateOfBirth: staff.personalInfo.dateOfBirth?.toISOString(),
                    gender: staff.personalInfo.gender,
                    phoneNumber: staff.personalInfo.phoneNumber,
                    email: staff.personalInfo.email,
                    address: staff.personalInfo.address,
                    licenseNumber: staff.professionalInfo.licenseNumber,
                    specialization: staff.professionalInfo.specialization,
                    yearsOfExperience: staff.professionalInfo.yearsOfExperience,
                    qualifications: staff.professionalInfo.qualifications,
                    certifications: staff.professionalInfo.certifications,
                    staffType: staff.staffType,
                    isActive: staff.isActive,
                    createdAt: staff.createdAt.toISOString(),
                    updatedAt: staff.updatedAt.toISOString()
                },
                message: 'Staff profile retrieved successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
exports.GetStaffProfileUseCase = GetStaffProfileUseCase;
//# sourceMappingURL=GetStaffProfileUseCase.js.map