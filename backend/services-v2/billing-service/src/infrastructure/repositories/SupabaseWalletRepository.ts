import type { OptimizedSupabaseClient } from "@shared/infrastructure/database/optimized-supabase-client";
import {
  WalletAccount,
  WalletTransaction,
  WalletTransactionType,
} from "../../domain/entities/Wallet";
import {
  AdjustBalanceOptions,
  IWalletRepository,
} from "../../domain/repositories/IWalletRepository";

type Logger = Pick<typeof console, "info" | "error"> &
  Partial<Pick<typeof console, "warn">>;

interface WalletAccountRecord {
  patient_id: string;
  balance: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
}

interface WalletTransactionRecord {
  id: string;
  patient_id: string;
  transaction_type: WalletTransactionType;
  amount: number;
  balance_after: number;
  reference_id?: string | null;
  description?: string | null;
  metadata?: Record<string, any>;
  created_by?: string | null;
  created_at: string;
}

export class SupabaseWalletRepository implements IWalletRepository {
  private readonly accountsTable = "wallet_accounts";
  private readonly transactionsTable = "wallet_transactions";
  private readonly patientSchema = "patient_schema";
  private readonly patientsTable = "patients";

  constructor(
    private readonly supabase: OptimizedSupabaseClient,
    private readonly logger: Logger = console,
  ) {}

  async getAccount(patientId: string): Promise<WalletAccount | null> {
    const identifier = await this.preparePatientIdentifier(patientId);
    const record = await this.fetchAccountRecord(identifier);
    if (!record) {
      return null;
    }
    return this.mapAccount(record);
  }

  async getOrCreateAccount(
    patientId: string,
    currency: string = "VND",
  ): Promise<WalletAccount> {
    const identifier = await this.preparePatientIdentifier(patientId);
    const existing = await this.fetchAccountRecord(identifier);

    if (existing) {
      return this.mapAccount(existing);
    }

    const { data, error } = await this.supabase
      .from(this.accountsTable)
      .insert({
        patient_id: identifier.canonicalId,
        currency,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create wallet account: ${error.message}`);
    }

    return this.mapAccount(data as WalletAccountRecord);
  }

  async getRecentTransactions(
    patientId: string,
    limit: number = 20,
  ): Promise<WalletTransaction[]> {
    const identifier = await this.preparePatientIdentifier(patientId);
    const { data, error } = await this.supabase
      .from(this.transactionsTable)
      .select("*")
      .in("patient_id", identifier.searchValues)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch wallet transactions: ${error.message}`);
    }

    return (data as WalletTransactionRecord[]).map((record) =>
      this.mapTransaction(record),
    );
  }

  async adjustBalance(
    options: AdjustBalanceOptions,
  ): Promise<WalletTransaction> {
    const identifier = await this.preparePatientIdentifier(options.patientId);
    const resolvedPatientId = identifier.canonicalId;

    if (options.referenceId) {
      const existing = await this.findTransactionByReference(
        resolvedPatientId,
        options.referenceId,
        options.type,
      );
      if (existing) {
        this.logger.info("Wallet transaction already exists, skipping update", {
          patientId: resolvedPatientId,
          referenceId: options.referenceId,
          type: options.type,
        });
        return existing;
      }
    }

    const account = await this.getOrCreateAccount(
      resolvedPatientId,
      options.currency,
    );

    const newBalance = Number((account.balance + options.amount).toFixed(2));

    if (newBalance < 0) {
      throw new Error("Insufficient wallet balance");
    }

    const { error: updateError } = await this.supabase
      .from(this.accountsTable)
      .update({
        balance: newBalance,
        currency: account.currency,
        updated_by: options.createdBy || "system",
      })
      .eq("patient_id", account.patientId);

    if (updateError) {
      throw new Error(
        `Failed to update wallet balance: ${updateError.message}`,
      );
    }

    const transactionPayload = {
      patient_id: account.patientId,
      transaction_type: options.type,
      amount: Number(options.amount.toFixed(2)),
      balance_after: newBalance,
      reference_id: options.referenceId,
      description: options.description,
      metadata: options.metadata || {},
      created_by: options.createdBy || "system",
    };

    const { data, error: txError } = await this.supabase
      .from(this.transactionsTable)
      .insert(transactionPayload)
      .select("*")
      .single();

    if (txError) {
      this.logger.error("Wallet transaction insert failed", {
        patientId: options.patientId,
        error: txError.message,
      });
      throw new Error(
        `Failed to record wallet transaction: ${txError.message}`,
      );
    }

    return this.mapTransaction(data as WalletTransactionRecord);
  }

  private async findTransactionByReference(
    patientId: string,
    referenceId: string,
    type?: WalletTransactionType,
  ): Promise<WalletTransaction | null> {
    const identifier = await this.preparePatientIdentifier(patientId);
    let query = this.supabase
      .from(this.transactionsTable)
      .select("*")
      .in("patient_id", identifier.searchValues)
      .eq("reference_id", referenceId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (type) {
      query = query.eq("transaction_type", type);
    }

    const { data, error } = await query;

    if (error && error.code !== "PGRST116") {
      throw new Error(
        `Failed to check existing wallet transaction: ${error.message}`,
      );
    }

    const record = Array.isArray(data) ? data[0] : data;
    if (!record) {
      return null;
    }

    return this.mapTransaction(record as WalletTransactionRecord);
  }

  private mapAccount(record: WalletAccountRecord): WalletAccount {
    return {
      patientId: record.patient_id,
      balance: Number(record.balance),
      currency: record.currency,
      status: (record.status as "active" | "frozen") || "active",
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      updatedBy: record.updated_by,
    };
  }

  private mapTransaction(record: WalletTransactionRecord): WalletTransaction {
    return {
      id: record.id,
      patientId: record.patient_id,
      type: record.transaction_type,
      amount: Number(record.amount),
      balanceAfter: Number(record.balance_after),
      referenceId: record.reference_id,
      description: record.description,
      metadata: record.metadata || {},
      createdAt: new Date(record.created_at),
      createdBy: record.created_by,
    };
  }

  private async fetchAccountRecord(
    identifier: PatientIdentifierContext,
  ): Promise<WalletAccountRecord | null> {
    const { data, error } = await this.supabase
      .from(this.accountsTable)
      .select("*")
      .in("patient_id", identifier.searchValues)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch wallet account: ${error.message}`);
    }

    const records = (data as WalletAccountRecord[] | null) ?? [];
    if (records.length === 0) {
      return null;
    }

    let targetRecord =
      records.find((record) => record.patient_id === identifier.canonicalId) ??
      records[0];
    // Nếu tìm thấy bản ghi legacy (PAT) nhưng đã resolve được UUID thì migrate sang UUID
    if (
      targetRecord &&
      targetRecord.patient_id !== identifier.canonicalId &&
      this.isUUID(identifier.canonicalId)
    ) {
      await this.rekeyAccountIdentifier(
        targetRecord.patient_id,
        identifier.canonicalId,
      );
      targetRecord = { ...targetRecord, patient_id: identifier.canonicalId };
    }

    return targetRecord;
  }

  private async preparePatientIdentifier(
    identifier: string,
  ): Promise<PatientIdentifierContext> {
    if (!identifier) {
      throw new Error("patientId is required");
    }

    const trimmed = identifier.trim();
    const searchValues = new Set<string>([trimmed]);
    let canonicalId = trimmed;

    if (!this.isUUID(trimmed)) {
      const resolved = await this.resolvePatientIdentifier(trimmed);
      if (resolved) {
        canonicalId = resolved;
        searchValues.add(resolved);
      }
    }

    // Luôn cố gắng thêm mã PAT tương ứng để truy vấn legacy data
    const legacyCode = await this.fetchPatientCode(canonicalId);
    if (legacyCode) {
      searchValues.add(legacyCode);
    }

    return {
      canonicalId,
      searchValues: Array.from(searchValues),
    };
  }

  private async resolvePatientIdentifier(
    identifier: string,
  ): Promise<string | null> {
    if (this.isPatientCode(identifier)) {
      return await this.fetchPatientIdByColumn("patient_id", identifier);
    }

    // Nếu là UUID có thể là patient.id hoặc user_id
    if (this.isUUID(identifier)) {
      const byPatientId = await this.fetchPatientIdByColumn("id", identifier);
      if (byPatientId) {
        return byPatientId;
      }
      return await this.fetchPatientIdByColumn("user_id", identifier);
    }

    // Thử lần lượt patient_code -> user_id
    const byCode = await this.fetchPatientIdByColumn("patient_id", identifier);
    if (byCode) {
      return byCode;
    }

    return await this.fetchPatientIdByColumn("user_id", identifier);
  }

  private async fetchPatientIdByColumn(
    column: "id" | "patient_id" | "user_id",
    value: string,
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .getRawClient()
        .schema(this.patientSchema)
        .from(this.patientsTable)
        .select("id")
        .eq(column, value)
        .single();

      if (error) {
        if ((error as any)?.code === "PGRST116") {
          return null;
        }
        return null;
      }

      return (data as { id: string } | null)?.id ?? null;
    } catch {
      return null;
    }
  }

  private async fetchPatientCode(patientId: string): Promise<string | null> {
    if (!patientId || !this.isUUID(patientId)) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .getRawClient()
        .schema(this.patientSchema)
        .from(this.patientsTable)
        .select("patient_id")
        .eq("id", patientId)
        .single();

      if (error || !data) {
        return null;
      }

      return (data as { patient_id?: string }).patient_id ?? null;
    } catch {
      return null;
    }
  }

  private isUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private isPatientCode(value: string): boolean {
    return /^PAT-\d{6}-\d{3}$/i.test(value);
  }

  private async rekeyAccountIdentifier(
    currentId: string,
    targetId: string,
  ): Promise<void> {
    if (!targetId || currentId === targetId) {
      return;
    }

    // Nếu đã tồn tại account với targetId thì không làm gì (tránh conflict)
    try {
      const { data } = await this.supabase
        .from(this.accountsTable)
        .select("patient_id")
        .eq("patient_id", targetId)
        .single();
      if (data) {
        return;
      }
    } catch (error: any) {
      if (error?.code && error.code !== "PGRST116") {
        this.logger.warn?.(
          "Failed to check wallet account before normalization",
          {
            currentId,
            targetId,
            error: error.message,
          },
        );
        return;
      }
    }

    const { error: accountError } = await this.supabase
      .from(this.accountsTable)
      .update({ patient_id: targetId })
      .eq("patient_id", currentId);

    if (accountError) {
      this.logger.warn?.("Failed to normalize wallet account identifier", {
        currentId,
        targetId,
        error: accountError.message,
      });
      return;
    }

    const { error: txError } = await this.supabase
      .from(this.transactionsTable)
      .update({ patient_id: targetId })
      .eq("patient_id", currentId);

    if (txError) {
      this.logger.warn?.("Failed to normalize wallet transaction identifiers", {
        currentId,
        targetId,
        error: txError.message,
      });
    }
  }
}

interface PatientIdentifierContext {
  canonicalId: string;
  searchValues: string[];
}
