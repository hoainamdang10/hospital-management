import { createClient } from "@supabase/supabase-js";
import { config } from "../config/config";
import { logger } from "./logger";

// Create Supabase client with service role for backend operations
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create regular client for user operations
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Database interface
export interface Document {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  checksum?: string;
  upload_status: "pending" | "completed" | "failed" | "deleted";
  virus_scan_status?: "pending" | "clean" | "infected" | "error";
  verified?: boolean;
  verified_by?: string;
  verified_at?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentInsert {
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  checksum?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

export interface DocumentUpdate {
  upload_status?: "pending" | "completed" | "failed" | "deleted";
  virus_scan_status?: "pending" | "clean" | "infected" | "error";
  metadata?: Record<string, any>;
  expires_at?: string;
}

// Database helper functions
export const documentService = {
  // Insert new document record
  async create(document: DocumentInsert): Promise<Document> {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .insert(document)
      .select()
      .single();

    if (error) {
      logger.error("Error creating document record", { error, document });
      throw new Error(`Failed to create document record: ${error.message}`);
    }

    return data;
  },

  // Get document by ID
  async getById(id: string, userId?: string): Promise<Document | null> {
    let query = supabaseAdmin.from("documents").select("*").eq("id", id);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      logger.error("Error fetching document", { error, id, userId });
      throw new Error(`Failed to fetch document: ${error.message}`);
    }

    return data;
  },

  // Get user documents with filters
  async getUserDocuments(
    userId: string,
    filters?: {
      document_type?: string;
      upload_status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ documents: Document[]; total: number }> {
    let query = supabaseAdmin
      .from("documents")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .neq("upload_status", "deleted")
      .order("created_at", { ascending: false });

    if (filters?.document_type) {
      query = query.eq("document_type", filters.document_type);
    }

    if (filters?.upload_status) {
      query = query.eq("upload_status", filters.upload_status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error("Error fetching user documents", { error, userId, filters });
      throw new Error(`Failed to fetch user documents: ${error.message}`);
    }

    return {
      documents: data || [],
      total: count || 0,
    };
  },

  // Update document
  async update(id: string, updates: DocumentUpdate): Promise<Document> {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating document", { error, id, updates });
      throw new Error(`Failed to update document: ${error.message}`);
    }

    return data;
  },

  // Soft delete document
  async delete(id: string, userId?: string): Promise<void> {
    let query = supabaseAdmin
      .from("documents")
      .update({
        upload_status: "deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { error } = await query;

    if (error) {
      logger.error("Error deleting document", { error, id, userId });
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  },
};
