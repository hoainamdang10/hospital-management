import { randomUUID } from "crypto";

export type VitalSignsSnapshot = {
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  systolic?: number;
  diastolic?: number;
  spo2?: number;
};

export type DiagnosisInfo = {
  primary: string;
  secondary?: string[];
};

export type MedicalRecordStatus = "draft" | "final" | "archived";

export interface MedicalRecordProps {
  id: string;
  patientId: string;
  doctorId: string;
  encounterType: "inpatient" | "outpatient";
  encounterDate: Date;
  diagnosis: DiagnosisInfo;
  treatmentSummary?: string;
  vitalSigns?: VitalSignsSnapshot;
  status: MedicalRecordStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class MedicalRecord {
  private props: MedicalRecordProps;

  private constructor(props: MedicalRecordProps) {
    this.props = props;
  }

  static create(
    initial: Omit<MedicalRecordProps, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ) {
    return new MedicalRecord({
      ...initial,
      id: initial.id ?? randomUUID(),
      createdAt: initial.createdAt ?? new Date(),
      updatedAt: initial.updatedAt ?? new Date(),
    });
  }

  update(partial: Partial<Omit<MedicalRecordProps, "id" | "createdAt">>) {
    this.props = {
      ...this.props,
      ...partial,
      updatedAt: new Date(),
    } as MedicalRecordProps;
  }

  toJSON() {
    return this.props;
  }
}
