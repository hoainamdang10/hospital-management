import { randomUUID } from "crypto";

export interface TreatmentTask {
  description: string;
  type: "medication" | "procedure" | "therapy";
  status: "pending" | "in_progress" | "completed";
}

export interface TreatmentPlanProps {
  id: string;
  recordId: string;
  summary: string;
  tasks: TreatmentTask[];
  status: "draft" | "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export class TreatmentPlan {
  private props: TreatmentPlanProps;

  private constructor(props: TreatmentPlanProps) {
    this.props = props;
  }

  static create(
    initial: Omit<TreatmentPlanProps, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ) {
    return new TreatmentPlan({
      ...initial,
      id: initial.id ?? randomUUID(),
      createdAt: initial.createdAt ?? new Date(),
      updatedAt: initial.updatedAt ?? new Date(),
    });
  }

  update(partial: Partial<Omit<TreatmentPlanProps, "id" | "createdAt">>) {
    this.props = {
      ...this.props,
      ...partial,
      updatedAt: new Date(),
    } as TreatmentPlanProps;
  }

  toJSON() {
    return this.props;
  }
}
