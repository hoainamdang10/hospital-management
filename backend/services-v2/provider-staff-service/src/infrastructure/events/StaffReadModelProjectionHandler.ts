import { DomainEvent } from "@shared/domain/base/domain-event";
import { IEventHandler } from "../messaging/SupabaseEventBus";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { IStaffReadModelRepository } from "../repositories/StaffReadModelRepository";
import { ILogger } from "../../application/interfaces/ILogger";
import { StaffId } from "../../domain/value-objects/StaffId";
import { normalizeDepartment } from "../normalization/staff-profile-normalizer";
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
    const staffIdValue = this.extractStaffId(event);

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
    const staffIdValue = this.extractStaffId(event);

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
    const normalizedDepartment = normalizeDepartment(
      staff.professionalInfo?.department || null,
    );

    const payload: StaffReadModelCreateProps = {
      staffId: staff.staffIdValue,
      userId: staff.userId,
      fullName: staff.personalInfo?.fullName || staff.personalInfo?.full_name,
      department: normalizedDepartment || undefined,
    };

    await this.readModelRepository.upsertProfile(payload);
  }

  /**
   * Extract staffId string from domain event payload (handles serialized value objects)
   */
  private extractStaffId(event: DomainEvent): string | null {
    const rawStaffId = (event as any)?.staffId;

    if (typeof rawStaffId === "string" && rawStaffId.trim().length > 0) {
      return rawStaffId;
    }

    if (
      rawStaffId &&
      typeof rawStaffId === "object" &&
      typeof rawStaffId.value === "string"
    ) {
      return rawStaffId.value;
    }

    if (
      rawStaffId &&
      typeof rawStaffId === "object" &&
      rawStaffId.props &&
      typeof rawStaffId.props.value === "string"
    ) {
      return rawStaffId.props.value;
    }

    if (typeof event.aggregateId === "string") {
      return event.aggregateId;
    }

    return null;
  }
}
