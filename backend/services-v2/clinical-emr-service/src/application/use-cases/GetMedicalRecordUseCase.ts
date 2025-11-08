import { IUseCase } from "../interfaces/IUseCase";
import { IMedicalRecordRepository } from "../../domain/repositories/IMedicalRecordRepository";
import { MedicalRecordDTO } from "../dto/MedicalRecordDTO";
import { mappers } from "../dto/mappers";
import { ApplicationError } from "../errors/ApplicationError";

interface GetMedicalRecordRequest {
  id: string;
  patientId?: string;
}

export class GetMedicalRecordUseCase
  implements IUseCase<GetMedicalRecordRequest, MedicalRecordDTO>
{
  constructor(private readonly repository: IMedicalRecordRepository) {}

  async execute(request: GetMedicalRecordRequest): Promise<MedicalRecordDTO> {
    if (!request.id) {
      throw new ApplicationError(400, "recordId là bắt buộc");
    }

    const data = await this.repository.getById(request.id);
    if (!data) {
      throw new ApplicationError(404, "Không tìm thấy hồ sơ");
    }

    if (request.patientId && data.patientId !== request.patientId) {
      throw new ApplicationError(403, "Bạn không có quyền truy cập hồ sơ này");
    }

    return mappers.medicalRecord(data);
  }
}
