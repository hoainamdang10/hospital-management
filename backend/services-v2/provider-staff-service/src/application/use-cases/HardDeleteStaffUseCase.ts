/**
 * Hard Delete Staff Use Case
 * Permanently deletes staff from database
 * 
 * WARNING: This action cannot be undone!
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import {
    BaseHealthcareUseCase,
    ValidationResult,
} from "@shared/application/base/base-healthcare-use-case";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { ILogger } from "../interfaces/ILogger";
import { StaffId } from "../../domain/value-objects/StaffId";

export interface HardDeleteStaffRequest {
    staffId: string;
    confirmPhrase: string; // Must be "DELETE" to confirm
    requestedBy: string;
    requestedByRole: string;
    requestMetadata?: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    };
}

export interface HardDeleteStaffResponse {
    success: boolean;
    staffId: string;
    deletedAt: Date;
    message: string;
}

export class HardDeleteStaffUseCase extends BaseHealthcareUseCase<
    HardDeleteStaffRequest,
    HardDeleteStaffResponse
> {
    constructor(
        private readonly staffRepository: IProviderStaffRepository,
        private readonly logger: ILogger,
    ) {
        super();
    }

    /**
     * Validate request
     */
    protected override async validateRequest(
        request: HardDeleteStaffRequest,
    ): Promise<ValidationResult> {
        const errors: string[] = [];

        // Validate staffId
        if (!request.staffId || request.staffId.trim().length === 0) {
            errors.push("ID nhân viên không được để trống");
        } else if (!request.staffId.match(/^[A-Z]+-[A-Z]+-\d{6}-\d{2,3}$/)) {
            errors.push("ID nhân viên không hợp lệ");
        }

        // Validate confirmation phrase
        if (request.confirmPhrase !== "DELETE") {
            errors.push("Vui lòng nhập 'DELETE' để xác nhận xóa vĩnh viễn");
        }

        // Validate requestedBy
        if (!request.requestedBy || request.requestedBy.trim().length === 0) {
            errors.push("Người yêu cầu không được để trống");
        }

        // Validate requestedByRole - only admin can hard delete
        if (!request.requestedByRole || request.requestedByRole.trim().length === 0) {
            errors.push("Vai trò người yêu cầu không được để trống");
        } else if (request.requestedByRole.toLowerCase() !== "admin") {
            errors.push("Chỉ quản trị viên mới có thể xóa vĩnh viễn nhân viên");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    protected async executeImpl(
        request: HardDeleteStaffRequest,
    ): Promise<HardDeleteStaffResponse> {
        const { staffId, requestedBy, requestedByRole } = request;

        // Validate request
        const validation = await this.validateRequest(request);
        if (!validation.isValid) {
            throw new Error(validation.errors?.[0] || "Validation failed");
        }

        // Parse staffId
        const parsedStaffId = StaffId.fromString(staffId);

        // Get staff by ID to verify it exists
        const staff = await this.staffRepository.findById(parsedStaffId);
        if (!staff) {
            throw new Error("Không tìm thấy nhân viên");
        }

        // Log the critical action
        this.logger.warn("HARD DELETE INITIATED", {
            staffId: staff.staffIdValue,
            staffName: staff.personalInfo.fullName,
            staffType: staff.staffType,
            requestedBy,
            requestedByRole,
            timestamp: new Date().toISOString(),
            warning: "PERMANENT_DATA_REMOVAL",
            metadata: request.requestMetadata,
        });

        // Perform hard delete
        await this.staffRepository.hardDelete(parsedStaffId);

        // Log completion
        this.logger.warn("HARD DELETE COMPLETED", {
            staffId: staff.staffIdValue,
            staffName: staff.personalInfo.fullName,
            deletedBy: requestedBy,
            deletedAt: new Date().toISOString(),
        });

        return {
            success: true,
            staffId: staff.staffIdValue,
            deletedAt: new Date(),
            message: `Nhan vien ${staff.personalInfo.fullName} da duoc xoa vinh vien khoi he thong`,
        };
    }
}
