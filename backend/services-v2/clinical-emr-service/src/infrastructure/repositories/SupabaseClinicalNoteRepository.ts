import { supabaseClient } from "../db/supabase-client";
import { IClinicalNoteRepository } from "../../domain/repositories/IClinicalNoteRepository";
import { ClinicalNoteProps } from "../../domain/entities/ClinicalNote";
import { ApplicationError } from "../../application/errors/ApplicationError";
import { PaginationParams } from "../../shared/types/pagination";
import { getRange } from "../../shared/utils/pagination";

const TABLE = "clinical_notes";

export class SupabaseClinicalNoteRepository implements IClinicalNoteRepository {
  async listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<ClinicalNoteProps[]> {
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

  async save(note: ClinicalNoteProps): Promise<ClinicalNoteProps> {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .insert({
        id: note.id,
        record_id: note.recordId,
        author_id: note.authorId,
        type: note.type,
        content: note.content,
        created_at: note.createdAt.toISOString(),
        updated_at: note.updatedAt.toISOString(),
      })
      .select("*")
      .single();

    if (error) throw new ApplicationError(500, error.message);
    return this.toDomain(data);
  }

  async delete(recordId: string, noteId: string): Promise<void> {
    const { error } = await supabaseClient
      .from(TABLE)
      .delete()
      .eq("id", noteId)
      .eq("record_id", recordId);
    if (error) throw new ApplicationError(500, error.message);
  }

  private toDomain(row: any): ClinicalNoteProps {
    return {
      id: row.id,
      recordId: row.record_id,
      authorId: row.author_id,
      type: row.type,
      content: row.content ?? {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
