/**
 * StaffReadModelRepository - CQRS Read Model Repository
 * Provider/Staff Service V2
 *
 * Repository for staff read model with denormalized rating data
 * Optimized for query performance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  StaffReadModel,
  StaffReadModelCreateProps,
  StaffReadModelUpdateProps,
  RatingDistribution,
} from "../../domain/read-models/StaffReadModel";
import { ILogger } from "../../application/interfaces/ILogger";

export interface IStaffReadModelRepository {
  findById(staffId: string): Promise<StaffReadModel | null>;
  findAll(limit?: number, offset?: number): Promise<StaffReadModel[]>;
  findByDepartment(department: string): Promise<StaffReadModel[]>;
  findTopRated(limit?: number): Promise<StaffReadModel[]>;
  upsertProfile(props: StaffReadModelCreateProps): Promise<void>;
  create(props: StaffReadModelCreateProps): Promise<void>;
  updateRating(
    staffId: string,
    props: StaffReadModelUpdateProps,
  ): Promise<void>;
  delete(staffId: string): Promise<void>;
}

export class StaffReadModelRepository implements IStaffReadModelRepository {
  private readonly supabaseClient: SupabaseClient;
  private readonly logger: ILogger;
  private readonly schema: string = "provider_schema";
  private readonly tableName: string = "staff_read_model";

  constructor(supabaseClient: SupabaseClient, logger: ILogger) {
    this.supabaseClient = supabaseClient;
    this.logger = logger;
  }

  async findById(staffId: string): Promise<StaffReadModel | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select("*")
        .eq("staff_id", staffId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw new Error(`Failed to find staff read model: ${error.message}`);
      }

      return this.mapToReadModel(data);
    } catch (error) {
      this.logger.error("Error finding staff read model by ID", {
        staffId,
        error,
      });
      throw error;
    }
  }

  async findAll(
    limit: number = 50,
    offset: number = 0,
  ): Promise<StaffReadModel[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select("*")
        .order("average_rating", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(
          `Failed to find all staff read models: ${error.message}`,
        );
      }

      return (data || []).map(this.mapToReadModel);
    } catch (error) {
      this.logger.error("Error finding all staff read models", { error });
      throw error;
    }
  }

  async findByDepartment(department: string): Promise<StaffReadModel[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select("*")
        .eq("department", department)
        .order("average_rating", { ascending: false });

      if (error) {
        throw new Error(`Failed to find staff by department: ${error.message}`);
      }

      return (data || []).map(this.mapToReadModel);
    } catch (error) {
      this.logger.error("Error finding staff by department", {
        department,
        error,
      });
      throw error;
    }
  }

  async findTopRated(limit: number = 10): Promise<StaffReadModel[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select("*")
        .gte("total_reviews", 5)
        .order("average_rating", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to find top rated staff: ${error.message}`);
      }

      return (data || []).map(this.mapToReadModel);
    } catch (error) {
      this.logger.error("Error finding top rated staff", { error });
      throw error;
    }
  }

  async upsertProfile(props: StaffReadModelCreateProps): Promise<void> {
    try {
      this.logger.warn("Upserting staff read model (start)", { props });
      const existing = await this.findById(props.staffId);
      if (!existing) {
        await this.create(props);
        return;
      }

      const updatePayload = {
        user_id: props.userId,
        full_name: props.fullName,
        specialization: props.specialization || null,
        department: props.department || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabaseClient
        .from(this.tableName)
        .update(updatePayload)
        .eq("staff_id", props.staffId);

      if (error) {
        throw new Error(`Failed to update staff read model: ${error.message}`);
      }

      this.logger.warn("Staff read model upserted", {
        staffId: props.staffId,
        updatePayload,
      });
    } catch (error) {
      this.logger.error("Error upserting staff read model", {
        props,
        error,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
      throw error;
    }
  }

  async create(props: StaffReadModelCreateProps): Promise<void> {
    try {
      const payload = {
        staff_id: props.staffId,
        user_id: props.userId,
        full_name: props.fullName,
        specialization: props.specialization || null,
        department: props.department || null,
        average_rating: 0.0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        last_review_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabaseClient
        .from(this.tableName)
        .insert(payload);

      if (error) {
        this.logger.error("Supabase insert staff_read_model failed", {
          table: this.tableName,
          schema: this.schema,
          payload,
          error,
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
        });

        // Fallback: try fully qualified table name if header schema is ignored
        const { error: fallbackError } = await this.supabaseClient
          .from(`${this.schema}.${this.tableName}`)
          .insert(payload);

        if (fallbackError) {
          const message =
            (fallbackError as any)?.message ||
            (fallbackError as any)?.hint ||
            JSON.stringify(fallbackError);
          throw new Error(`Failed to create staff read model: ${message}`);
        }
      }

      this.logger.info("Staff read model created", { staffId: props.staffId });
    } catch (error) {
      this.logger.error("Error creating staff read model", { props, error });
      throw error;
    }
  }

  async updateRating(
    staffId: string,
    props: StaffReadModelUpdateProps,
  ): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (props.averageRating !== undefined) {
        updateData.average_rating = props.averageRating;
      }

      if (props.totalReviews !== undefined) {
        updateData.total_reviews = props.totalReviews;
      }

      if (props.ratingDistribution !== undefined) {
        updateData.rating_distribution = props.ratingDistribution;
      }

      if (props.lastReviewDate !== undefined) {
        updateData.last_review_date = props.lastReviewDate.toISOString();
      }

      const { error } = await this.supabaseClient
        .from(this.tableName)
        .update(updateData)
        .eq("staff_id", staffId);

      if (error) {
        throw new Error(`Failed to update staff read model: ${error.message}`);
      }

      this.logger.info("Staff read model updated", { staffId, props });
    } catch (error) {
      this.logger.error("Error updating staff read model", {
        staffId,
        props,
        error,
      });
      throw error;
    }
  }

  async delete(staffId: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from(this.tableName)
        .delete()
        .eq("staff_id", staffId);

      if (error) {
        throw new Error(`Failed to delete staff read model: ${error.message}`);
      }

      this.logger.info("Staff read model deleted", { staffId });
    } catch (error) {
      this.logger.error("Error deleting staff read model", { staffId, error });
      throw error;
    }
  }

  private mapToReadModel(data: any): StaffReadModel {
    return {
      staffId: data.staff_id,
      userId: data.user_id,
      fullName: data.full_name,
      specialization: data.specialization,
      department: data.department,
      averageRating: parseFloat(data.average_rating) || 0,
      totalReviews: data.total_reviews || 0,
      ratingDistribution: data.rating_distribution as RatingDistribution,
      lastReviewDate: data.last_review_date
        ? new Date(data.last_review_date)
        : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
