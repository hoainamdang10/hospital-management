/**
 * Patient Repository Interface - Domain Layer
 * Healthcare repository with HIPAA compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern, HIPAA
 */

import { BaseHealthcareRepository } from '../../../shared/domain/repositories/base-repository.interface';
import { Patient, PatientStatus } from '../aggregates/patient.aggregate';

export interface IPatientRepository extends BaseHealthcareRepository<Patient> {
  // Find methods
  findByNationalId(nationalId: string): Promise<Patient | null>;
  findByPhone(phone: string): Promise<Patient[]>;
  findByEmail(email: string): Promise<Patient | null>;
  findByFullName(fullName: string): Promise<Patient[]>;
  
  // Search methods
  searchPatients(criteria: {
    fullName?: string;
    phone?: string;
    email?: string;
    nationalId?: string;
    status?: PatientStatus;
    registrationDateFrom?: Date;
    registrationDateTo?: Date;
    ageFrom?: number;
    ageTo?: number;
    gender?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    patients: Patient[];
    total: number;
  }>;

  // Statistics methods
  getPatientStatistics(): Promise<{
    totalPatients: number;
    activePatients: number;
    newPatientsThisMonth: number;
    averageAge: number;
    genderDistribution: { male: number; female: number; other: number };
    fhirComplianceAverage: number;
  }>;

  // Compliance methods
  findPatientsWithLowFHIRCompliance(threshold?: number): Promise<Patient[]>;
  findPatientsWithoutInsurance(): Promise<Patient[]>;
  findPatientsWithExpiredInsurance(): Promise<Patient[]>;
}
