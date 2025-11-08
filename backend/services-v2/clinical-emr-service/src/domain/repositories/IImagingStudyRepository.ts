import { ImagingStudyProps } from "../entities/ImagingStudy";
import { PaginationParams } from "../../shared/types/pagination";

export interface IImagingStudyRepository {
  listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<ImagingStudyProps[]>;
  save(study: ImagingStudyProps): Promise<ImagingStudyProps>;
  delete(recordId: string, studyId: string): Promise<void>;
}
