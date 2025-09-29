import logger from "@hospital/shared/dist/utils/logger";
import { Request, Response } from "express";
import { supabaseAdmin } from "../config/database.config";

// Healthcare Controller for FHIR and Diagnosis operations
export class HealthcareController {
  // Get FHIR-compliant appointment data
  async getFHIRAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { appointment_id } = req.params;

      const { data: appointment, error } = await supabaseAdmin
        .from("appointments")
        .select(
          `
          *,
          doctor_profiles!doctor_id (
            doctor_id,
            specialization,
            profiles!user_id (
              full_name
            )
          ),
          patient_profiles!patient_id (
            patient_id,
            profiles!user_id (
              full_name
            )
          )
        `
        )
        .eq("appointment_id", appointment_id)
        .single();

      if (error) {
        logger.error("Error fetching FHIR appointment:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch FHIR appointment data",
        });
        return;
      }

      if (!appointment) {
        res.status(404).json({
          success: false,
          error: "Appointment not found",
        });
        return;
      }

      // Convert to FHIR format
      const fhirAppointment = {
        resourceType: "Appointment",
        id: appointment.appointment_id,
        status: appointment.status,
        serviceCategory: [
          {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/service-category",
                code: "gp",
                display: "General Practice",
              },
            ],
          },
        ],
        serviceType: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/service-type",
                code: appointment.appointment_type || "consultation",
                display: appointment.appointment_type || "Consultation",
              },
            ],
          },
        ],
        start: `${appointment.appointment_date}T${appointment.appointment_time}`,
        end: appointment.duration_minutes
          ? new Date(
              new Date(
                `${appointment.appointment_date}T${appointment.appointment_time}`
              ).getTime() +
                appointment.duration_minutes * 60000
            ).toISOString()
          : undefined,
        participant: [
          {
            actor: {
              reference: `Practitioner/${appointment.doctor_id}`,
              display: appointment.doctor_profiles?.profiles?.full_name,
            },
            status: "accepted",
          },
          {
            actor: {
              reference: `Patient/${appointment.patient_id}`,
              display: appointment.patient_profiles?.profiles?.full_name,
            },
            status: "accepted",
          },
        ],
      };

      res.json({
        success: true,
        data: fhirAppointment,
      });
    } catch (error) {
      logger.error("Exception in getFHIRAppointment:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Add diagnosis to appointment
  async addDiagnosis(req: Request, res: Response): Promise<void> {
    try {
      const { appointment_id } = req.params;
      const { diagnosis, icd10_code, notes } = req.body;

      if (!diagnosis) {
        res.status(400).json({
          success: false,
          error: "Diagnosis is required",
        });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("appointments")
        .update({
          diagnosis,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("appointment_id", appointment_id)
        .select()
        .single();

      if (error) {
        logger.error("Error adding diagnosis:", error);
        res.status(500).json({
          success: false,
          error: "Failed to add diagnosis",
        });
        return;
      }

      res.json({
        success: true,
        data,
        message: "Diagnosis added successfully",
      });
    } catch (error) {
      logger.error("Exception in addDiagnosis:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Get ICD-10 codes
  async getICD10Codes(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;

      // Mock ICD-10 codes - in production, this would come from a proper ICD-10 database
      const mockICD10Codes = [
        {
          code: "Z00.00",
          description:
            "Encounter for general adult medical examination without abnormal findings",
        },
        { code: "K59.00", description: "Constipation, unspecified" },
        { code: "R50.9", description: "Fever, unspecified" },
        {
          code: "J06.9",
          description: "Acute upper respiratory infection, unspecified",
        },
        { code: "M79.3", description: "Panniculitis, unspecified" },
      ];

      let filteredCodes = mockICD10Codes;

      if (search) {
        const searchTerm = search.toString().toLowerCase();
        filteredCodes = mockICD10Codes.filter(
          (code) =>
            code.code.toLowerCase().includes(searchTerm) ||
            code.description.toLowerCase().includes(searchTerm)
        );
      }

      res.json({
        success: true,
        data: filteredCodes,
      });
    } catch (error) {
      logger.error("Exception in getICD10Codes:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
