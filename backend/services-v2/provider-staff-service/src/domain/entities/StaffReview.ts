/**
 * StaffReview Entity
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Entity } from "@shared/domain/base/entity";
import { safeToISOString } from "../utils/date-utils";

interface StaffReviewProps {
  patientId: string;
  rating: number;
  comment?: string;
  reviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class StaffReview extends Entity<StaffReviewProps> {
  private constructor(props: StaffReviewProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: Omit<StaffReviewProps, "createdAt" | "updatedAt">,
  ): StaffReview {
    const now = new Date();
    return new StaffReview({ ...props, createdAt: now, updatedAt: now });
  }

  public static fromPersistenceData(data: any): StaffReview {
    return new StaffReview(
      {
        patientId: data.patient_id,
        rating: data.rating,
        comment: data.comment,
        reviewDate: new Date(data.review_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      },
      data.id,
    );
  }

  public get patientId(): string {
    return this.props.patientId;
  }

  public get rating(): number {
    return this.props.rating;
  }

  public get comment(): string | undefined {
    return this.props.comment;
  }

  public get reviewDate(): Date {
    return this.props.reviewDate;
  }

  public validate(): void {
    if (this.props.rating < 1 || this.props.rating > 5) {
      throw new Error("Đánh giá phải từ 1 đến 5 sao");
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      patient_id: this.props.patientId,
      rating: this.props.rating,
      comment: this.props.comment,
      review_date: safeToISOString(this.props.reviewDate),
      created_at: safeToISOString(this.props.createdAt),
      updated_at: safeToISOString(this.props.updatedAt),
    };
  }
}
