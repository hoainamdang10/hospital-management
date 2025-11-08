export interface ImagingStudyDTO {
  id: string;
  recordId: string;
  modality: string;
  bodyRegion?: string;
  findings?: string;
  impression?: string;
  imageUrls?: string[];
  createdAt: string;
}

export interface CreateImagingStudyDTO {
  recordId: string;
  modality: 'xray' | 'ct' | 'mri' | 'ultrasound' | 'other';
  bodyRegion?: string;
  findings?: string;
  impression?: string;
  imageUrls?: string[];
}
