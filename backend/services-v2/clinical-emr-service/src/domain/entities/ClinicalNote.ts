import { randomUUID } from "crypto";

export type ClinicalNoteType = "soap" | "progress" | "discharge";

export interface ClinicalNoteProps {
  id: string;
  recordId: string;
  authorId: string;
  type: ClinicalNoteType;
  content: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ClinicalNote {
  private props: ClinicalNoteProps;

  private constructor(props: ClinicalNoteProps) {
    this.props = props;
  }

  static create(
    initial: Omit<ClinicalNoteProps, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ) {
    return new ClinicalNote({
      ...initial,
      id: initial.id ?? randomUUID(),
      createdAt: initial.createdAt ?? new Date(),
      updatedAt: initial.updatedAt ?? new Date(),
    });
  }

  toJSON() {
    return this.props;
  }
}
