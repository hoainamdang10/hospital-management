import { supabaseClient } from "../db/supabase-client";
import { IImagingStudyRepository } from "../../domain/repositories/IImagingStudyRepository";
import { ImagingStudyProps } from "../../domain/entities/ImagingStudy";
import { ApplicationError } from "../../application/errors/ApplicationError";
import { PaginationParams } from "../../shared/types/pagination";
import { getRange } from "../../shared/utils/pagination";

const TABLE = "imaging_studies";

export class SupabaseImagingStudyRepository implements IImagingStudyRepository {
  async listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<ImagingStudyProps[]> {
    const { from, to } = getRange(pagination);
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select("*")
      .eq("record_id", recordId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new ApplicationError(500, error.message);
    return (data ?? []).map(this.toDomain);
  }

  async save(study: ImagingStudyProps): Promise<ImagingStudyProps> {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .insert({
        id: study.id,
        record_id: study.recordId,
        modality: study.modality,
        body_region: study.bodyRegion,
        findings: study.findings,
        impression: study.impression,
        image_urls: study.imageUrls,
        created_at: study.createdAt.toISOString(),
      })
      .select("*")
      .single();

    if (error) throw new ApplicationError(500, error.message);
    return this.toDomain(data);
  }

  async delete(recordId: string, studyId: string): Promise<void> {
    const { error } = await supabaseClient
      .from(TABLE)
      .delete()
      .eq("id", studyId)
      .eq("record_id", recordId);
    if (error) throw new ApplicationError(500, error.message);
  }

  private toDomain(row: any): ImagingStudyProps {
    return {
      id: row.id,
      recordId: row.record_id,
      modality: row.modality,
      bodyRegion: row.body_region ?? undefined,
      findings: row.findings ?? undefined,
      impression: row.impression ?? undefined,
      imageUrls: row.image_urls ?? undefined,
      createdAt: new Date(row.created_at),
    };
  }
}
