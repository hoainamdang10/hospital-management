/**
 * SupabaseMedicalImagingRepository - Infrastructure Layer
 * Supabase implementation of IMedicalImagingRepository
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern
 */

import { injectable, inject } from 'inversify';
import { SupabaseClient } from '@supabase/supabase-js';
import { TYPES } from '../di/types';
import { 
  IMedicalImagingRepository, 
  MedicalImagingFilterCriteria 
} from '../../domain/repositories/IMedicalImagingRepository';
import { 
  MedicalImaging, 
  MedicalImagingProps,
  ImagingType,
  ImagingModality,
  ImagingStatus,
  ImagingPriority
} from '../../domain/aggregates/MedicalImaging.aggregate';
import { MedicalImagingId } from '../../domain/value-objects/MedicalImagingId';
import { logger } from '@shared/infrastructure/logging/logger';

@injectable()
export class SupabaseMedicalImagingRepository implements IMedicalImagingRepository {
  constructor(
    @inject(TYPES.SupabaseClient) private readonly supabase: SupabaseClient
  ) {}

  async save(imaging: MedicalImaging): Promise<void> {
    try {
      const data = this.toDatabase(imaging);
      const { error } = await this.supabase
        .from('medical_imaging')
        .insert(data);

      if (error) {
        throw new Error(`Failed to save medical imaging: ${error.message}`);
      }
    } catch (error: any) {
      logger.error('Error saving medical imaging', { error: error.message });
      throw error;
    }
  }

  async update(imaging: MedicalImaging): Promise<void> {
    try {
      const data = this.toDatabase(imaging);
      const { error } = await this.supabase
        .from('medical_imaging')
        .update(data)
        .eq('imaging_id', imaging.imagingId.value);

      if (error) {
        throw new Error(`Failed to update medical imaging: ${error.message}`);
      }
    } catch (error: any) {
      logger.error('Error updating medical imaging', { error: error.message });
      throw error;
    }
  }

  async findById(imagingId: string): Promise<MedicalImaging | null> {
    try {
      const { data, error } = await this.supabase
        .from('medical_imaging')
        .select('*')
        .eq('imaging_id', imagingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find medical imaging: ${error.message}`);
      }

      return data ? this.toDomain(data) : null;
    } catch (error: any) {
      logger.error('Error finding medical imaging by ID', { error: error.message });
      throw error;
    }
  }

  async findByPatientId(patientId: string, limit = 50, offset = 0): Promise<MedicalImaging[]> {
    try {
      const { data, error } = await this.supabase
        .from('medical_imaging')
        .select('*')
        .eq('patient_id', patientId)
        .order('study_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to find medical imaging by patient: ${error.message}`);
      }

      return data ? data.map(record => this.toDomain(record)) : [];
    } catch (error: any) {
      logger.error('Error finding medical imaging by patient', { error: error.message });
      throw error;
    }
  }

  async findByMedicalRecordId(medicalRecordId: string): Promise<MedicalImaging[]> {
    try {
      const { data, error } = await this.supabase
        .from('medical_imaging')
        .select('*')
        .eq('record_id', medicalRecordId)
        .order('study_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to find medical imaging by record: ${error.message}`);
      }

      return data ? data.map(record => this.toDomain(record)) : [];
    } catch (error: any) {
      logger.error('Error finding medical imaging by record', { error: error.message });
      throw error;
    }
  }

  async findWithFilters(
    criteria: MedicalImagingFilterCriteria,
    limit = 50,
    offset = 0
  ): Promise<MedicalImaging[]> {
    try {
      let query = this.supabase.from('medical_imaging').select('*');

      if (criteria.patientId) {
        query = query.eq('patient_id', criteria.patientId);
      }

      if (criteria.medicalRecordId) {
        query = query.eq('record_id', criteria.medicalRecordId);
      }

      if (criteria.imagingType) {
        query = query.eq('imaging_type', criteria.imagingType);
      }

      if (criteria.modality) {
        query = query.eq('modality', criteria.modality);
      }

  async count(criteria: MedicalImagingFilterCriteria): Promise<number> {
    try {
      let query = this.supabase.from('medical_imaging').select('*', { count: 'exact', head: true });

      if (criteria.patientId) {
        query = query.eq('patient_id', criteria.patientId);
      }

      if (criteria.medicalRecordId) {
        query = query.eq('record_id', criteria.medicalRecordId);
      }

      if (criteria.imagingType) {
        query = query.eq('imaging_type', criteria.imagingType);
      }

      if (criteria.modality) {
        query = query.eq('modality', criteria.modality);
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.radiologistId) {
        query = query.eq('radiologist_id', criteria.radiologistId);
      }

      if (criteria.fromDate) {
        query = query.gte('study_date', criteria.fromDate.toISOString());
      }

      if (criteria.toDate) {
        query = query.lte('study_date', criteria.toDate.toISOString());
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count medical imaging: ${error.message}`);
      }

      return count || 0;
    } catch (error: any) {
      logger.error('Error counting medical imaging', { error: error.message });
      throw error;
    }
  }

  async delete(imagingId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('medical_imaging')
        .delete()
        .eq('imaging_id', imagingId);

      if (error) {
        throw new Error(`Failed to delete medical imaging: ${error.message}`);
      }
    } catch (error: any) {
      logger.error('Error deleting medical imaging', { error: error.message });
      throw error;
    }
  }

  async exists(imagingId: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('medical_imaging')
        .select('*', { count: 'exact', head: true })
        .eq('imaging_id', imagingId);

      if (error) {
        throw new Error(`Failed to check medical imaging existence: ${error.message}`);
      }

      return (count || 0) > 0;
    } catch (error: any) {
      logger.error('Error checking medical imaging existence', { error: error.message });
      throw error;
    }
  }

  private toDomain(record: any): MedicalImaging {
    return MedicalImaging.reconstitute({
      imagingId: MedicalImagingId.fromString(record.imaging_id),
      medicalRecordId: record.record_id,
      patientId: record.patient_id,
      imagingType: record.imaging_type as ImagingType,
      modality: record.modality as ImagingModality,
      bodyPart: record.body_part,
      laterality: record.laterality,
      studyDate: new Date(record.study_date),
      studyDescription: record.study_description,
      clinicalIndication: record.clinical_indication,
      orderedBy: record.ordered_by,
      orderedAt: new Date(record.ordered_at),
      priority: record.priority as ImagingPriority,
      findings: record.findings,
      impression: record.impression,
      radiologistId: record.radiologist_id,
      reportedAt: record.reported_at ? new Date(record.reported_at) : undefined,
      verifiedBy: record.verified_by,
      verifiedAt: record.verified_at ? new Date(record.verified_at) : undefined,
      imageUrls: record.image_urls,
      dicomStudyUid: record.dicom_study_uid,
      seriesCount: record.series_count,
      instanceCount: record.instance_count,
      status: record.status as ImagingStatus,
      technique: record.technique,
      contrastUsed: record.contrast_used,
      contrastType: record.contrast_type,
      radiationDose: record.radiation_dose,
      notes: record.notes,
      createdBy: record.created_by,
      createdAt: new Date(record.created_at),
      updatedBy: record.updated_by,
      updatedAt: new Date(record.updated_at),
    }, record.imaging_id);
  }

  private toDatabase(imaging: MedicalImaging): any {
    const props = (imaging as any).props;
    return {
      imaging_id: props.imagingId.value,
      record_id: props.medicalRecordId,
      patient_id: props.patientId,
      imaging_type: props.imagingType,
      modality: props.modality,
      body_part: props.bodyPart,
      laterality: props.laterality,
      study_date: props.studyDate.toISOString(),
      study_description: props.studyDescription,
      clinical_indication: props.clinicalIndication,
      ordered_by: props.orderedBy,
      ordered_at: props.orderedAt.toISOString(),
      priority: props.priority,
      findings: props.findings,
      impression: props.impression,
      radiologist_id: props.radiologistId,
      reported_at: props.reportedAt?.toISOString(),
      verified_by: props.verifiedBy,
      verified_at: props.verifiedAt?.toISOString(),
      image_urls: props.imageUrls,
      dicom_study_uid: props.dicomStudyUid,
      series_count: props.seriesCount,
      instance_count: props.instanceCount,
      status: props.status,
      technique: props.technique,
      contrast_used: props.contrastUsed,
      contrast_type: props.contrastType,
      radiation_dose: props.radiationDose,
      notes: props.notes,
      created_by: props.createdBy,
      created_at: props.createdAt.toISOString(),
      updated_by: props.updatedBy,
      updated_at: props.updatedAt.toISOString(),
    };
  }
}

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.radiologistId) {
        query = query.eq('radiologist_id', criteria.radiologistId);
      }

      if (criteria.fromDate) {
        query = query.gte('study_date', criteria.fromDate.toISOString());
      }

      if (criteria.toDate) {
        query = query.lte('study_date', criteria.toDate.toISOString());
      }

      const { data, error } = await query
        .order('study_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to find medical imaging with filters: ${error.message}`);
      }

      return data ? data.map(record => this.toDomain(record)) : [];
    } catch (error: any) {
      logger.error('Error finding medical imaging with filters', { error: error.message });
      throw error;
    }
  }

