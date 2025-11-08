import { IUseCase } from "../interfaces/IUseCase";
import { IImagingStudyRepository } from "../../domain/repositories/IImagingStudyRepository";

interface DeleteImagingStudyRequest {
  recordId: string;
  studyId: string;
}

export class DeleteImagingStudyUseCase
  implements IUseCase<DeleteImagingStudyRequest, void>
{
  constructor(private readonly repository: IImagingStudyRepository) {}

  async execute({
    recordId,
    studyId,
  }: DeleteImagingStudyRequest): Promise<void> {
    await this.repository.delete(recordId, studyId);
  }
}
