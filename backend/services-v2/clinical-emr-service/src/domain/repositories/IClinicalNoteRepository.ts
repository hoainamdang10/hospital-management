import { ClinicalNoteProps } from "../entities/ClinicalNote";
import { PaginationParams } from "../../shared/types/pagination";

export interface IClinicalNoteRepository {
  listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<ClinicalNoteProps[]>;
  save(note: ClinicalNoteProps): Promise<ClinicalNoteProps>;
  delete(recordId: string, noteId: string): Promise<void>;
}
