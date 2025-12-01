/**
 * Quick script to run CancelAppointmentUseCase for debugging seeded data
 */
import "dotenv/config";
import { CancelAppointmentUseCase } from "../src/application/use-cases/CancelAppointment.use-case";
import { SupabaseAppointmentRepository } from "../src/infrastructure/persistence/SupabaseAppointmentRepository";
import { AuthorizationService } from "../src/infrastructure/services/AuthorizationService";
import { IReminderService } from "../src/application/services/IReminderService";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const appointmentRepository = new SupabaseAppointmentRepository(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

const authorizationService = new AuthorizationService(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

const reminderService = {
  cancelReminders: async (appointmentId: string) => {
    console.log(`[debug] Skipping reminder cancellation for ${appointmentId}`);
  },
} as unknown as IReminderService;

const appointmentId = process.argv[2];
const cancelledBy = process.argv[3] || "9fdde38c-2e2c-493a-9156-b048ec6241a8";

if (!appointmentId) {
  console.error(
    "Usage: ts-node scripts/debug-cancel.ts <appointmentId> [userId]",
  );
  process.exit(1);
}

const cancelUseCase = new CancelAppointmentUseCase(
  appointmentRepository,
  authorizationService,
  reminderService,
);

cancelUseCase
  .execute(
    {
      appointmentId,
      cancellationReason: "debug-cancel",
      cancelledBy,
    },
    {
      userId: cancelledBy,
      timestamp: new Date(),
    },
  )
  .then((result) => {
    console.log("✅ Result:", JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
