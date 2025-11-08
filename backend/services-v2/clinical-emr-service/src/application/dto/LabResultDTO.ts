export interface LabResultDTO {
  id: string;
  recordId: string;
  testName: string;
  category: string;
  resultValue: string;
  unit?: string;
  referenceRange?: string;
  status: 'pending' | 'completed';
  attachments?: string[];
  createdAt: string;
}

export interface CreateLabResultDTO {
  recordId: string;
  testName: string;
  category: 'hematology' | 'chemistry' | 'immunology' | 'microbiology' | 'other';
  resultValue: string;
  unit?: string;
  referenceRange?: string;
  attachments?: string[];
}
