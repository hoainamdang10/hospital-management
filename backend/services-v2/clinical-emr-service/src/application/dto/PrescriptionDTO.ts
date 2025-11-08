export interface PrescriptionDTO {
  id: string;
  recordId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  instructions?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface CreatePrescriptionDTO {
  recordId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  instructions?: string;
}
