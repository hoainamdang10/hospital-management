export interface SearchResult {
  resultType: 'medical_record' | 'clinical_note' | 'lab_result' | 'prescription';
  id: string;
  patientId: string;
  title: string;
  content: Record<string, unknown>;
  createdAt: Date;
  relevanceScore: number;
}
