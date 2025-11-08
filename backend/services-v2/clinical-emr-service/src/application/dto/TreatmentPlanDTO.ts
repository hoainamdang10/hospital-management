import { TreatmentTask } from "../../domain/entities/TreatmentPlan";

export interface TreatmentPlanDTO {
  id: string;
  recordId: string;
  summary: string;
  tasks: TreatmentTask[];
  status: "draft" | "active" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentPlanDTO {
  recordId: string;
  summary: string;
  tasks: TreatmentTask[];
}

export interface UpdateTreatmentPlanStatusDTO {
  planId: string;
  recordId: string;
  status: "draft" | "active" | "completed";
}
