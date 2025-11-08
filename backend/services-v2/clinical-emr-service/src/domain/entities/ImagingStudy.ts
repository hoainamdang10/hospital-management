import { randomUUID } from "crypto";

export interface ImagingStudyProps {
  id: string;
  recordId: string;
  modality: "xray" | "ct" | "mri" | "ultrasound" | "other";
  bodyRegion?: string;
  findings?: string;
  impression?: string;
  imageUrls?: string[];
  createdAt: Date;
}

export class ImagingStudy {
  private props: ImagingStudyProps;

  private constructor(props: ImagingStudyProps) {
    this.props = props;
  }

  static create(
    initial: Omit<ImagingStudyProps, "id" | "createdAt"> & {
      id?: string;
      createdAt?: Date;
    },
  ) {
    return new ImagingStudy({
      ...initial,
      id: initial.id ?? randomUUID(),
      createdAt: initial.createdAt ?? new Date(),
    });
  }

  toJSON() {
    return this.props;
  }
}
