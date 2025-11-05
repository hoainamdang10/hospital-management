/**
 * PatientIdFactory - Infrastructure Layer
 * Generates unique patient IDs using database sequence
 * Prevents ID collisions under high load
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '@shared/application/services/logger.interface';

/**
 * Factory for generating unique patient IDs
 * Uses database sequence to ensure no collisions
 */
export class PatientIdFactory {
  constructor(
    private supabaseClient: SupabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Generate next patient ID using database sequence
   * Format: PAT-YYYYMM-XXX
   * 
   * Uses database sequence to ensure uniqueness even under high concurrency
   */
  async generateNextPatientId(): Promise<PatientId> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const yearMonth = `${year}${month}`;

      // Call database function to get next sequence number
      const { data, error } = await this.supabaseClient.rpc(
        'get_next_patient_sequence',
        { year_month: yearMonth }
      );

      if (error) {
        this.logger.error('Failed to get next patient sequence', {
          error: error.message,
          yearMonth
        });
        throw new Error(`Failed to generate patient ID: ${error.message}`);
      }

      const sequence = data as number;
      const sequenceStr = sequence.toString().padStart(3, '0');
      const patientIdValue = `PAT-${yearMonth}-${sequenceStr}`;

      this.logger.debug('Generated patient ID', {
        patientId: patientIdValue,
        sequence,
        yearMonth
      });

      return PatientId.create(patientIdValue);
    } catch (error) {
      this.logger.error('Error generating patient ID', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate patient ID from existing value (for validation/parsing)
   */
  static fromString(value: string): PatientId {
    return PatientId.create(value);
  }

  /**
   * Generate patient ID with fallback to random if sequence fails
   * Used for resilience - if database is down, still generate valid ID
   */
  async generateWithFallback(): Promise<PatientId> {
    try {
      return await this.generateNextPatientId();
    } catch (error) {
      this.logger.warn('Falling back to random patient ID generation', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback: generate with random sequence (less ideal but still valid)
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const sequence = Math.floor(Math.random() * 999) + 1;
      const sequenceStr = sequence.toString().padStart(3, '0');
      
      const patientIdValue = `PAT-${year}${month}-${sequenceStr}`;
      return PatientId.create(patientIdValue);
    }
  }
}
