export interface ClinicalNoteDTO {
  id: string;
  recordId: string;
  authorId: string;
  type: 'soap' | 'progress' | 'discharge';
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicalNoteDTO {
  recordId: string;
  authorId: string;
  type: 'soap' | 'progress' | 'discharge';
  content: Record<string, unknown>;
}
