import { Router, Request, Response } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Minimal chat API scoped to appointments
// Tables (appointments_schema):
// - chat_conversations (id, appointment_id, patient_id, doctor_id, created_at)
// - chat_messages (id, conversation_id, sender_id, sender_role, content, sent_at)

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[ChatRoutes] Missing Supabase credentials. Chat API will not work.",
  );
}

const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: "appointments_schema" } },
) as unknown as SupabaseClient;

async function getParticipants(appointmentId: string) {
  const { data, error } = await supabase
    .from("appointment_read_model")
    .select("patient_id, doctor_id")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getConversation(conversationId: string) {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function parseRoles(raw?: string) {
  try {
    return raw ? (JSON.parse(raw) as string[]).map((r) => r.toLowerCase()) : [];
  } catch {
    return [];
  }
}

function isParticipant(
  userId: string | undefined,
  patientId: string,
  doctorId: string,
  patientHeader?: string,
  providerHeader?: string,
  roles?: string[],
) {
  const normalizedRoles = (roles || []).map((r) => r.toLowerCase());

  // Simplified for project scope: if authenticated as patient/doctor, allow
  if (
    normalizedRoles.includes("patient") ||
    normalizedRoles.includes("doctor")
  ) {
    return true;
  }

  // Allow match by explicit participant headers (preferred)
  if (patientHeader && patientHeader === patientId) return true;
  if (providerHeader && providerHeader === doctorId) return true;

  // Fallback: match by userId if schemas overlap (less reliable)
  if (userId && (userId === patientId || userId === doctorId)) return true;
  return false;
}

export function createChatRoutes(): Router {
  const router = Router();

  // Create or get conversation for an appointment
  router.get(
    "/chat/conversations",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const appointmentId = req.query.appointmentId as string;
        const userId = req.header("x-user-id") as string | undefined;
        const patientHeader = req.header("x-patient-id") as string | undefined;
        const providerHeader = req.header("x-provider-id") as
          | string
          | undefined;
        const roles = parseRoles(
          req.header("x-user-roles") as string | undefined,
        );

        if (!appointmentId) {
          res
            .status(400)
            .json({ success: false, error: "Missing appointmentId" });
          return;
        }

        const participants = await getParticipants(appointmentId);
        if (!participants) {
          res
            .status(404)
            .json({ success: false, error: "Appointment not found" });
          return;
        }

        const { patient_id, doctor_id } = participants as any;
        if (
          !isParticipant(
            userId,
            patient_id,
            doctor_id,
            patientHeader,
            providerHeader,
            roles,
          )
        ) {
          res.status(403).json({ success: false, error: "Forbidden" });
          return;
        }

        // Try find existing
        const { data: existing, error: findError } = await supabase
          .from("chat_conversations")
          .select("*")
          .eq("appointment_id", appointmentId)
          .maybeSingle();
        if (findError) throw findError;

        if (existing) {
          res.json({
            success: true,
            conversationId: existing.id,
            appointmentId,
            patientId: patient_id,
            doctorId: doctor_id,
          });
          return;
        }

        // Create new
        const { data: created, error: insertError } = await supabase
          .from("chat_conversations")
          .insert({
            appointment_id: appointmentId,
            patient_id,
            doctor_id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        res.json({
          success: true,
          conversationId: created.id,
          appointmentId,
          patientId: patient_id,
          doctorId: doctor_id,
        });
      } catch (error: any) {
        console.error("[ChatRoutes] get conversation failed", error);
        res.status(500).json({ success: false, error: "Internal error" });
      }
    },
  );

  // List messages
  router.get(
    "/chat/conversations/:id/messages",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const conversationId = req.params.id;
        const userId = req.header("x-user-id") as string | undefined;
        const patientHeader = req.header("x-patient-id") as string | undefined;
        const providerHeader = req.header("x-provider-id") as
          | string
          | undefined;
        const roles = parseRoles(
          req.header("x-user-roles") as string | undefined,
        );

        const convo = await getConversation(conversationId);
        if (!convo) {
          res
            .status(404)
            .json({ success: false, error: "Conversation not found" });
          return;
        }
        if (
          !isParticipant(
            userId,
            (convo as any).patient_id,
            (convo as any).doctor_id,
            patientHeader,
            providerHeader,
            roles,
          )
        ) {
          res.status(403).json({ success: false, error: "Forbidden" });
          return;
        }

        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("sent_at", { ascending: true })
          .limit(100);
        if (error) throw error;

        res.json({ success: true, messages: data || [] });
      } catch (error: any) {
        console.error("[ChatRoutes] list messages failed", error);
        res.status(500).json({ success: false, error: "Internal error" });
      }
    },
  );

  // Send message
  router.post(
    "/chat/messages",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { conversationId, content } = req.body || {};
        const userId = req.header("x-user-id") as string | undefined;
        const patientHeader = req.header("x-patient-id") as string | undefined;
        const providerHeader = req.header("x-provider-id") as
          | string
          | undefined;
        const roles = parseRoles(
          req.header("x-user-roles") as string | undefined,
        );

        if (!conversationId || !content) {
          res.status(400).json({
            success: false,
            error: "Missing conversationId or content",
          });
          return;
        }

        const convo = await getConversation(conversationId);
        if (!convo) {
          res
            .status(404)
            .json({ success: false, error: "Conversation not found" });
          return;
        }

        const patientId = (convo as any).patient_id;
        const doctorId = (convo as any).doctor_id;

        if (
          !isParticipant(
            userId,
            patientId,
            doctorId,
            patientHeader,
            providerHeader,
            roles,
          )
        ) {
          res.status(403).json({ success: false, error: "Forbidden" });
          return;
        }

        const isPatientSender =
          (userId && userId === patientId) ||
          (!!patientHeader && patientHeader === patientId) ||
          roles.includes("patient");
        const isDoctorSender =
          (userId && userId === doctorId) ||
          (!!providerHeader && providerHeader === doctorId) ||
          roles.includes("doctor") ||
          roles.includes("staff");

        const senderRole = isPatientSender
          ? "patient"
          : isDoctorSender
            ? "doctor"
            : "unknown";

        const resolvedSenderId = isPatientSender
          ? patientHeader || userId || patientId
          : isDoctorSender
            ? providerHeader || userId || doctorId
            : userId || patientHeader || providerHeader || null;

        const { data, error } = await supabase
          .from("chat_messages")
          .insert({
            conversation_id: conversationId,
            sender_id: resolvedSenderId,
            sender_role: senderRole,
            content,
          })
          .select()
          .single();
        if (error) throw error;

        res.json({ success: true, message: data });
      } catch (error: any) {
        console.error("[ChatRoutes] send message failed", error);
        res.status(500).json({ success: false, error: "Internal error" });
      }
    },
  );

  return router;
}
