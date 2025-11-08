import { randomUUID } from "crypto";

export interface PrescriptionProps {
  id: string;
  recordId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  instructions?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
}

export class Prescription {
  private props: PrescriptionProps;

  private constructor(props: PrescriptionProps) {
    this.props = props;
  }

  static create(
    initial: Omit<PrescriptionProps, "id" | "createdAt"> & {
      id?: string;
      createdAt?: Date;
    },
  ) {
    return new Prescription({
      ...initial,
      id: initial.id ?? randomUUID(),
      createdAt: initial.createdAt ?? new Date(),
    });
  }

  toJSON() {
    return this.props;
  }
}
