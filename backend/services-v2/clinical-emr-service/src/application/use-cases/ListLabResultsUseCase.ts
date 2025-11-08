import { IUseCase } from "../interfaces/IUseCase";
import { ILabResultRepository } from "../../domain/repositories/ILabResultRepository";
import { LabResultDTO } from "../dto/LabResultDTO";
import { mappers } from "../dto/mappers";
import { PaginationParams } from "../../shared/types/pagination";

export class ListLabResultsUseCase
  implements
    IUseCase<{ recordId: string } & Partial<PaginationParams>, LabResultDTO[]>
{
  constructor(private readonly repository: ILabResultRepository) {}

  async execute(
    request: { recordId: string } & Partial<PaginationParams>,
  ): Promise<LabResultDTO[]> {
    const { page = 1, limit = 20 } = request;
    const data = await this.repository.listByRecord(request.recordId, {
      page,
      limit,
    });
    return data.map((result) => mappers.labResult(result));
  }
}
