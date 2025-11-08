import { IUseCase } from "../interfaces/IUseCase";
import { IClinicalNoteRepository } from "../../domain/repositories/IClinicalNoteRepository";
import { ClinicalNoteDTO } from "../dto/ClinicalNoteDTO";
import { mappers } from "../dto/mappers";
import { PaginationParams } from "../../shared/types/pagination";

export class ListClinicalNotesUseCase
  implements
    IUseCase<
      { recordId: string } & Partial<PaginationParams>,
      ClinicalNoteDTO[]
    >
{
  constructor(private readonly repository: IClinicalNoteRepository) {}

  async execute(
    request: { recordId: string } & Partial<PaginationParams>,
  ): Promise<ClinicalNoteDTO[]> {
    const { page = 1, limit = 20 } = request;
    const notes = await this.repository.listByRecord(request.recordId, {
      page,
      limit,
    });
    return notes.map((n) => mappers.clinicalNote(n));
  }
}
