const {
  createOptimizedSupabaseClient,
} = require("./dist/shared/infrastructure/database/optimized-supabase-client");
const {
  SupabaseInvoiceRepository,
} = require("./dist/billing-service/src/infrastructure/repositories/SupabaseInvoiceRepository");
const {
  RabbitMQEventBus,
} = require("./dist/shared/infrastructure/event-bus/EventBus");
const {
  ExpirePendingInvoicesUseCase,
} = require("./dist/billing-service/src/application/use-cases/ExpirePendingInvoicesUseCase");

async function forceExpireInvoice(invoiceNumber) {
  const supabase = createOptimizedSupabaseClient({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    schemaName: process.env.DATABASE_SCHEMA,
    serviceName: "billing-service-manual-expire",
    enableOptimizations: true,
  });

  const { data, error } = await supabase
    .from("invoices")
    .select("id, created_at")
    .or(
      `invoice_id.eq.${invoiceNumber},vietnamese_invoice_number.eq.${invoiceNumber}`,
    )
    .single();

  if (error || !data) {
    throw new Error(`Invoice ${invoiceNumber} not found: ${error?.message}`);
  }

  const createdAtMs = new Date(data.created_at).getTime();
  const desiredMs = Date.now() - 40 * 60 * 1000;
  const dueDateMs = Math.max(createdAtMs + 60 * 1000, desiredMs);
  const pastIso = new Date(dueDateMs).toISOString();
  const { error: updateErr } = await supabase
    .from("invoices")
    .update({ due_date: pastIso })
    .eq("id", data.id);

  if (updateErr) {
    throw new Error(
      `Failed to backdate invoice ${invoiceNumber}: ${updateErr.message}`,
    );
  }

  const repository = new SupabaseInvoiceRepository(supabase);
  const eventBus = new RabbitMQEventBus({
    rabbitmqUrl: process.env.RABBITMQ_URL,
    exchangeName: process.env.RABBITMQ_EXCHANGE || "hospital.events",
    serviceName: "billing-service-manual-expire",
  });
  await eventBus.connect();

  try {
    const useCase = new ExpirePendingInvoicesUseCase(repository, eventBus);
    const result = await useCase.execute(new Date());
    console.log("Manual expire result:", result);
  } finally {
    await eventBus.disconnect();
    if (typeof supabase.close === "function") {
      await supabase.close();
    }
  }
}

const invoiceNumber = process.argv[2];
if (!invoiceNumber) {
  console.error("Usage: node manual-expire.js <invoiceNumber>");
  process.exit(1);
}

forceExpireInvoice(invoiceNumber)
  .then(() => {
    console.log(`Invoice ${invoiceNumber} processed`);
  })
  .catch((err) => {
    console.error("Manual expire failed:", err);
    process.exit(1);
  });
