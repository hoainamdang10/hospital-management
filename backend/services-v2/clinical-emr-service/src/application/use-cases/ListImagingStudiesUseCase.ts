import { IUseCase } from "../interfaces/IUseCase";
import { IImagingStudyRepository } from "../../domain/repositories/IImagingStudyRepository";
import { ImagingStudyDTO } from "../dto/ImagingStudyDTO";
import { mappers } from "../dto/mappers";
import { PaginationParams } from "../../shared/types/pagination";

export class ListImagingStudiesUseCase
  implements
    IUseCase<
      { recordId: string } & Partial<PaginationParams>,
      ImagingStudyDTO[]
    >
{
  constructor(private readonly repository: IImagingStudyRepository) {}

  async execute(
    request: { recordId: string } & Partial<PaginationParams>,
  ): Promise<ImagingStudyDTO[]> {
    const { page = 1, limit = 20 } = request;
    const data = await this.repository.listByRecord(request.recordId, {
      page,
      limit,
    });
    return data.map((study) => mappers.imagingStudy(study));
  }
}
