import { randomUUID } from "crypto";

export interface LabResultProps {
  id: string;
  recordId: string;
  testName: string;
  category:
    | "hematology"
    | "chemistry"
    | "immunology"
    | "microbiology"
    | "other";
  resultValue: string;
  unit?: string;
  referenceRange?: string;
  status: "pending" | "completed";
  attachments?: string[];
  createdAt: Date;
}

export class LabResult {
  private props: LabResultProps;

  private constructor(props: LabResultProps) {
    this.props = props;
  }

  static create(
    initial: Omit<LabResultProps, "id" | "createdAt"> & {
      id?: string;
      createdAt?: Date;
    },
  ) {
    return new LabResult({
      ...initial,
      id: initial.id ?? randomUUID(),
      createdAt: initial.createdAt ?? new Date(),
    });
  }

  toJSON() {
    return this.props;
  }
}
