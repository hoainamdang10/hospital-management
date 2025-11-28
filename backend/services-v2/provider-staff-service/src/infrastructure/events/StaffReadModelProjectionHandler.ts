import { DomainEvent } from "@shared/domain/base/domain-event";
import { IEventHandler } from "../messaging/SupabaseEventBus";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { IStaffReadModelRepository } from "../repositories/StaffReadModelRepository";
import { ILogger } from "../../application/interfaces/ILogger";
import { StaffId } from "../../domain/value-objects/StaffId";
import {
  normalizeDepartment,
  normalizeSpecialization,
} from "../normalization/staff-profile-normalizer";
import { StaffReadModelCreateProps } from "../../domain/read-models/StaffReadModel";

/**
 * Projection handler: đồng bộ staff_read_model từ domain events
 * - StaffRegistered: tạo bản ghi read model
 * - StaffUpdated: cập nhật tên/khoa/chuyên khoa khi hồ sơ thay đổi
 */
export class StaffReadModelProjectionHandler
  implements IEventHandler<DomainEvent>
{
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly readModelRepository: IStaffReadModelRepository,
    private readonly logger: ILogger,
  ) {}

  getHandlerName(): string {
    return "StaffReadModelProjectionHandler";
  }

  canHandle(event: DomainEvent): boolean {
    return ["StaffRegistered", "StaffUpdated"].includes(event.eventType);
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType === "StaffRegistered") {
      await this.handleStaffRegistered(event);
      return;
    }

    if (event.eventType === "StaffUpdated") {
      await this.handleStaffUpdated(event);
      return;
    }
  }

  private async handleStaffRegistered(event: DomainEvent): Promise<void> {
    const staffIdValue =
      (event as any)?.staffId?.value ||
      (event as any)?.staffId ||
      event.aggregateId;

    if (!staffIdValue) {
      this.logger.warn("StaffRegistered event thiếu staffId", {
        eventId: event.eventId,
      });
      return;
    }

    try {
      const staffId = StaffId.fromString(staffIdValue);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        this.logger.warn("Không tìm thấy staff để tạo read model", {
          staffId: staffIdValue,
          eventId: event.eventId,
        });
        return;
      }

      await this.upsertReadModelFromAggregate(staff);
      this.logger.info("Đã cập nhật read model từ StaffRegistered", {
        staffId: staffIdValue,
      });
    } catch (error) {
      this.logger.error("Lỗi xử lý StaffRegistered cho read model", {
        staffId: staffIdValue,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async handleStaffUpdated(event: DomainEvent): Promise<void> {
    const staffIdValue =
      (event as any)?.staffId?.value ||
      (event as any)?.staffId ||
      event.aggregateId;

    if (!staffIdValue) {
      this.logger.warn("StaffUpdated event thiếu staffId", {
        eventId: event.eventId,
      });
      return;
    }

    try {
      const staffId = StaffId.fromString(staffIdValue);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        this.logger.warn("Không tìm thấy staff để cập nhật read model", {
          staffId: staffIdValue,
          eventId: event.eventId,
        });
        return;
      }

      await this.upsertReadModelFromAggregate(staff);
      this.logger.info("Đã cập nhật read model từ StaffUpdated", {
        staffId: staffIdValue,
        updatedFields: (event as any)?.updatedFields,
      });
    } catch (error) {
      this.logger.error("Lỗi xử lý StaffUpdated cho read model", {
        staffId: staffIdValue,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async upsertReadModelFromAggregate(staff: any): Promise<void> {
    const primarySpecialization =
      staff.specializations?.[0]?.name ||
      staff.professionalInfo?.department ||
      null;
    const normalizedSpecialization = normalizeSpecialization(
      primarySpecialization,
    );

    const normalizedDepartment = normalizeDepartment(
      staff.professionalInfo?.department || null,
      normalizedSpecialization,
    );

    const payload: StaffReadModelCreateProps = {
      staffId: staff.staffIdValue,
      userId: staff.userId,
      fullName: staff.personalInfo?.fullName || staff.personalInfo?.full_name,
      specialization: normalizedSpecialization || undefined,
      department: normalizedDepartment || undefined,
    };

    await this.readModelRepository.upsertProfile(payload);
  }
}
