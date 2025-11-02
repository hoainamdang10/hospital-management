/**
 * IClinicalNoteRepository - Domain Layer
 * Repository interface for Clinical Notes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern
 */

import { ClinicalNoteAggregate, ClinicalNoteType, ClinicalNoteStatus } from '../aggregates/ClinicalNote.aggregate';
import { NoteId } from '../value-objects/NoteId';

export interface IClinicalNoteRepository {
  /**
   * Save clinical note (create or update)
   */
  save(clinicalNote: ClinicalNoteAggregate): Promise<void>;

  /**
   * Find clinical note by ID
   */
  findById(noteId: NoteId): Promise<ClinicalNoteAggregate | null>;

  /**
   * Find clinical note by string ID
   */
  findByIdString(noteId: string): Promise<ClinicalNoteAggregate | null>;

  /**
   * Find all clinical notes for a medical record
   */
  findByMedicalRecordId(medicalRecordId: string): Promise<ClinicalNoteAggregate[]>;

  /**
   * Find all clinical notes for a patient
   */
  findByPatientId(patientId: string): Promise<ClinicalNoteAggregate[]>;

  /**
   * Find clinical notes by author (doctor)
   */
  findByAuthorId(authorId: string): Promise<ClinicalNoteAggregate[]>;

  /**
   * Find clinical notes by type
   */
  findByType(noteType: ClinicalNoteType): Promise<ClinicalNoteAggregate[]>;

  /**
   * Find clinical notes by status
   */
  findByStatus(status: ClinicalNoteStatus): Promise<ClinicalNoteAggregate[]>;

  /**
   * Find clinical notes pending cosign
   */
  findPendingCosign(): Promise<ClinicalNoteAggregate[]>;

  /**
   * Find clinical notes pending cosign by author
   */
  findPendingCosignByAuthor(authorId: string): Promise<ClinicalNoteAggregate[]>;

  /**
   * Search clinical notes
   */
  search(criteria: {
    patientId?: string;
    medicalRecordId?: string;
    authorId?: string;
    noteType?: ClinicalNoteType;
    status?: ClinicalNoteStatus;
    startDate?: Date;
    endDate?: Date;
    searchText?: string;
  }): Promise<ClinicalNoteAggregate[]>;

  /**
   * Delete clinical note
   */
  delete(noteId: NoteId): Promise<void>;

  /**
   * Check if clinical note exists
   */
  exists(noteId: NoteId): Promise<boolean>;

  /**
   * Get next sequence number for note ID generation
   */
  getNextSequence(): Promise<number>;
}
