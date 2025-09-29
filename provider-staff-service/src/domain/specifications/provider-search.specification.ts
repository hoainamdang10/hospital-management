/**
 * Provider Search Specification Pattern - Domain Layer
 * Specification pattern for complex provider search criteria
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Specification Pattern, Healthcare Provider Search
 */

import { Specialization } from '../value-objects/medical-credentials';
import { ProviderType } from '../strategies/provider-type.strategy';
import { MedicalDepartment } from '../value-objects/doctor-id';

/**
 * Abstract Specification
 */
export abstract class Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;
  
  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }
  
  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }
  
  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

/**
 * Composite Specifications
 */
class AndSpecification<T> extends Specification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<T> extends Specification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification<T> extends Specification<T> {
  constructor(private spec: Specification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}

/**
 * Provider Search Candidate Interface
 */
export interface ProviderSearchCandidate {
  id: string;
  fullName: string;
  providerType: ProviderType;
  department: MedicalDepartment;
  specializations: Specialization[];
  yearsOfExperience: number;
  isLicenseValid: boolean;
  isAvailable: boolean;
  competencyScore: number;
  canWorkNightShifts: boolean;
  canWorkWeekends: boolean;
  canPerformSurgery: boolean;
  canTreatPediatric: boolean;
  canWorkInEmergency: boolean;
  maxPatientsPerShift: number;
  currentPatientLoad: number;
  lastWorkDate?: Date;
  vacationDaysRemaining: number;
  isOnVacation: boolean;
  emergencyContactAvailable: boolean;
}

/**
 * Provider Type Specification
 */
export class ProviderTypeSpecification extends Specification<ProviderSearchCandidate> {
  constructor(private providerType: ProviderType) {
    super();
  }

  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.providerType === this.providerType;
  }
}

/**
 * Department Specification
 */
export class DepartmentSpecification extends Specification<ProviderSearchCandidate> {
  constructor(private department: MedicalDepartment) {
    super();
  }

  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.department === this.department;
  }
}

/**
 * Specialization Specification
 */
export class SpecializationSpecification extends Specification<ProviderSearchCandidate> {
  constructor(private specialization: Specialization) {
    super();
  }

  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.specializations.includes(this.specialization);
  }
}

/**
 * Multiple Specializations Specification
 */
export class HasAnySpecializationSpecification extends Specification<ProviderSearchCandidate> {
  constructor(private specializations: Specialization[]) {
    super();
  }

  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return this.specializations.some(spec => candidate.specializations.includes(spec));
  }
}

/**
 * Experience Level Specification
 */
export class ExperienceRangeSpecification extends Specification<ProviderSearchCandidate> {
  constructor(
    private minYears: number,
    private maxYears?: number
  ) {
    super();
  }

  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    const experience = candidate.yearsOfExperience;
    const meetsMinimum = experience >= this.minYears;
    const meetsMaximum = this.maxYears === undefined || experience <= this.maxYears;
    
    return meetsMinimum && meetsMaximum;
  }
}

/**
 * Senior Provider Specification (>= 10 years experience)
 */
export class SeniorProviderSpecification extends Specification<ProviderSearchCandidate> {
  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.yearsOfExperience >= 10;
  }
}

/**
 * Junior Provider Specification (< 5 years experience)
 */
export class JuniorProviderSpecification extends Specification<ProviderSearchCandidate> {
  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.yearsOfExperience < 5;
  }
}

/**
 * Available Provider Specification
 */
export class AvailableProviderSpecification extends Specification<ProviderSearchCandidate> {
  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.isAvailable && 
           candidate.isLicenseValid && 
           !candidate.isOnVacation;
  }
}

/**
 * Competency Score Specification
 */
export class CompetencyScoreSpecification extends Specification<ProviderSearchCandidate> {
  constructor(private minScore: number) {
    super();
  }

  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.competencyScore >= this.minScore;
  }
}

/**
 * Night Shift Capable Specification
 */
export class NightShiftCapableSpecification extends Specification<ProviderSearchCandidate> {
  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.canWorkNightShifts;
  }
}

/**
 * Weekend Available Specification
 */
export class WeekendAvailableSpecification extends Specification<ProviderSearchCandidate> {
  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.canWorkWeekends;
  }
}

/**
 * Surgery Capable Specification
 */
export class SurgeryCapableSpecification extends Specification<ProviderSearchCandidate> {
  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.canPerformSurgery;
  }
}

/**
 * Pediatric Care Capable Specification
 */
export class PediatricCareCapableSpecification extends Specification<ProviderSearchCandidate> {
  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.canTreatPediatric;
  }
}

/**
 * Emergency Care Capable Specification
 */
export class EmergencyCareCapableSpecification extends Specification<ProviderSearchCandidate> {
  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.canWorkInEmergency;
  }
}

/**
 * Workload Capacity Specification
 */
export class WorkloadCapacitySpecification extends Specification<ProviderSearchCandidate> {
  constructor(private requiredCapacity: number) {
    super();
  }

  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    const availableCapacity = candidate.maxPatientsPerShift - candidate.currentPatientLoad;
    return availableCapacity >= this.requiredCapacity;
  }
}

/**
 * Recently Active Specification
 */
export class RecentlyActiveSpecification extends Specification<ProviderSearchCandidate> {
  constructor(private maxDaysInactive: number = 30) {
    super();
  }

  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    if (!candidate.lastWorkDate) {
      return false;
    }

    const daysSinceLastWork = Math.floor(
      (new Date().getTime() - candidate.lastWorkDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLastWork <= this.maxDaysInactive;
  }
}

/**
 * Emergency Contact Available Specification
 */
export class EmergencyContactAvailableSpecification extends Specification<ProviderSearchCandidate> {
  isSatisfiedBy(candidate: ProviderSearchCandidate): boolean {
    return candidate.emergencyContactAvailable;
  }
}

/**
 * Complex Provider Search Specifications Builder
 */
export class ProviderSearchSpecificationBuilder {
  private specifications: Specification<ProviderSearchCandidate>[] = [];

  /**
   * Add provider type filter
   */
  ofType(providerType: ProviderType): ProviderSearchSpecificationBuilder {
    this.specifications.push(new ProviderTypeSpecification(providerType));
    return this;
  }

  /**
   * Add department filter
   */
  inDepartment(department: MedicalDepartment): ProviderSearchSpecificationBuilder {
    this.specifications.push(new DepartmentSpecification(department));
    return this;
  }

  /**
   * Add specialization filter
   */
  withSpecialization(specialization: Specialization): ProviderSearchSpecificationBuilder {
    this.specifications.push(new SpecializationSpecification(specialization));
    return this;
  }

  /**
   * Add multiple specializations filter (OR logic)
   */
  withAnySpecialization(specializations: Specialization[]): ProviderSearchSpecificationBuilder {
    this.specifications.push(new HasAnySpecializationSpecification(specializations));
    return this;
  }

  /**
   * Add experience range filter
   */
  withExperience(minYears: number, maxYears?: number): ProviderSearchSpecificationBuilder {
    this.specifications.push(new ExperienceRangeSpecification(minYears, maxYears));
    return this;
  }

  /**
   * Add senior provider filter
   */
  seniorProvidersOnly(): ProviderSearchSpecificationBuilder {
    this.specifications.push(new SeniorProviderSpecification());
    return this;
  }

  /**
   * Add junior provider filter
   */
  juniorProvidersOnly(): ProviderSearchSpecificationBuilder {
    this.specifications.push(new JuniorProviderSpecification());
    return this;
  }

  /**
   * Add availability filter
   */
  availableOnly(): ProviderSearchSpecificationBuilder {
    this.specifications.push(new AvailableProviderSpecification());
    return this;
  }

  /**
   * Add competency score filter
   */
  withMinCompetencyScore(minScore: number): ProviderSearchSpecificationBuilder {
    this.specifications.push(new CompetencyScoreSpecification(minScore));
    return this;
  }

  /**
   * Add night shift capability filter
   */
  nightShiftCapable(): ProviderSearchSpecificationBuilder {
    this.specifications.push(new NightShiftCapableSpecification());
    return this;
  }

  /**
   * Add weekend availability filter
   */
  weekendAvailable(): ProviderSearchSpecificationBuilder {
    this.specifications.push(new WeekendAvailableSpecification());
    return this;
  }

  /**
   * Add surgery capability filter
   */
  surgeryCapable(): ProviderSearchSpecificationBuilder {
    this.specifications.push(new SurgeryCapableSpecification());
    return this;
  }

  /**
   * Add pediatric care capability filter
   */
  pediatricCareCapable(): ProviderSearchSpecificationBuilder {
    this.specifications.push(new PediatricCareCapableSpecification());
    return this;
  }

  /**
   * Add emergency care capability filter
   */
  emergencyCareCapable(): ProviderSearchSpecificationBuilder {
    this.specifications.push(new EmergencyCareCapableSpecification());
    return this;
  }

  /**
   * Add workload capacity filter
   */
  withCapacityFor(requiredCapacity: number): ProviderSearchSpecificationBuilder {
    this.specifications.push(new WorkloadCapacitySpecification(requiredCapacity));
    return this;
  }

  /**
   * Add recently active filter
   */
  recentlyActive(maxDaysInactive: number = 30): ProviderSearchSpecificationBuilder {
    this.specifications.push(new RecentlyActiveSpecification(maxDaysInactive));
    return this;
  }

  /**
   * Add emergency contact available filter
   */
  withEmergencyContact(): ProviderSearchSpecificationBuilder {
    this.specifications.push(new EmergencyContactAvailableSpecification());
    return this;
  }

  /**
   * Build the final specification
   */
  build(): Specification<ProviderSearchCandidate> {
    if (this.specifications.length === 0) {
      throw new Error('Phải có ít nhất một tiêu chí tìm kiếm');
    }

    // Combine all specifications with AND logic
    return this.specifications.reduce((combined, spec) => 
      combined ? combined.and(spec) : spec
    );
  }

  /**
   * Build with OR logic for multiple criteria
   */
  buildWithOr(): Specification<ProviderSearchCandidate> {
    if (this.specifications.length === 0) {
      throw new Error('Phải có ít nhất một tiêu chí tìm kiếm');
    }

    // Combine all specifications with OR logic
    return this.specifications.reduce((combined, spec) => 
      combined ? combined.or(spec) : spec
    );
  }

  /**
   * Reset builder
   */
  reset(): ProviderSearchSpecificationBuilder {
    this.specifications = [];
    return this;
  }
}

/**
 * Predefined Complex Search Specifications
 */
export class PredefinedProviderSearches {
  /**
   * Find emergency doctors available for night shifts
   */
  static emergencyNightShiftDoctors(): Specification<ProviderSearchCandidate> {
    return new ProviderSearchSpecificationBuilder()
      .ofType(ProviderType.DOCTOR)
      .inDepartment(MedicalDepartment.EMERGENCY)
      .availableOnly()
      .nightShiftCapable()
      .emergencyCareCapable()
      .withMinCompetencyScore(70)
      .build();
  }

  /**
   * Find senior surgeons for complex operations
   */
  static seniorSurgeons(): Specification<ProviderSearchCandidate> {
    return new ProviderSearchSpecificationBuilder()
      .ofType(ProviderType.DOCTOR)
      .withAnySpecialization([
        Specialization.SURGERY,
        Specialization.CARDIOLOGY,
        Specialization.NEUROLOGY,
        Specialization.ORTHOPEDICS
      ])
      .seniorProvidersOnly()
      .surgeryCapable()
      .availableOnly()
      .withMinCompetencyScore(80)
      .build();
  }

  /**
   * Find pediatric care providers
   */
  static pediatricCareProviders(): Specification<ProviderSearchCandidate> {
    return new ProviderSearchSpecificationBuilder()
      .withSpecialization(Specialization.PEDIATRICS)
      .pediatricCareCapable()
      .availableOnly()
      .withMinCompetencyScore(60)
      .build();
  }

  /**
   * Find weekend coverage staff
   */
  static weekendCoverageStaff(): Specification<ProviderSearchCandidate> {
    return new ProviderSearchSpecificationBuilder()
      .availableOnly()
      .weekendAvailable()
      .withCapacityFor(1)
      .recentlyActive(14)
      .build();
  }

  /**
   * Find backup providers for emergencies
   */
  static emergencyBackupProviders(): Specification<ProviderSearchCandidate> {
    return new ProviderSearchSpecificationBuilder()
      .availableOnly()
      .emergencyCareCapable()
      .withEmergencyContact()
      .withMinCompetencyScore(65)
      .recentlyActive(7)
      .build();
  }
}
