"use strict";
/**
 * RegisterStaffUseCase
 * Use case for registering new staff members
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterStaffUseCase = void 0;
const ProviderStaff_1 = require("../../domain/aggregates/ProviderStaff");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const ProfessionalInfo_1 = require("../../domain/value-objects/ProfessionalInfo");
class RegisterStaffUseCase {
    constructor(staffRepository) {
        this.staffRepository = staffRepository;
    }
    async execute(request) {
        try {
            // Create value objects
            const personalInfo = PersonalInfo_1.PersonalInfo.create({
                fullName: request.fullName,
                citizenId: request.citizenId,
                dateOfBirth: request.dateOfBirth ? new Date(request.dateOfBirth) : undefined,
                gender: request.gender,
                phoneNumber: request.phoneNumber,
                email: request.email,
                address: request.address
            });
            const professionalInfo = ProfessionalInfo_1.ProfessionalInfo.create({
                licenseNumber: request.licenseNumber,
                specialization: request.specialization,
                yearsOfExperience: request.yearsOfExperience,
                qualifications: request.qualifications,
                certifications: request.certifications
            });
            // Create staff aggregate
            const staff = ProviderStaff_1.ProviderStaff.create(personalInfo, professionalInfo, request.staffType);
            // Save to repository
            await this.staffRepository.save(staff);
            return {
                success: true,
                staffId: staff.id,
                message: 'Staff registered successfully'
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
exports.RegisterStaffUseCase = RegisterStaffUseCase;
//# sourceMappingURL=RegisterStaffUseCase.js.map